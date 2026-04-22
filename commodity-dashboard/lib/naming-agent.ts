import { getServiceClient } from '@/lib/supabase'

// ─── String similarity (no external deps) ───────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(' '))
  const setB = new Set(normalize(b).split(' '))
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

function stringSimilarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b)
  if (na === nb) return 1.0
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1.0
  const levScore = 1 - levenshtein(na, nb) / maxLen
  const jacScore = jaccardSimilarity(na, nb)
  return Math.max(levScore, jacScore)
}

type MatchResult = {
  id: string
  name: string
  score: number
  method: 'exact' | 'fuzzy'
}

function findBestMatch(raw: string, candidates: { id: string; name: string }[]): MatchResult | null {
  if (!candidates.length) return null
  const normRaw = normalize(raw)
  let best: MatchResult | null = null

  for (const c of candidates) {
    const normC = normalize(c.name)
    if (normRaw === normC) {
      return { id: c.id, name: c.name, score: 1.0, method: 'exact' }
    }
    // Also check sp2kp name variations
    const score = stringSimilarity(raw, c.name)
    if (!best || score > best.score) {
      best = { id: c.id, name: c.name, score, method: 'fuzzy' }
    }
  }
  return best
}

// ─── City Naming Agent ───────────────────────────────────────────────────────

export async function runCityReview(): Promise<{ processed: number; autoApproved: number; queued: number }> {
  const db = getServiceClient()
  let processed = 0, autoApproved = 0, queued = 0

  // Get distinct unresolved city_raw values from prices_raw
  const { data: pending } = await db
    .from('prices_raw')
    .select('city_raw, kode_wilayah, source')
    .is('city_id', null)
    .not('city_raw', 'is', null)

  if (!pending?.length) return { processed, autoApproved, queued }

  // Deduplicate by city_raw
  const uniqueRaws = [...new Map(pending.map((r) => [r.city_raw, r])).values()]

  // Get all canonical cities
  const { data: cities } = await db
    .from('cities')
    .select('id, name, name_sp2kp, kode_wilayah')

  if (!cities?.length) return { processed, autoApproved, queued }

  for (const item of uniqueRaws) {
    processed++

    // Already in queue?
    const { data: existing } = await db
      .from('naming_queue')
      .select('id, status')
      .eq('type', 'city')
      .eq('raw_value', item.city_raw)
      .single()

    if (existing) continue

    // Try kode_wilayah match first
    let match: MatchResult | null = null
    if (item.kode_wilayah) {
      const byKode = cities.find((c) => c.kode_wilayah === item.kode_wilayah)
      if (byKode) {
        match = { id: byKode.id, name: byKode.name, score: 1.0, method: 'exact' }
      }
    }

    // Fallback: name match (check both name and name_sp2kp)
    if (!match) {
      const candidates = [
        ...cities.map((c) => ({ id: c.id, name: c.name })),
        ...cities.filter((c) => c.name_sp2kp).map((c) => ({ id: c.id, name: c.name_sp2kp! })),
      ]
      match = findBestMatch(item.city_raw, candidates)
      // Resolve back to canonical id/name
      if (match) {
        const canonical = cities.find((c) => c.id === match!.id)
        if (canonical) match.name = canonical.name
      }
    }

    if (!match) continue

    if (match.score >= 0.95) {
      // Auto-approve: update prices_raw directly
      await db
        .from('prices_raw')
        .update({ city_id: match.id })
        .eq('city_raw', item.city_raw)
        .is('city_id', null)

      await db.from('naming_queue').insert({
        type: 'city',
        review_subtype: 'typo',
        raw_value: item.city_raw,
        suggestion: match.name,
        canonical_id: match.id,
        similarity_score: match.score,
        method: match.method,
        source: item.source,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewer_note: 'auto-approved',
      })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

      autoApproved++
    } else if (match.score >= 0.30) {
      await db.from('naming_queue').insert({
        type: 'city',
        review_subtype: 'typo',
        raw_value: item.city_raw,
        suggestion: match.name,
        canonical_id: match.id,
        similarity_score: match.score,
        method: match.method,
        source: item.source,
        status: 'pending',
      })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

      queued++
    } else {
      await db.from('naming_queue').insert({
        type: 'city',
        review_subtype: 'new',
        raw_value: item.city_raw,
        suggestion: null,
        canonical_id: null,
        similarity_score: match.score,
        method: match.method,
        source: item.source,
        status: 'pending',
      })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

      queued++
    }
  }

  return { processed, autoApproved, queued }
}

// ─── Commodity Naming Agent ──────────────────────────────────────────────────

