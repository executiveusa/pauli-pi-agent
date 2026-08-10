'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { pauliAuthorizedFetch } from '@/lib/pauli-api'
import AgentHealthCard, { type AgentHealthCardProps } from './AgentHealthCard'
import ApprovalDecisionControls from './ApprovalDecisionControls'
import RuntimeReadinessPanel, {
  type PauliIncident,
  type PauliRuntimeProvider,
} from './RuntimeReadinessPanel'
import {
  type PauliAgent,
  type PauliApproval,
  type PauliMission,
  type PauliMissionEvent,
  useMissionControlContext,
} from './MissionControlAuthGate'

type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE'

type ExtendedPauliContext = ReturnType<typeof useMissionControlContext>['data'] & {
  runtimeProviders?: PauliRuntimeProvider[]
  incidents?: PauliIncident[]
}

const TERMINAL_MISSION_STATUSES = new Set(['COMPLETED', 'CLOSED', 'CANCELLED', 'FAILED'])

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return 'No activity recorded'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return value

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function normalizeAgentStatus(status: string): AgentHealthCardProps['status'] {
  const normalized = status.toLowerCase()
  if (normalized === 'active') return 'active'
  if (normalized === 'error' || normalized === 'failed') return 'error'
  if (normalized === 'paused' || normalized === 'blocked' || normalized === 'paused_for_review') {
    return 'paused'
  }
  return 'idle'
}

function missionTone(status: string): { border: string; text: string; bg: string } {
  const normalized = status.toUpperCase()
  if (['COMPLETED', 'CLOSED', 'SUCCEEDED', 'OUTCOME_ACHIEVED'].includes(normalized)) {
    return {
      border: 'hsl(142,76%,36%)',
      text: 'hsl(142,76%,60%)',
      bg: 'hsl(142,76%,10%)',
    }
  }
  if (normalized === 'BLOCKED' || normalized === 'WAITING_APPROVAL') {
    return {
      border: 'hsl(38,92%,50%)',
      text: 'hsl(38,92%,70%)',
      bg: 'hsl(38,92%,10%)',
    }
  }
  if (normalized === 'FAILED' || normalized === 'ERROR') {
    return {
      border: 'hsl(0,72%,51%)',
      text: 'hsl(0,72%,70%)',
      bg: 'hsl(0,72%,10%)',
    }
  }
  return {
    border: 'hsl(217,91%,60%)',
    text: 'hsl(217,91%,70%)',
    bg: 'hsl(217,91%,10%)',
  }
}

function riskTone(risk: string): { border: string; text: string; bg: string } {
  const normalized = risk.toLowerCase()
  if (normalized === 'critical') {
    return { border: 'hsl(0,72%,51%)', text: 'hsl(0,72%,70%)', bg: 'hsl(0,72%,10%)' }
  }
  if (normalized === 'high' || normalized === 'dangerous') {
    return { border: 'hsl(38,92%,50%)', text: 'hsl(38,92%,70%)', bg: 'hsl(38,92%,10%)' }
  }
  if (normalized === 'medium' || normalized === 'caution') {
    return { border: 'hsl(217,91%,60%)', text: 'hsl(217,91%,70%)', bg: 'hsl(217,91%,10%)' }
  }
  return { border: 'hsl(142,76%,36%)', text: 'hsl(142,76%,60%)', bg: 'hsl(142,76%,10%)' }
}

function getSystemStatus(
  agents: PauliAgent[],
  missions: PauliMission[],
  runtimeProviders: PauliRuntimeProvider[]
): SystemStatus {
  if (agents.length === 0) return 'OFFLINE'

  const hasAgentError = agents.some((agent) => ['error', 'failed'].includes(agent.status.toLowerCase()))
  const hasMissionProblem = missions.some((mission) =>
    ['BLOCKED', 'FAILED', 'ERROR'].includes(mission.status.toUpperCase())
  )
  const hasHealthyRuntime = runtimeProviders.some(
    (provider) => provider.health_status.toLowerCase() === 'healthy'
  )

  if (hasAgentError || hasMissionProblem || !hasHealthyRuntime) return 'DEGRADED'
  return 'OPERATIONAL'
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </h2>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-blue-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  )
}

