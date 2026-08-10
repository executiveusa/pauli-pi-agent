'use client'

import { AlertTriangle, CheckCircle2, CloudCog, ServerOff } from 'lucide-react'

export type PauliRuntimeProvider = {
  id: string
  provider_key: string
  name: string
  kind: string
  endpoint_ref: string | null
  capabilities: unknown
  health_status: string
  cost_profile: unknown
  metadata: Record<string, unknown> | null
  last_healthcheck_at: string | null
  updated_at: string
}

export type PauliIncident = {
  id: string
  organization_id: string
  mission_id: string | null
  agent_id: string | null
  severity: string
  incident_type: string
  title: string
  summary: string | null
  status: string
  details_redacted: Record<string, unknown> | null
  detected_at: string
  resolved_at: string | null
}

function relativeTime(value: string | null): string {
  if (!value) return 'never'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return value
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function providerStatusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized === 'healthy') return 'border-emerald-800 bg-emerald-950/30 text-emerald-300'
  if (normalized === 'degraded') return 'border-amber-800 bg-amber-950/30 text-amber-300'
  return 'border-red-900 bg-red-950/30 text-red-300'
}

function configuredProviderNames(metadata: Record<string, unknown> | null): string[] {
  const providers = metadata?.providers
  if (!providers || typeof providers !== 'object' || Array.isArray(providers)) return []

  return Object.entries(providers as Record<string, unknown>)
    .filter(([, configured]) => configured === true)
    .map(([name]) => name)
}

function lastError(metadata: Record<string, unknown> | null): string | null {
  const value = metadata?.last_error
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default function RuntimeReadinessPanel({
  providers,
  incidents,
}: {
  providers: PauliRuntimeProvider[]
  incidents: PauliIncident[]
}) {
  const openIncidents = incidents.filter((incident) => incident.status.toLowerCase() !== 'resolved')
  const hasHealthyRuntime = providers.some((provider) => provider.health_status.toLowerCase() === 'healthy')

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Runtime readiness</p>
          <div className="mt-2 flex items-center gap-2">
            {hasHealthyRuntime ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <ServerOff className="h-4 w-4 text-red-400" />
            )}
            <h2 className="text-sm font-semibold text-slate-100">
              {hasHealthyRuntime ? 'A governed runtime is available' : 'No governed runtime is healthy'}
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
            Mission Control can safely save and release intents, but the deterministic scheduler will block before provisioning unless a runtime provider reports healthy.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-slate-500">
          Health cron: every 1 minute
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {providers.length > 0 ? (
          providers.map((provider) => {
            const configured = configuredProviderNames(provider.metadata)
            const error = lastError(provider.metadata)
            return (
              <article key={provider.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-lg border border-slate-800 bg-slate-900 p-2 text-blue-400">
                      <CloudCog className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-100">{provider.name}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{provider.provider_key} · {provider.kind}</p>
                    </div>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${providerStatusClass(provider.health_status)}`}>
                    {provider.health_status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <p className="uppercase tracking-wider text-slate-600">Last health check</p>
                    <p className="mt-1 text-slate-300">{relativeTime(provider.last_healthcheck_at)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wider text-slate-600">Configured model providers</p>
                    <p className="mt-1 text-slate-300">{configured.length > 0 ? configured.join(', ') : 'None detected'}</p>
                  </div>
                </div>

                {error ? (
                  <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-[10px] leading-4 text-red-300">
                    {error}
                  </div>
                ) : null}
              </article>
            )
          })
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-500">
            No runtime provider records are visible.
          </div>
        )}

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${openIncidents.length > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
              <p className="text-xs font-semibold text-slate-100">Open incidents</p>
            </div>
            <span className="text-lg font-semibold text-slate-200">{openIncidents.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {openIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-slate-200">{incident.title}</p>
                  <span className="text-[9px] uppercase tracking-wider text-amber-400">{incident.severity}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">{incident.summary || incident.incident_type}</p>
              </div>
            ))}
            {openIncidents.length === 0 ? (
              <p className="text-[10px] text-slate-600">No unresolved incident records are visible.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )
}
