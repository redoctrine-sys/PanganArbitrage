import { supabase } from '@/lib/supabase'
import type { NamingQueueItem } from '@/types/naming'

export async function getNamingQueue(type?: 'city' | 'commodity') {
  let query = supabase
    .from('naming_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error
  return data as NamingQueueItem[]
}

export async function getNamingQueueCounts() {
  const { count: cityCount } = await supabase
    .from('naming_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('type', 'city')

  const { count: commCount } = await supabase
    .from('naming_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('type', 'commodity')

  return { city: cityCount ?? 0, commodity: commCount ?? 0 }
}
