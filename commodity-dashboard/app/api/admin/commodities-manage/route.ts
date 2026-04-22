import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, unit, category, is_sp2kp } = body
    if (!name || !unit) {
      return NextResponse.json({ error: 'name dan unit wajib diisi' }, { status: 400 })
    }
    const db = getServiceClient()
    const { data, error } = await db
      .from('commodities')
      .insert({ name: name.trim(), unit: unit.trim(), category: category ?? null, is_sp2kp: is_sp2kp ?? false })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
    const db = getServiceClient()
    const { data, error } = await db
      .from('commodities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
    const db = getServiceClient()
    const { error } = await db.from('commodities').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
