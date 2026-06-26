import { NextResponse } from 'next/server'
import { getRuntimeStatus } from '@/lib/mercury'

export async function GET() {
  const runtime = getRuntimeStatus()
  const ok = runtime.status === 'ready'

  return NextResponse.json(
    {
      ok,
      status: runtime.status,
      model: runtime.mercury.model,
      mercury: runtime.mercury,
      voice: runtime.voice,
    },
    { status: ok ? 200 : 503 }
  )
}