function MissionCard({
  mission,
  canStart,
  isStarting,
  onStart,
}: {
  mission: PauliMission
  canStart: boolean
  isStarting: boolean
  onStart: (missionId: string) => void
}) {
  const tone = missionTone(mission.status)
  const waitingForStart = mission.status.toUpperCase() === 'WAITING_APPROVAL'

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-100">{mission.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
            {mission.requested_outcome || mission.intent_normalized || 'No requested outcome recorded.'}
          </p>
        </div>
        <span
          className="shrink-0 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
          style={{ borderColor: tone.border, color: tone.text, background: tone.bg }}
        >
          {mission.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <p className="uppercase tracking-wider text-slate-600">Priority</p>
          <p className="mt-1 text-slate-300">{mission.priority ?? '—'}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-slate-600">Attempts</p>
          <p className="mt-1 text-slate-300">{mission.attempt_count}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-slate-600">Spend</p>
          <p className="mt-1 text-slate-300">{formatMoney(mission.spent_cents ?? 0)}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-slate-600">Budget</p>
          <p className="mt-1 text-slate-300">{formatMoney(mission.autonomous_budget_cents)}</p>
        </div>
      </div>

      {waitingForStart ? (
        <div className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/20 p-3">
          <p className="text-[10px] leading-4 text-amber-200">
            This intent is held. Pauli's 10-second mission scheduler ignores it until an authorized human explicitly starts it.
          </p>
          {canStart ? (
            <button
              type="button"
              onClick={() => onStart(mission.id)}
              disabled={isStarting}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3 w-3" />
              {isStarting ? 'Starting…' : 'Start mission'}
            </button>
          ) : (
            <p className="mt-2 text-[10px] text-slate-500">Your current role cannot release this mission.</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
        <span>{mission.correlation_id ? `corr ${mission.correlation_id.slice(0, 8)}` : 'No correlation id'}</span>
        <span>Updated {formatRelativeTime(mission.updated_at)}</span>
      </div>
    </article>
  )
}

function ApprovalCard({
  approval,
  role,
  refresh,
}: {
  approval: PauliApproval
  role: string
  refresh: () => Promise<void>
}) {
  const tone = riskTone(approval.risk_class)

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-100">{approval.action_class}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {approval.rationale || 'No rationale recorded.'}
          </p>
        </div>
        <span
          className="shrink-0 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
          style={{ borderColor: tone.border, color: tone.text, background: tone.bg }}
        >
          {approval.risk_class}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500">
        <span>Status: <strong className="font-semibold text-slate-300">{approval.status}</strong></span>
        {approval.max_uses !== null ? <span>Uses: {approval.uses ?? 0}/{approval.max_uses}</span> : null}
        {approval.max_spend_cents !== null ? <span>Limit: {formatMoney(approval.max_spend_cents)}</span> : null}
        <span>Requested {formatRelativeTime(approval.created_at)}</span>
      </div>

      <ApprovalDecisionControls approval={approval} role={role} refresh={refresh} />
    </article>
  )
}

function EventRow({ event }: { event: PauliMissionEvent }) {
  return (
    <div className="flex gap-3 border-b border-slate-800 px-4 py-3 last:border-b-0">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">{event.event_type}</p>
          <span className="text-[10px] text-slate-600">{formatRelativeTime(event.occurred_at)}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {event.public_summary || `${event.source} event`}
        </p>
        <div className="mt-1 flex flex-wrap gap-3 text-[9px] uppercase tracking-wider text-slate-600">
          <span>{event.source}</span>
          <span>{event.visibility}</span>
          {event.correlation_id ? <span>corr {event.correlation_id.slice(0, 8)}</span> : null}
        </div>
      </div>
    </div>
  )
}

export default function MissionControlDashboard() {
  const { data, refresh } = useMissionControlContext()
  const extendedData = data as ExtendedPauliContext
  const runtimeProviders = extendedData.runtimeProviders ?? []
  const incidents = extendedData.incidents ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [intent, setIntent] = useState('')
  const [isCreatingMission, setIsCreatingMission] = useState(false)
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null)
  const [missionMessage, setMissionMessage] = useState('')
  const [missionError, setMissionError] = useState('')

  const activeMissions = useMemo(
    () => data.missions.filter((mission) => !TERMINAL_MISSION_STATUSES.has(mission.status.toUpperCase())),
    [data.missions]
  )
  const pendingApprovals = useMemo(
    () => data.approvals.filter((approval) => approval.status.toLowerCase() === 'pending'),
    [data.approvals]
  )
  const systemStatus = getSystemStatus(data.agents, data.missions, runtimeProviders)
  const activeRole = data.memberships[0]?.role?.toLowerCase() ?? 'member'
  const canStartMissions = ['owner', 'admin', 'operator'].includes(activeRole)

  const agentCards = useMemo<AgentHealthCardProps[]>(() => {
    const activeMission = activeMissions.find(
      (mission) => mission.status.toUpperCase() !== 'WAITING_APPROVAL'
    )
    return data.agents.map((agent) => ({
      agentId: agent.agent_key || agent.id,
      name: agent.name,
      status: normalizeAgentStatus(agent.status),
      lastActivity: `Heartbeat ${formatRelativeTime(agent.last_heartbeat_at || agent.updated_at)}`,
      currentTask:
        activeMission?.requested_outcome ||
        activeMission?.title ||
        agent.specialty ||
        agent.role ||
        undefined,
    }))
  }, [activeMissions, data.agents])

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleMissionCreate() {
    const trimmedIntent = intent.trim()
    if (trimmedIntent.length < 3) return

    setIsCreatingMission(true)
    setMissionError('')
    setMissionMessage('')

    try {
      const organizationId = data.memberships[0]?.organization_id
      const preferredLanguage = data.organizations[0]?.preferred_language?.toLowerCase() ?? 'en'
      const language = preferredLanguage.startsWith('es') ? 'es-MX' : 'en'
      const response = await pauliAuthorizedFetch('/api/pauli/missions', {
        method: 'POST',
        body: JSON.stringify({
          intent: trimmedIntent,
          organizationId,
          requestId: crypto.randomUUID(),
          language,
          completionLevel: 'OUTCOME_ACHIEVED',
          autonomousBudgetCents: 0,
        }),
      })
      const body = (await response.json()) as {
        mission?: { title?: string }
        reused?: boolean
        eventRecorded?: boolean
        eventWarning?: string | null
        error?: string
        detail?: string
      }

      if (!response.ok) {
        throw new Error([body.error, body.detail].filter(Boolean).join(' — ') || 'Mission intake failed.')
      }

      setIntent('')
      setMissionMessage(
        body.reused
          ? `Existing held mission restored: ${body.mission?.title ?? 'mission intent'}`
          : `Mission intent saved and held: ${body.mission?.title ?? 'new mission'}. Start it from the mission card when ready.`
      )
      if (body.eventRecorded === false && body.eventWarning) {
        setMissionError(`Mission saved, but its event receipt failed: ${body.eventWarning}`)
      }
      await refresh()
    } catch (err) {
      setMissionError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCreatingMission(false)
    }
  }

  async function handleMissionStart(missionId: string) {
    setStartingMissionId(missionId)
    setMissionError('')
    setMissionMessage('')

    try {
      const response = await pauliAuthorizedFetch('/api/pauli/missions/start', {
        method: 'POST',
        body: JSON.stringify({ missionId }),
      })
      const body = (await response.json()) as {
        mission?: { title?: string; status?: string }
        eventRecorded?: boolean
        eventWarning?: string | null
        error?: string
        detail?: string
        currentStatus?: string
      }

      if (!response.ok) {
        throw new Error(
          [body.error, body.detail, body.currentStatus ? `Current status: ${body.currentStatus}` : null]
            .filter(Boolean)
            .join(' — ') || 'Mission start failed.'
        )
      }

      setMissionMessage(
        `Mission released: ${body.mission?.title ?? missionId}. The governed scheduler can now plan it.`
      )
      if (body.eventRecorded === false && body.eventWarning) {
        setMissionError(`Mission released, but its event receipt failed: ${body.eventWarning}`)
      }
      await refresh()
    } catch (err) {
      setMissionError(err instanceof Error ? err.message : String(err))
    } finally {
      setStartingMissionId(null)
    }
  }

  const statusTone =
    systemStatus === 'OPERATIONAL'
      ? 'border-emerald-800 bg-emerald-950/30 text-emerald-400'
      : systemStatus === 'DEGRADED'
        ? 'border-amber-800 bg-amber-950/30 text-amber-400'
        : 'border-red-800 bg-red-950/30 text-red-400'

  return (
    <main className="min-h-[calc(100vh-33px)] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-5">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400">Pauli</p>
              <h1 className="text-xl font-semibold tracking-tight">Mission Control</h1>
              <p className="mt-1 text-xs text-slate-500">State and governed mission control are backed by Botanic Creations.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${statusTone}`}>
              {systemStatus}
            </span>
            <span className="rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-1.5 text-[10px] uppercase tracking-wider text-blue-300">
              Intake · release · approvals live
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-[1500px] grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Active missions" value={activeMissions.length} icon={Activity} />
          <Metric label="Agents" value={data.agents.length} icon={Database} />
          <Metric label="Pending approvals" value={pendingApprovals.length} icon={ShieldCheck} />
          <Metric label="Recent events" value={data.events.length} icon={Clock3} />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-8 px-6 py-6">
        <section className="rounded-2xl border border-blue-900/50 bg-gradient-to-b from-blue-950/30 to-slate-900/70 p-4 sm:p-5">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Outcome command</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">What do you want Pauli to accomplish?</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              State the outcome in plain language. Saving creates a held internal mission with a $0 autonomous budget. Pauli's scheduler will not plan or execute it until an authorized human presses Start mission.
            </p>

            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 p-2 focus-within:border-blue-600">
              <textarea
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Example: Audit the Pauli control plane, fix the highest-risk blocker, and give me verified evidence before anything ships."
                className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
              />
              <div className="flex flex-col gap-2 border-t border-slate-800 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[10px] text-slate-600">Held state: WAITING_APPROVAL · autonomous budget: $0</span>
                <button
                  type="button"
                  onClick={() => void handleMissionCreate()}
                  disabled={isCreatingMission || intent.trim().length < 3}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isCreatingMission ? 'Saving…' : 'Save mission intent'}
                </button>
              </div>
            </div>

            {missionMessage ? <p className="mt-3 text-xs text-emerald-400">{missionMessage}</p> : null}
            {missionError ? <p className="mt-3 text-xs text-red-400">{missionError}</p> : null}
          </div>
        </section>

        <RuntimeReadinessPanel providers={runtimeProviders} incidents={incidents} />

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <SectionLabel>Agent runtime</SectionLabel>
            <span className="text-[10px] text-slate-600">Source: pauli.agents</span>
          </div>
          {agentCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {agentCards.map((agent) => (
                <AgentHealthCard key={agent.agentId} {...agent} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-500">
              No agent records are visible to this organization.
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <SectionLabel>Missions</SectionLabel>
            <span className="text-[10px] text-slate-600">Source: pauli.missions</span>
          </div>
          {data.missions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {data.missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  canStart={canStartMissions}
                  isStarting={startingMissionId === mission.id}
                  onStart={(missionId) => void handleMissionStart(missionId)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-500">
              No missions are visible to this organization.
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <SectionLabel>Approval queue</SectionLabel>
              <span className="text-[10px] text-slate-600">Source: pauli.approvals</span>
            </div>
            <div className="space-y-3">
              {data.approvals.length > 0 ? (
                data.approvals.map((approval) => (
                  <ApprovalCard key={approval.id} approval={approval} role={activeRole} refresh={refresh} />
                ))
              ) : (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-center text-sm text-slate-500">
                  <div>
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-500" />
                    No approval records are currently visible.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <SectionLabel>Mission event stream</SectionLabel>
              <span className="text-[10px] text-slate-600">Source: pauli.mission_events</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60">
              {data.events.length > 0 ? (
                data.events.map((event) => <EventRow key={event.event_uuid} event={event} />)
              ) : (
                <div className="flex min-h-32 items-center justify-center p-5 text-center text-sm text-slate-500">
                  No mission events are currently visible.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-amber-900/50 bg-amber-950/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-300">The control plane is connected; the governed runtime is not yet executable.</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Intent save, explicit scheduler release, live state, and approval decisions are wired through authenticated RLS. Model-provider credentials are not configured in the runtime Edge Function, so the runtime correctly remains offline. Spending, deployment, publishing, credentials, and external communication stay behind downstream approval/tool policy.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900 py-4 text-[10px] text-slate-600">
          <span>Context generated {new Date(data.generatedAt).toLocaleString()}</span>
          <span>Botanic Creations · pauli / pauli_private · RLS enforced</span>
        </footer>
      </div>
    </main>
  )
}
