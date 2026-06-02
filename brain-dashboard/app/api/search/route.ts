import { NextRequest, NextResponse } from 'next/server'
import { searchVaultIndex } from '@/lib/supabase'
import { walkVaultMd, readVaultFile } from '@/lib/vault'
import { parseNote } from '@/lib/parse'
import Fuse from 'fuse.js'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json({ results: [] })

  // Try Supabase full-text first
  try {
    const rows = await searchVaultIndex(q)
    if (rows.length > 0) return NextResponse.json({ results: rows, source: 'supabase' })
  } catch {
    // fall through to in-memory search
  }

  // In-memory fallback: walk vault, parse, fuse search
  try {
    const files = await walkVaultMd('', 4)
    const notes = await Promise.all(
      files.slice(0, 200).map(async (f) => {
        try {
          const raw = await readVaultFile(f.path)
          return parseNote(f.path, raw)
        } catch {
          return null
        }
      })
    )
    const valid = notes.filter(Boolean) as NonNullable<typeof notes[0]>[]
    const fuse = new Fuse(valid, {
      keys: ['title', 'body', 'tags'],
      threshold: 0.4,
      includeScore: true,
    })
    const results = fuse.search(q, { limit: 20 }).map((r) => ({
      path: r.item.path,
      title: r.item.title,
      body: r.item.body.slice(0, 300),
      tags: r.item.tags,
      score: r.score,
    }))
    return NextResponse.json({ results, source: 'fuse' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
