import { NextRequest, NextResponse } from 'next/server'
import { createPauliUserScopedSupabase } from '@/lib/pauli-supabase'

const MISSION_WRITER_ROLES = new Set(['owner', 'admin', 'operator'])
const COMPLETION_LEVELS = new Set([
  'IMPLEMENTED',
  'VERIFIED',
  'DEPLOYED',
  'HEALTHY',
  'OUTCOME_ACHIEVED',
  'BUSINESS_OUTCOME_MEASURED',
])
const LANGUAGES = new Set(['en', 'es-MX', 'mixed'])

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length).trim() || null
}

function missionTitle(intent: string): string {
  const compact = intent.replace(/\s+/g, ' ').trim()
  if (compact.length <= 72) return compact
  return `${compact.slice(0, 69).trimEnd()}…`
}

export async function POST(req: NextRequest) {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const supabase = createPauliUserScopedSupabase(accessToken)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken)

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  let input: {
    intent?: unknown
    organizationId?: unknown
    requestId?: unknown
    language?: unknown
    priority?: unknown
    completionLevel?: unknown
    autonomousBudgetCents?: unknown
  }

  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const intent = typeof input.intent === 'string' ? input.intent.trim() : ''
  if (intent.length < 3 || intent.length > 5000) {
    return NextResponse.json(
      { error: 'Intent must be between 3 and 5000 characters' },
      { status: 400 }
    )
  }

  const requestId = typeof input.requestId === 'string' ? input.requestId : crypto.randomUUID()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return NextResponse.json({ error: 'requestId must be a UUID v4' }, { status: 400 })
  }

  const requestedOrganizationId =
    typeof input.organizationId === 'string' ? input.organizationId : null

  const { data: memberships, error: membershipError } = await supabase
    .schema('pauli')
    .from('memberships')
    .select('organization_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (membershipError) {
    return NextResponse.json(
      { error: 'Unable to resolve Pauli membership', detail: membershipError.message },
      { status: 500 }
    )
  }

  const membership = memberships?.find(
    (candidate) =>
      (!requestedOrganizationId || candidate.organization_id === requestedOrganizationId) &&
      MISSION_WRITER_ROLES.has(String(candidate.role).toLowerCase())
  )

  if (!membership) {
    return NextResponse.json(
      { error: 'Your Pauli role cannot create missions for this organization' },
      { status: 403 }
    )
  }

  const language =
    typeof input.language === 'string' && LANGUAGES.has(input.language)
      ? input.language
      : 'en'
  const completionLevel =
    typeof input.completionLevel === 'string' && COMPLETION_LEVELS.has(input.completionLevel)
      ? input.completionLevel
      : 'OUTCOME_ACHIEVED'
  const priority =
    typeof input.priority === 'number' && Number.isInteger(input.priority)
      ? Math.min(100, Math.max(0, input.priority))
      : 50
  const autonomousBudgetCents =
    typeof input.autonomousBudgetCents === 'number' &&
    Number.isInteger(input.autonomousBudgetCents) &&
    input.autonomousBudgetCents >= 0
      ? input.autonomousBudgetCents
      : 0

  const { data: existingMission, error: existingError } = await supabase
    .schema('pauli')
    .from('missions')
    .select(
      'id, organization_id, correlation_id, title, requested_outcome, required_completion_level, status, priority, autonomous_budget_cents, spent_cents, attempt_count, created_at, updated_at'
    )
    .eq('organization_id', membership.organization_id)
    .eq('created_by', user.id)
    .eq('correlation_id', requestId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json(
      { error: 'Unable to check mission idempotency', detail: existingError.message },
      { status: 500 }
    )
  }

  if (existingMission) {
    return NextResponse.json({ mission: existingMission, reused: true })
  }

  const { data: mission, error: missionError } = await supabase
    .schema('pauli')
    .from('missions')
    .insert({
      organization_id: membership.organization_id,
      created_by: user.id,
      correlation_id: requestId,
      title: missionTitle(intent),
      intent_original: intent,
      intent_normalized: intent,
      language,
      requested_outcome: intent,
      required_completion_level: completionLevel,
      status: 'INTENT',
      priority,
      autonomous_budget_cents: autonomousBudgetCents,
      metadata: {
        source: 'mission-control',
        interface: 'chat-first',
        request_id: requestId,
      },
    })
    .select(
      'id, organization_id, correlation_id, title, requested_outcome, required_completion_level, status, priority, autonomous_budget_cents, spent_cents, attempt_count, created_at, updated_at'
    )
    .single()

  if (missionError || !mission) {
    return NextResponse.json(
      { error: 'Unable to create mission intent', detail: missionError?.message ?? 'No mission returned' },
      { status: 500 }
    )
  }

  const eventIdempotencyKey = `mission-created:${requestId}`
  const { error: eventError } = await supabase
    .schema('pauli')
    .from('mission_events')
    .insert({
      organization_id: membership.organization_id,
      mission_id: mission.id,
      correlation_id: mission.correlation_id,
      event_type: 'MISSION_CREATED',
      source: 'mission-control',
      idempotency_key: eventIdempotencyKey,
      public_summary: `Mission intent created: ${mission.title}`,
      visibility: 'tenant',
      payload: {
        requested_outcome: mission.requested_outcome,
        created_by: user.id,
      },
    })

  return NextResponse.json(
    {
      mission,
      reused: false,
      eventRecorded: !eventError,
      eventWarning: eventError ? eventError.message : null,
    },
    { status: 201 }
  )
}
