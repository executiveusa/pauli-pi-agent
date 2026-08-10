import { NextRequest, NextResponse } from 'next/server'
import { createPauliUserScopedSupabase } from '@/lib/pauli-supabase'

const MISSION_START_ROLES = new Set(['owner', 'admin', 'operator'])

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length).trim() || null
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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

  let input: { missionId?: unknown }
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const missionId = typeof input.missionId === 'string' ? input.missionId : ''
  if (!isUuid(missionId)) {
    return NextResponse.json({ error: 'missionId must be a valid UUID' }, { status: 400 })
  }

  const { data: mission, error: missionError } = await supabase
    .schema('pauli')
    .from('missions')
    .select('id, organization_id, correlation_id, title, status, policy_snapshot, metadata')
    .eq('id', missionId)
    .maybeSingle()

  if (missionError) {
    return NextResponse.json(
      { error: 'Unable to load mission', detail: missionError.message },
      { status: 500 }
    )
  }

  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
  }

  const { data: membership, error: membershipError } = await supabase
    .schema('pauli')
    .from('memberships')
    .select('organization_id, role, status')
    .eq('organization_id', mission.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json(
      { error: 'Unable to resolve Pauli membership', detail: membershipError.message },
      { status: 500 }
    )
  }

  if (!membership || !MISSION_START_ROLES.has(String(membership.role).toLowerCase())) {
    return NextResponse.json(
      { error: 'Your Pauli role cannot start this mission' },
      { status: 403 }
    )
  }

  if (mission.status !== 'WAITING_APPROVAL') {
    return NextResponse.json(
      {
        error: 'Mission is not waiting for explicit start',
        currentStatus: mission.status,
      },
      { status: 409 }
    )
  }

  const releasedAt = new Date().toISOString()
  const policySnapshot =
    mission.policy_snapshot && typeof mission.policy_snapshot === 'object'
      ? mission.policy_snapshot
      : {}
  const metadata = mission.metadata && typeof mission.metadata === 'object' ? mission.metadata : {}

  const { data: releasedMission, error: releaseError } = await supabase
    .schema('pauli')
    .from('missions')
    .update({
      status: 'INTENT',
      policy_snapshot: {
        ...policySnapshot,
        execution_release: 'explicit_human_start',
        released_by: user.id,
        released_at: releasedAt,
      },
      metadata: {
        ...metadata,
        intake_state: 'released',
        released_by: user.id,
        released_at: releasedAt,
      },
      updated_at: releasedAt,
    })
    .eq('id', mission.id)
    .eq('organization_id', mission.organization_id)
    .eq('status', 'WAITING_APPROVAL')
    .select(
      'id, organization_id, correlation_id, title, requested_outcome, required_completion_level, status, priority, autonomous_budget_cents, spent_cents, attempt_count, created_at, updated_at'
    )
    .maybeSingle()

  if (releaseError) {
    return NextResponse.json(
      { error: 'Unable to release mission', detail: releaseError.message },
      { status: 500 }
    )
  }

  if (!releasedMission) {
    return NextResponse.json(
      { error: 'Mission state changed before it could be released' },
      { status: 409 }
    )
  }

  const eventIdempotencyKey = `mission-released:${mission.id}`
  const { error: eventError } = await supabase
    .schema('pauli')
    .from('mission_events')
    .insert({
      organization_id: mission.organization_id,
      mission_id: mission.id,
      correlation_id: mission.correlation_id,
      event_type: 'MISSION_RELEASED',
      source: 'mission-control',
      idempotency_key: eventIdempotencyKey,
      public_summary: `Mission explicitly released for governed planning: ${mission.title}`,
      visibility: 'tenant',
      payload: {
        released_by: user.id,
        released_at: releasedAt,
        next_state: 'INTENT',
      },
    })

  return NextResponse.json({
    mission: releasedMission,
    eventRecorded: !eventError,
    eventWarning: eventError ? eventError.message : null,
  })
}
