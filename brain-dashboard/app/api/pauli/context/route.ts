import { NextRequest, NextResponse } from 'next/server'
import { createPauliUserScopedSupabase } from '@/lib/pauli-supabase'

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const token = authorization.slice('Bearer '.length).trim()
  return token || null
}

export async function GET(req: NextRequest) {
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

  const { data: memberships, error: membershipError } = await supabase
    .schema('pauli')
    .from('memberships')
    .select('organization_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (membershipError) {
    return NextResponse.json(
      { error: 'Unable to load Pauli membership', detail: membershipError.message },
      { status: 500 }
    )
  }

  if (!memberships?.length) {
    return NextResponse.json(
      {
        error: 'No active Pauli membership',
        code: 'PAULI_MEMBERSHIP_REQUIRED',
        detail:
          'This account authenticated successfully but is not allowlisted for a Pauli organization.',
      },
      { status: 403 }
    )
  }

  const organizationIds = memberships.map((membership) => membership.organization_id)

  const [
    organizationsResult,
    agentsResult,
    missionsResult,
    approvalsResult,
    eventsResult,
    providersResult,
    incidentsResult,
  ] = await Promise.all([
    supabase
      .schema('pauli')
      .from('organizations')
      .select('id, slug, name, preferred_language, status')
      .in('id', organizationIds)
      .order('name'),
    supabase
      .schema('pauli')
      .from('agents')
      .select('id, organization_id, agent_key, name, role, specialty, status, last_heartbeat_at, updated_at')
      .in('organization_id', organizationIds)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .schema('pauli')
      .from('missions')
      .select(
        'id, organization_id, correlation_id, title, intent_normalized, requested_outcome, required_completion_level, status, priority, autonomous_budget_cents, spent_cents, attempt_count, started_at, completed_at, created_at, updated_at'
      )
      .in('organization_id', organizationIds)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .schema('pauli')
      .from('approvals')
      .select(
        'id, organization_id, mission_id, task_id, requested_by_agent_id, decided_by, action_class, risk_class, scope, max_uses, uses, max_spend_cents, status, rationale, expires_at, created_at, decided_at'
      )
      .in('organization_id', organizationIds)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .schema('pauli')
      .from('mission_events')
      .select(
        'event_uuid, organization_id, mission_id, task_id, agent_id, correlation_id, causation_id, event_type, source, public_summary, visibility, occurred_at'
      )
      .in('organization_id', organizationIds)
      .order('occurred_at', { ascending: false })
      .limit(100),
    supabase
      .schema('pauli')
      .from('runtime_providers')
      .select(
        'id, provider_key, name, kind, endpoint_ref, capabilities, health_status, cost_profile, metadata, last_healthcheck_at, updated_at'
      )
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .schema('pauli')
      .from('incidents')
      .select(
        'id, organization_id, mission_id, agent_id, severity, incident_type, title, summary, status, details_redacted, detected_at, resolved_at'
      )
      .in('organization_id', organizationIds)
      .order('detected_at', { ascending: false })
      .limit(50),
  ])

  const firstError = [
    organizationsResult.error,
    agentsResult.error,
    missionsResult.error,
    approvalsResult.error,
    eventsResult.error,
    providersResult.error,
    incidentsResult.error,
  ].find(Boolean)

  if (firstError) {
    return NextResponse.json(
      { error: 'Unable to load Mission Control context', detail: firstError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    memberships,
    organizations: organizationsResult.data ?? [],
    agents: agentsResult.data ?? [],
    missions: missionsResult.data ?? [],
    approvals: approvalsResult.data ?? [],
    events: eventsResult.data ?? [],
    runtimeProviders: providersResult.data ?? [],
    incidents: incidentsResult.data ?? [],
    generatedAt: new Date().toISOString(),
  })
}
