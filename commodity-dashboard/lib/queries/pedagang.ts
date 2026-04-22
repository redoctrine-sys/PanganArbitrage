import { supabase } from '@/lib/supabase'

export async function getPedagangList() {
  const { data, error } = await supabase
    .from('pedagang')
    .select(`
      *,
      city:cities(id, name, province),
      harga:pedagang_harga(
        id, price, date, satuan,
        commodity:commodities(id, name, unit)
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPedagangStats() {
  const { count: totalPedagang } = await supabase
    .from('pedagang')
    .select('*', { count: 'exact', head: true })

  const { count: totalHarga } = await supabase
    .from('pedagang_harga')
    .select('*', { count: 'exact', head: true })

  const { data: recentHarga } = await supabase
    .from('pedagang_harga')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)

  return {
    totalPedagang: totalPedagang ?? 0,
    totalHarga: totalHarga ?? 0,
    lastDate: recentHarga?.[0]?.date ?? null,
  }
}
