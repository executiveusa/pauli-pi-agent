'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import FactoryStatusHeader from './FactoryStatusHeader'
import AgentHealthCard, { type AgentHealthCardProps } from './AgentHealthCard'
import ProjectHealthCard, { type ProjectHealthCardProps } from './ProjectHealthCard'
import BuildQueuePanel, { type BuildQueueItem } from './BuildQueuePanel'
import HumanApprovalQueue, { type ApprovalItem } from './HumanApprovalQueue'
import JudgeDecisionsTable, { type JudgeDecision } from './JudgeDecisionsTable'
import WatcherAlertsPanel, { type WatcherAlert } from './WatcherAlertsPanel'

// ─── Static demo data ──────────────────────────────────────────────────────────
// In production, replace with real API calls / Supabase subscriptions

const DEMO_AGENTS: AgentHealthCardProps[] = [
  {
    agentId: 'agent-architect-01',
    name: 'Architect',
    status: 'active',
    lastActivity: '2m ago',
    currentTask: 'Designing microservice schema for PayFlow v2',
    tokensUsed: 142000,
    successRate: 94,
  },
  {
    agentId: 'agent-builder-01',
    name: 'Builder',
    status: 'active',
    lastActivity: '45s ago',
    currentTask: 'Generating Next.js API routes for /checkout flow',
    tokensUsed: 89500,
    successRate: 88,
  },
  {
    agentId: 'agent-judge-01',
    name: 'Judge',
    status: 'idle',
    lastActivity: '12m ago',
    currentTask: undefined,
    tokensUsed: 56000,
    successRate: 100,
  },
  {
    agentId: 'agent-watcher-01',
    name: 'Watcher',
    status: 'active',
    lastActivity: 'just now',
    currentTask: 'Monitoring cost spike on agent-builder-02',
    tokensUsed: 22000,
    successRate: 97,
  },
  {
    agentId: 'agent-postman-01',
    name: 'Postman',
    status: 'paused',
    lastActivity: '8m ago',
    currentTask: 'Awaiting DNS propagation for staging.payflow.io',
    tokensUsed: 11000,
    successRate: 82,
  },
]

const DEMO_PROJECTS: ProjectHealthCardProps[] = [
  {
    projectId: 'proj-payflow-001',
    name: 'PayFlow Pro',
    udecScore: 8.4,
    motScore: 7.9,
    accScore: 9.1,
    revenueScore: 72,
    productionReadiness: 85,
    status: 'passing',
    judgeVerdict: 'PASS WITH CONDITIONS',
  },
  {
    projectId: 'proj-fittrack-002',
    name: 'FitTrack AI',
    udecScore: 6.2,
    motScore: 7.1,
    accScore: 5.8,
    revenueScore: 45,
    productionReadiness: 52,
    status: 'review',
    judgeVerdict: 'PENDING',
  },
  {
    projectId: 'proj-learnflow-003',
    name: 'LearnFlow LMS',
    udecScore: 9.2,
    motScore: 8.7,
    accScore: 9.4,
    revenueScore: 91,
    productionReadiness: 97,
    status: 'deployed',
    judgeVerdict: 'PASS',
  },
]

const DEMO_BUILD_QUEUE: BuildQueueItem[] = [
  {
    id: 'build-001',
    projectName: 'PayFlow Pro',
    agentAssigned: 'builder-01',
    status: 'building',
    startedAt: new Date(Date.now() - 180000).toISOString(),
    durationSeconds: 180,
    stage: 'API Layer',
  },
  {
    id: 'build-002',
    projectName: 'FitTrack AI',
    agentAssigned: 'builder-02',
    status: 'queued',
    stage: 'Frontend',
  },
  {
    id: 'build-003',
    projectName: 'LearnFlow LMS',
    agentAssigned: 'builder-01',
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    durationSeconds: 420,
    stage: 'Full Stack',
  },
  {
    id: 'build-004',
    projectName: 'AuthKit SDK',
    agentAssigned: 'builder-03',
    status: 'failed',
    startedAt: new Date(Date.now() - 900000).toISOString(),
    durationSeconds: 90,
    stage: 'Tests',
  },
]

