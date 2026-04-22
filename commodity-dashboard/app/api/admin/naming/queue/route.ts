import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as 'city' | 'commodity' | null

  let query = supabase
    .from('naming_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
