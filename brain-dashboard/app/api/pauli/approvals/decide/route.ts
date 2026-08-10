import { NextRequest, NextResponse } from 'next/server'
import { createPauliUserScopedSupabase } from '@/lib/pauli-supabase'

const APPROVAL_DECIDER_ROLES = new Set(['owner', 'admin', 'reviewer'])
const DECISIONS = new Set(['approved', 'denied'])

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

  let input: { approvalId?: unknown; decision?: unknown; rationale?: unknown }
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const approvalId = typeof input.approvalId === 'string' ? input.approvalId : ''
  const decision = typeof input.decision === 'string' ? input.decision.toLowerCase() : ''
  const rationale = typeof input.rationale === 'string' ? input.rationale.trim() : ''

  if (!isUuid(approvalId)) {
    return NextResponse.json({ error: 'approvalId must be a valid UUID' }, { status: 400 })
  }
  if (!DECISIONS.has(decision)) {
    return NextResponse.json({ error: 'decision must be approved or denied' }, { status: 400 })
  }
  if (rationale.length > 2000) {
    return NextResponse.json({ error: 'rationale must be 2000 characters or fewer' }, { status: 400 })
  }

  const { data: approval, error: approvalError } = await supabase
    .schema('pauli')
    .from('approvals')
    .select(
      'id, organization_id, mission_id, task_id, action_class, risk_class, status, rationale, expires_at'
    )
    .eq('id', approvalId)
    .maybeSingle()

  if (approvalError) {
    return NextResponse.json(
      { error: 'Unable to load approval', detail: approvalError.message },
      { status: 500 }
    )
  }
  if (!approval) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
  }

  const { data: membership, error: membershipError } = await supabase
    .schema('pauli')
    .from('memberships')
    .select('organization_id, role, status')
    .eq('organization_id', approval.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json(
      { error: 'Unable to resolve Pauli membership', detail: membershipError.message },
      { status: 500 }
    )
  }
  if (!membership || !APPROVAL_DECIDER_ROLES.has(String(membership.role).toLowerCase())) {
    return NextResponse.json(
      { error: 'Your Pauli role cannot decide approvals' },
      { status: 403 }
    )
  }

  if (approval.status !== 'pending') {
    return NextResponse.json(
      { error: 'Approval is no longer pending', currentStatus: approval.status },
      { status: 409 }
    )
  }

  if (approval.expires_at && new Date(approval.expires_at).getTime() <= Date.now()) {
    await supabase
      .schema('pauli')
      .from('approvals')
      .update({ status: 'expired' })
      .eq('id', approval.id)
      .eq('status', 'pending')

    return NextResponse.json({ error: 'Approval has expired' }, { status: 409 })
  }

  const decidedAt = new Date().toISOString()
  const finalRationale = rationale || approval.rationale || null
  const { data: decidedApproval, error: decisionError } = await supabase
    .schema('pauli')
    .from('approvals')
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: decidedAt,
      rationale: finalRationale,
    })
    .eq('id', approval.id)
    .eq('organization_id', approval.organization_id)
    .eq('status', 'pending')
    .select(
      'id, organization_id, mission_id, task_id, requested_by_agent_id, decided_by, action_class, risk_class, scope, max_uses, uses, max_spend_cents, status, rationale, expires_at, created_at, decided_at'
    )
    .maybeSingle()

  if (decisionError) {
    return NextResponse.json(
      { error: 'Unable to decide approval', detail: decisionError.message },
      { status: 500 }
    )
  }
  if (!decidedApproval) {
    return NextResponse.json(
      { error: 'Approval state changed before the decision was saved' },
      { status: 409 }
    )
  }

  let eventRecorded = false
  let eventWarning: string | null = null

  if (approval.mission_id) {
    const { data: mission } = await supabase
      .schema('pauli')
      .from('missions')
      .select('correlation_id')
      .eq('id', approval.mission_id)
      .eq('organization_id', approval.organization_id)
      .maybeSingle()

    if (mission?.correlation_id) {
      const { error: eventError } = await supabase
        .schema('pauli')
        .from('mission_events')
        .insert({
          organization_id: approval.organization_id,
          mission_id: approval.mission_id,
          task_id: approval.task_id,
          correlation_id: mission.correlation_id,
          event_type: 'APPROVAL_DECIDED',
          source: 'mission-control',
          idempotency_key: `approval-decided:${approval.id}`,
          public_summary: `${approval.action_class} ${decision} by authorized reviewer`,
          visibility: 'tenant',
          payload: {
            approval_id: approval.id,
            action_class: approval.action_class,
            risk_class: approval.risk_class,
            decision,
            decided_by: user.id,
            decided_at: decidedAt,
          },
        })

      eventRecorded = !eventError
      eventWarning = eventError ? eventError.message : null
    }
  }

  return NextResponse.json({
    approval: decidedApproval,
    eventRecorded,
    eventWarning,
  })
}