const DEMO_APPROVALS: ApprovalItem[] = [
  {
    id: 'appr-001',
    type: 'deployment',
    title: 'Deploy PayFlow Pro to Production',
    description:
      'Builder agent requests production deployment of PayFlow Pro v2.1.0. All tests passing, Judge verdict: PASS WITH CONDITIONS.',
    requestorAgent: 'builder-01',
    requestedAt: new Date(Date.now() - 600000).toISOString(),
    riskLevel: 'high',
    status: 'pending',
    environment: 'production',
    projectName: 'PayFlow Pro',
  },
  {
    id: 'appr-002',
    type: 'dns',
    title: 'Add DNS record: payflow.io → prod-lb',
    description:
      'Postman agent requests creation of A record for payflow.io pointing to production load balancer 104.21.0.1.',
    requestorAgent: 'postman-01',
    requestedAt: new Date(Date.now() - 1200000).toISOString(),
    riskLevel: 'medium',
    status: 'pending',
    projectName: 'PayFlow Pro',
  },
  {
    id: 'appr-003',
    type: 'financial',
    title: 'Activate Stripe Production Mode',
    description:
      'Monetize agent requests enabling Stripe live keys for PayFlow Pro checkout flow.',
    requestorAgent: 'monetize-01',
    requestedAt: new Date(Date.now() - 1800000).toISOString(),
    riskLevel: 'critical',
    status: 'pending',
    environment: 'production',
    projectName: 'PayFlow Pro',
  },
]

const DEMO_JUDGE_DECISIONS: JudgeDecision[] = [
  {
    id: 'jdg-001',
    projectId: 'proj-learnflow-003',
    projectName: 'LearnFlow LMS',
    verdict: 'PASS',
    udecScore: 9.2,
    motScore: 8.7,
    accScore: 9.4,
    overallScore: 9.1,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    summary:
      'Excellent implementation quality. All acceptance criteria met. Revenue model is clear and validated. Ready for production deployment.',
    agentId: 'judge-01',
  },
  {
    id: 'jdg-002',
    projectId: 'proj-payflow-001',
    projectName: 'PayFlow Pro',
    verdict: 'PASS WITH CONDITIONS',
    udecScore: 8.4,
    motScore: 7.9,
    accScore: 9.1,
    overallScore: 8.5,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    summary:
      'Strong technical implementation with minor gaps in error handling and missing rate limiting on payment endpoints.',
    conditions: [
      'Add rate limiting to /api/checkout endpoint (max 10 req/min per user)',
      'Implement idempotency keys for payment mutations',
      'Add webhook signature validation',
    ],
    agentId: 'judge-01',
  },
  {
    id: 'jdg-003',
    projectId: 'proj-authkit-004',
    projectName: 'AuthKit SDK',
    verdict: 'FAIL',
    udecScore: 4.1,
    motScore: 3.8,
    accScore: 5.2,
    overallScore: 4.4,
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    summary:
      'Critical security vulnerabilities identified. JWT secret not properly scoped, CSRF protection missing, no input sanitization on auth endpoints.',
    agentId: 'judge-01',
  },
]

const DEMO_WATCHER_ALERTS: WatcherAlert[] = [
  {
    id: 'watch-001',
    alertType: 'cost_spike',
    affectedAgent: 'builder-02',
    affectedProject: 'FitTrack AI',
    action: 'paused',
    resolution: 'investigating',
    timestamp: new Date(Date.now() - 480000).toISOString(),
    detail: 'Token usage spiked 340% above baseline in a 5-minute window. Agent paused pending review.',
    costDelta: 12.40,
  },
  {
    id: 'watch-002',
    alertType: 'stuck_loop',
    affectedAgent: 'architect-02',
    affectedProject: 'AuthKit SDK',
    action: 'rerouted',
    resolution: 'resolved',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    detail: 'Agent entered recursive schema generation loop. Rerouted to fallback strategy after 8 iterations.',
    loopCount: 8,
  },
  {
    id: 'watch-003',
    alertType: 'tool_failure',
    affectedAgent: 'postman-01',
    action: 'escalated',
    resolution: 'open',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    detail: 'DNS API returned 503 three consecutive times. Escalated to human review.',
  },
]

// ─── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardData {
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE'
  activeProjects: number
  runningAgents: number
  todayBuilds: number
  avgQualityScore: number
  lastUpdated: string
}

