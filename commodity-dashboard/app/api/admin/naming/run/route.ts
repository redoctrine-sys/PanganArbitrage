import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Naming Agent dinonaktifkan sementara' }, { status: 503 })
}
