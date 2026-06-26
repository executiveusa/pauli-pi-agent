import { NextRequest, NextResponse } from 'next/server'
import { runMercuryChat, type MercuryMessage, type MercuryTask } from '@/lib/mercury'

const ALLOWED_TASKS = new Set<MercuryTask>([
  'mercury-diffusion',
  'mercury-voice',
  'mercury-operator',
  'default',
])

function isMessage(value: unknown): value is MercuryMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MercuryMessage>
  return (
    (candidate.role === 'user' || candidate.role === 'assistant' || candidate.role === 'system') &&
    typeof candidate.content === 'string'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const task = ALLOWED_TASKS.has(body?.task) ? body.task as MercuryTask : 'mercury-diffusion'
    const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt : undefined

    if (!messages.length || !messages.every(isMessage)) {
      return NextResponse.json({ error: 'messages must be a non-empty chat message array' }, { status: 400 })
    }

    const startedAt = Date.now()
    const result = await runMercuryChat(messages, task, systemPrompt)

    return NextResponse.json({
      ...result,
      tenantId: typeof body?.tenantId === 'string' ? body.tenantId : 'client_demo',
      task,
      latencyMs: Date.now() - startedAt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat route failure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
