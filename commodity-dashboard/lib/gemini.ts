import { GoogleGenerativeAI } from '@google/generative-ai'

let _client: GoogleGenerativeAI | null = null

function getClient() {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY not set')
    _client = new GoogleGenerativeAI(key)
  }
  return _client
}

export type GeminiRecommendation = {
  recommendation: 'BELI' | 'TUNGGU' | 'HINDARI'
  reasoning: string
  timing: string
  risk_flag: string | null
}

export type ArbitrageContext = {
  commodity: string
  city_buy: string
  city_sell: string
  price_buy: number
  price_sell: number
  gross_spread_pct: number
  net_profit_per_kg: number | null
  roi_pct: number | null
  distance_km: number | null
  route_type: string | null
  risk_score: 'RENDAH' | 'SEDANG' | 'TINGGI' | null
}

const SYSTEM_PROMPT = `Anda adalah analis arbitrase komoditas pangan Indonesia yang berpengalaman.
Berikan analisis singkat dan rekomendasi berdasarkan data peluang arbitrase yang diberikan.
Jawab HANYA dalam format JSON yang valid dengan field berikut:
- recommendation: "BELI" | "TUNGGU" | "HINDARI"
- reasoning: string (1-2 kalimat, Bahasa Indonesia)
- timing: string (saran waktu eksekusi, contoh: "Segera dalam 24 jam" atau "Tunggu hingga akhir minggu")
- risk_flag: string | null (flag risiko spesifik jika ada, null jika tidak ada)

Pertimbangkan: spread kotor vs bersih, jarak, ROI, risiko musiman, dan kondisi pasar pangan Indonesia.
BELI: ROI > 15%, viable, spread tinggi. TUNGGU: ROI 5-15% atau kondisi tidak pasti. HINDARI: ROI < 5%, tidak viable, atau risiko tinggi.`

export async function analyzeArbitrageOpportunity(
  ctx: ArbitrageContext
): Promise<GeminiRecommendation> {
  const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `${SYSTEM_PROMPT}

Data peluang arbitrase:
- Komoditas: ${ctx.commodity}
- Beli di: ${ctx.city_buy}
- Jual di: ${ctx.city_sell}
- Harga beli: Rp ${ctx.price_buy.toLocaleString('id-ID')}/kg
- Harga jual: Rp ${ctx.price_sell.toLocaleString('id-ID')}/kg
- Gross spread: ${ctx.gross_spread_pct.toFixed(2)}%
- Net profit/kg: ${ctx.net_profit_per_kg != null ? `Rp ${ctx.net_profit_per_kg.toLocaleString('id-ID')}` : 'belum dihitung'}
- ROI: ${ctx.roi_pct != null ? `${ctx.roi_pct.toFixed(2)}%` : 'belum dihitung'}
- Jarak: ${ctx.distance_km != null ? `${ctx.distance_km} km` : 'tidak diketahui'}
- Rute: ${ctx.route_type ?? 'tidak diketahui'}
- Risk score awal: ${ctx.risk_score ?? 'belum dinilai'}

Berikan analisis dan rekomendasi dalam JSON:`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = jsonMatch ? jsonMatch[1].trim() : text

  try {
    const parsed = JSON.parse(jsonText) as GeminiRecommendation
    // Validate recommendation value
    if (!['BELI', 'TUNGGU', 'HINDARI'].includes(parsed.recommendation)) {
      parsed.recommendation = 'TUNGGU'
    }
    return parsed
  } catch {
    return {
      recommendation: 'TUNGGU',
      reasoning: 'Analisis tidak dapat dilakukan saat ini.',
      timing: 'Evaluasi manual diperlukan',
      risk_flag: 'AI parsing error',
    }
  }
}

export async function batchAnalyzeOpportunities(
  opportunities: ArbitrageContext[],
  maxBatch = 5
): Promise<Map<number, GeminiRecommendation>> {
  const results = new Map<number, GeminiRecommendation>()
  const batch = opportunities.slice(0, maxBatch)

  await Promise.allSettled(
    batch.map(async (ctx, i) => {
      try {
        const rec = await analyzeArbitrageOpportunity(ctx)
        results.set(i, rec)
      } catch (err) {
        console.error(`[gemini] batch item ${i} failed:`, err)
        results.set(i, {
          recommendation: 'TUNGGU',
          reasoning: 'Gagal menganalisis peluang ini.',
          timing: 'Coba lagi nanti',
          risk_flag: 'API error',
        })
      }
    })
  )

  return results
}