function useDashboardData() {
  const [data] = useState<DashboardData>({
    systemStatus: 'OPERATIONAL',
    activeProjects: 7,
    runningAgents: 3,
    todayBuilds: 14,
    avgQualityScore: 8.2,
    lastUpdated: new Date().toLocaleTimeString(),
  })

  const [approvals, setApprovals] = useState<ApprovalItem[]>(DEMO_APPROVALS)
  const [buildQueue, setBuildQueue] = useState<BuildQueueItem[]>(DEMO_BUILD_QUEUE)
  const [watcherAlerts, setWatcherAlerts] = useState<WatcherAlert[]>(DEMO_WATCHER_ALERTS)

  const handleApprove = useCallback(async (id: string) => {
    await new Promise((r) => setTimeout(r, 600))
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a))
    )
  }, [])

  const handleReject = useCallback(async (id: string) => {
    await new Promise((r) => setTimeout(r, 600))
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a))
    )
  }, [])

  const handleCancelBuild = useCallback((id: string) => {
    setBuildQueue((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const handleRetryBuild = useCallback((id: string) => {
    setBuildQueue((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: 'queued' as const, durationSeconds: undefined } : b
      )
    )
  }, [])

  const handleDismissAlert = useCallback((id: string) => {
    setWatcherAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolution: 'resolved' as const } : a))
    )
  }, [])

  const handleEscalateAlert = useCallback((id: string) => {
    setWatcherAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, action: 'escalated' as const } : a))
    )
  }, [])

  return {
    data,
    approvals,
    buildQueue,
    watcherAlerts,
    handleApprove,
    handleReject,
    handleCancelBuild,
    handleRetryBuild,
    handleDismissAlert,
    handleEscalateAlert,
  }
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
      style={{ color: 'hsl(215,16%,47%)' }}
    >
      {children}
    </h2>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MissionControlDashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data,
    approvals,
    buildQueue,
    watcherAlerts,
    handleApprove,
    handleReject,
    handleCancelBuild,
    handleRetryBuild,
    handleDismissAlert,
    handleEscalateAlert,
  } = useDashboardData()

  function handleRefresh() {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastRefresh(new Date().toLocaleTimeString())
      setIsRefreshing(false)
    }, 1000)
  }

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date().toLocaleTimeString())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'hsl(222,84%,5%)', color: 'hsl(210,40%,98%)' }}
    >
      {/* ── Factory status header ── */}
      <FactoryStatusHeader
        systemStatus={data.systemStatus}
        activeProjects={data.activeProjects}
        runningAgents={data.runningAgents}
        todayBuilds={data.todayBuilds}
        avgQualityScore={data.avgQualityScore}
        lastUpdated={lastRefresh}
      />

      {/* ── Toolbar ── */}
      <div
        className="flex items-center justify-between px-6 py-2 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <nav className="flex items-center gap-1">
          {['Overview', 'Projects', 'Agents', 'Deployments', 'Settings'].map((tab) => (
            <button
              key={tab}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: tab === 'Overview' ? 'hsl(217,91%,60%)' : 'hsl(215,16%,47%)',
                background: tab === 'Overview' ? 'hsl(217,91%,10%)' : 'transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
          style={{
            background: 'hsl(222,47%,11%)',
            border: '1px solid hsl(222,40%,18%)',
            color: 'hsl(215,20%,65%)',
          }}
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* ── Main scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8">

          {/* ── Agent health row (5 cards) ── */}
          <section>
            <SectionLabel>Agent Health</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DEMO_AGENTS.map((agent) => (
                <AgentHealthCard key={agent.agentId} {...agent} />
              ))}
            </div>
          </section>

          {/* ── 3-column: Projects | Active Builds | Quick Stats ── */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Active projects */}
              <div className="lg:col-span-2">
                <SectionLabel>Active Projects</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {DEMO_PROJECTS.map((proj) => (
                    <ProjectHealthCard key={proj.projectId} {...proj} />
                  ))}
                </div>
              </div>

              {/* Build queue */}
              <div>
                <SectionLabel>Build Queue</SectionLabel>
                <BuildQueuePanel
                  items={buildQueue}
                  onCancel={handleCancelBuild}
                  onRetry={handleRetryBuild}
                />
              </div>
            </div>
          </section>

          {/* ── 2-column: Activity feed | Approval queue ── */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Watcher alerts (acts as activity feed) */}
              <div>
                <SectionLabel>Watcher Alerts</SectionLabel>
                <WatcherAlertsPanel
                  alerts={watcherAlerts}
                  onDismiss={handleDismissAlert}
                  onEscalate={handleEscalateAlert}
                />
              </div>

              {/* Human approval queue */}
              <div>
                <SectionLabel>Human Approval Queue</SectionLabel>
                <HumanApprovalQueue
                  items={approvals}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>
            </div>
          </section>

          {/* ── Full-width: Judge decisions table ── */}
          <section>
            <SectionLabel>Judge Decisions</SectionLabel>
            <JudgeDecisionsTable decisions={DEMO_JUDGE_DECISIONS} />
          </section>

        </div>
      </div>
    </div>
  )
}
