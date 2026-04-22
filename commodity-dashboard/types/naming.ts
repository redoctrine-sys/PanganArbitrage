export type NamingQueueItem = {
  id: string
  type: 'city' | 'commodity'
  review_subtype: 'typo' | 'new' | 'pair' | null
  raw_value: string
  suggestion: string | null
  canonical_id: string | null
  pair_target_id: string | null
  similarity_score: number | null
  method: 'exact' | 'fuzzy' | 'gemini' | 'manual' | null
  source: string | null
  source_count: number
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  reviewed_at: string | null
  reviewer_note: string | null
  created_at: string
}
