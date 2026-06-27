import { NextRequest, NextResponse } from 'next/server'
import { listVaultPath } from '@/lib/vault'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') ?? ''
  try {
    const files = await listVaultPath(path)
    return NextResponse.json({ files })
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
