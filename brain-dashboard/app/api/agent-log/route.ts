import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, logAgentAction } from '@/lib/supabase'

export async function GET() {
  try {
    const sb = getSupabase()
    const { data } = await sb
      .from('agent_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ logs: data ?? [] })
  } catch (err) {
    return NextResponse.json({ logs: [], error: String(err) })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agent, action, note_path, detail } = await req.json()
    await logAgentAction(agent, action, note_path, detail)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