export async function runCommodityReview(): Promise<{ processed: number; autoApproved: number; queued: number }> {
  const db = getServiceClient()
  let processed = 0, autoApproved = 0, queued = 0

  const { data: allCommodities } = await db
    .from('commodities')
    .select('id, name, is_sp2kp')

  if (!allCommodities?.length) return { processed, autoApproved, queued }

  const sp2kpList = allCommodities.filter((c) => c.is_sp2kp)

  // ── Jalur 1: Typo dari prices_raw (commodity_id IS NULL) ──
  const { data: pending } = await db
    .from('prices_raw')
    .select('commodity_raw, source')
    .is('commodity_id', null)
    .not('commodity_raw', 'is', null)

  if (pending?.length) {
    const uniqueRaws = [...new Map(pending.map((r) => [r.commodity_raw, r])).values()]

    for (const item of uniqueRaws) {
      processed++

      const { data: existing } = await db
        .from('naming_queue')
        .select('id')
        .eq('type', 'commodity')
        .eq('raw_value', item.commodity_raw)
        .maybeSingle()

      if (existing) continue

      const match = findBestMatch(item.commodity_raw, allCommodities.map((c) => ({ id: c.id, name: c.name })))
      if (!match) continue

      const subtype = match.score < 0.30 ? 'new' : 'typo'

      if (match.score >= 0.95 && match.method === 'exact') {
        // Auto-approve
        await db
          .from('prices_raw')
          .update({ commodity_id: match.id })
          .eq('commodity_raw', item.commodity_raw)
          .is('commodity_id', null)

        await db.from('naming_queue').insert({
          type: 'commodity',
          review_subtype: subtype,
          raw_value: item.commodity_raw,
          suggestion: match.name,
          canonical_id: match.id,
          similarity_score: match.score,
          method: match.method,
          source: item.source,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewer_note: 'auto-approved',
        })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

        autoApproved++
      } else {
        await db.from('naming_queue').insert({
          type: 'commodity',
          review_subtype: subtype,
          raw_value: item.commodity_raw,
          suggestion: match.score >= 0.30 ? match.name : null,
          canonical_id: match.score >= 0.30 ? match.id : null,
          similarity_score: match.score,
          method: match.method,
          source: item.source,
          status: 'pending',
        })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

        queued++
      }
    }
  }

  // ── Jalur 2: Pedagang-only commodity → pair suggestion ──
  const { data: pedagangOnly } = await db.rpc('get_pedagang_only_commodities')

  if (pedagangOnly?.length && sp2kpList.length) {
    for (const pedComm of pedagangOnly) {
      processed++

      const { data: existing } = await db
        .from('naming_queue')
        .select('id')
        .eq('type', 'commodity')
        .eq('raw_value', pedComm.commodity_name)
        .maybeSingle()

      if (existing) continue

      const match = findBestMatch(
        pedComm.commodity_name,
        sp2kpList.map((c) => ({ id: c.id, name: c.name }))
      )

      const subtype = match && match.score > 0.30 ? 'pair' : 'new'

      await db.from('naming_queue').insert({
        type: 'commodity',
        review_subtype: subtype,
        raw_value: pedComm.commodity_name,
        canonical_id: pedComm.commodity_id,
        pair_target_id: match && match.score > 0.30 ? match.id : null,
        suggestion: match && match.score > 0.30 ? match.name : null,
        similarity_score: match?.score ?? 0,
        method: match?.method ?? 'fuzzy',
        source: 'pedagang',
        status: 'pending',
      })
      // ignore duplicate (UNIQUE constraint on type,raw_value)

      queued++
    }
  }

  return { processed, autoApproved, queued }
}

// ─── Approve helpers ─────────────────────────────────────────────────────────

export async function approveTypo(queueId: string, canonicalId: string, note?: string) {
  const db = getServiceClient()

  const { data: item } = await db
    .from('naming_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (!item) throw new Error('Queue item not found')

  if (item.type === 'city') {
    await db
      .from('prices_raw')
      .update({ city_id: canonicalId })
      .eq('city_raw', item.raw_value)
      .is('city_id', null)
  } else {
    await db
      .from('prices_raw')
      .update({ commodity_id: canonicalId })
      .eq('commodity_raw', item.raw_value)
      .is('commodity_id', null)
  }

  await db
    .from('naming_queue')
    .update({
      status: 'approved',
      canonical_id: canonicalId,
      reviewed_at: new Date().toISOString(),
      reviewer_note: note ?? null,
    })
    .eq('id', queueId)
}

export async function approvePair(
  queueId: string,
  pairType: 'exact' | 'variant' | 'comparable',
  note?: string
) {
  const db = getServiceClient()

  const { data: item } = await db
    .from('naming_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (!item) throw new Error('Queue item not found')
  if (!item.canonical_id || !item.pair_target_id) throw new Error('Missing pair IDs')

  await db.from('commodity_pairs').upsert({
    commodity_a_id: item.canonical_id,
    commodity_b_id: item.pair_target_id,
    similarity_score: item.similarity_score,
    pair_type: pairType,
    approved_at: new Date().toISOString(),
    notes: note ?? null,
  }, { onConflict: 'commodity_a_id,commodity_b_id', ignoreDuplicates: false })

  await db
    .from('naming_queue')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewer_note: note ?? null,
    })
    .eq('id', queueId)
}

export async function approveAsNew(queueId: string, note?: string) {
  const db = getServiceClient()
  await db
    .from('naming_queue')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewer_note: note ?? 'Komoditas baru, masuk Section B',
    })
    .eq('id', queueId)
}

export async function rejectItem(queueId: string, note?: string) {
  const db = getServiceClient()
  await db
    .from('naming_queue')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewer_note: note ?? null,
    })
    .eq('id', queueId)
}
