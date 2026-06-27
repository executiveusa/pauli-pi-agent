import { NextRequest, NextResponse } from 'next/server'
import { readVaultFile } from '@/lib/vault'
import { parseNote } from '@/lib/parse'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })
  try {
    const raw = await readVaultFile(path)
    const note = parseNote(path, raw)
    return NextResponse.json(note)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
