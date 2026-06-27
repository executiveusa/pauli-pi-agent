'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Eye,
  Pause,
  RefreshCw,
  Wrench,
} from 'lucide-react'

export type AlertType = 'stuck_loop' | 'cost_spike' | 'tool_failure' | 'timeout' | 'rate_limit'
export type AlertAction = 'paused' | 'rerouted' | 'escalated' | 'restarted' | 'ignored'
export type AlertResolution = 'resolved' | 'investigating' | 'open'

export interface WatcherAlert {
  id: string
  alertType: AlertType
  affectedAgent: string
  affectedProject?: string
  action: AlertAction
  resolution: AlertResolution
  timestamp: string
  detail?: string
  costDelta?: number
  loopCount?: number
}

interface WatcherAlertsPanelProps {
  alerts: WatcherAlert[]
  onDismiss?: (id: string) => void
  onEscalate?: (id: string) => void
}

const ALERT_TYPE_CONFIG: Record<
  AlertType,
  { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }
> = {
  stuck_loop: {
    label: 'Stuck Loop',
    Icon: RefreshCw,
    color: 'hsl(38,92%,50%)',
  },
  cost_spike: {
    label: 'Cost Spike',
    Icon: DollarSign,
    color: 'hsl(0,72%,51%)',
  },
  tool_failure: {
    label: 'Tool Failure',
    Icon: Wrench,
    color: 'hsl(0,72%,51%)',
  },
  timeout: {
    label: 'Timeout',
    Icon: AlertCircle,
    color: 'hsl(38,92%,50%)',
  },
  rate_limit: {
    label: 'Rate Limit',
    Icon: AlertCircle,
    color: 'hsl(217,91%,60%)',
  },
}

const ACTION_CONFIG: Record<AlertAction, { label: string; bg: string; text: string; border: string }> = {
  paused: {
    label: 'Paused',
    bg: 'hsl(38,92%,10%)',
    text: 'hsl(38,92%,70%)',
    border: 'hsl(38,92%,50%)',
  },
  rerouted: {
    label: 'Rerouted',
    bg: 'hsl(217,91%,10%)',
    text: 'hsl(217,91%,70%)',
    border: 'hsl(217,91%,60%)',
  },
  escalated: {
    label: 'Escalated',
    bg: 'hsl(0,72%,10%)',
    text: 'hsl(0,72%,70%)',
    border: 'hsl(0,72%,51%)',
  },
  restarted: {
    label: 'Restarted',
    bg: 'hsl(142,76%,10%)',
    text: 'hsl(142,76%,60%)',
    border: 'hsl(142,76%,36%)',
  },
  ignored: {
    label: 'Ignored',
    bg: 'hsl(222,47%,11%)',
    text: 'hsl(215,20%,65%)',
    border: 'hsl(222,40%,18%)',
  },
}

const RESOLUTION_CONFIG: Record<AlertResolution, { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  resolved: {
    label: 'Resolved',
    Icon: CheckCircle,
    color: 'hsl(142,76%,60%)',
  },
  investigating: {
    label: 'Investigating',
    Icon: Eye,
    color: 'hsl(38,92%,70%)',
  },
  open: {
    label: 'Open',
    Icon: AlertCircle,
    color: 'hsl(0,72%,70%)',
  },
}

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function WatcherAlertsPanel({
  alerts,
  onDismiss,
  onEscalate,
}: WatcherAlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const openCount = alerts.filter((a) => a.resolution === 'open').length
  const investigatingCount = alerts.filter((a) => a.resolution === 'investigating').length

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'hsl(222,47%,11%)',
        border: '1px solid hsl(222,40%,18%)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: 'hsl(217,91%,60%)' }} />
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            Watcher Alerts
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {openCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: 'hsl(0,72%,10%)',
                border: '1px solid hsl(0,72%,51%)',
                color: 'hsl(0,72%,70%)',
              }}
            >
              {openCount} open
            </span>
          )}
          {investigatingCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: 'hsl(38,92%,10%)',
                border: '1px solid hsl(38,92%,50%)',
                color: 'hsl(38,92%,70%)',
              }}
            >
              {investigatingCount} investigating
            </span>
          )}
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto max-h-72">
        {alerts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-20 gap-2"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">No active alerts</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const typeCfg = ALERT_TYPE_CONFIG[alert.alertType]
            const actionCfg = ACTION_CONFIG[alert.action]
            const resCfg = RESOLUTION_CONFIG[alert.resolution]
            const isExpanded = expandedId === alert.id

            return (
              <div
                key={alert.id}
                className="border-b"
                style={{ borderColor: 'hsl(222,40%,18%)' }}
              >
                <div
                  className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-[hsl(222,84%,7%)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  {/* Alert type icon */}
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'hsl(222,84%,5%)' }}
                  >
                    <typeCfg.Icon
                      className={`w-3.5 h-3.5 ${alert.alertType === 'stuck_loop' ? 'animate-spin' : ''}`}
                      style={{ color: typeCfg.color }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: 'hsl(210,40%,98%)' }}
                          >
                            {typeCfg.label}
                          </span>
                          <span style={{ color: 'hsl(215,16%,47%)' }}>·</span>
                          <span
                            className="text-xs font-mono"
                            style={{ color: 'hsl(217,91%,60%)' }}
                          >
                            {alert.affectedAgent}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <resCfg.Icon
                            className="w-2.5 h-2.5"
                            style={{ color: resCfg.color }}
                          />
                          <span
                            className="text-[10px]"
                            style={{ color: resCfg.color }}
                          >
                            {resCfg.label}
                          </span>
                          <span style={{ color: 'hsl(215,16%,47%)' }}>·</span>
                          <span
                            className="text-[10px]"
                            style={{ color: 'hsl(215,16%,47%)' }}
                          >
                            {formatRelativeTime(alert.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: actionCfg.bg,
                            border: `1px solid ${actionCfg.border}`,
                            color: actionCfg.text,
                          }}
                        >
                          {actionCfg.label}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" style={{ color: 'hsl(215,16%,47%)' }} />
                        ) : (
                          <ChevronRight className="w-3 h-3" style={{ color: 'hsl(215,16%,47%)' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="px-4 pb-3"
                    style={{ background: 'hsl(222,84%,5%)' }}
                  >
                    {alert.affectedProject && (
                      <p
                        className="text-[10px] mb-2"
                        style={{ color: 'hsl(215,16%,47%)' }}
                      >
                        Project:{' '}
                        <span style={{ color: 'hsl(215,20%,65%)' }}>
                          {alert.affectedProject}
                        </span>
                      </p>
                    )}

                    {alert.detail && (
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: 'hsl(215,20%,65%)' }}
                      >
                        {alert.detail}
                      </p>
                    )}

                    {alert.costDelta !== undefined && (
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded mb-3"
                        style={{
                          background: 'hsl(0,72%,10%)',
                          border: '1px solid hsl(0,72%,51%)',
                        }}
                      >
                        <DollarSign className="w-3 h-3" style={{ color: 'hsl(0,72%,70%)' }} />
                        <span className="text-xs font-bold" style={{ color: 'hsl(0,72%,70%)' }}>
                          +${alert.costDelta.toFixed(2)} cost spike
                        </span>
                      </div>
                    )}

                    {alert.loopCount !== undefined && (
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded mb-3"
                        style={{
                          background: 'hsl(38,92%,10%)',
                          border: '1px solid hsl(38,92%,50%)',
                        }}
                      >
                        <RefreshCw className="w-3 h-3" style={{ color: 'hsl(38,92%,70%)' }} />
                        <span className="text-xs font-bold" style={{ color: 'hsl(38,92%,70%)' }}>
                          {alert.loopCount} loops detected
                        </span>
                      </div>
                    )}

                    {alert.resolution === 'open' && (
                      <div className="flex items-center gap-2">
                        {onDismiss && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDismiss(alert.id)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors"
                            style={{
                              background: 'hsl(222,47%,11%)',
                              border: '1px solid hsl(222,40%,18%)',
                              color: 'hsl(215,20%,65%)',
                            }}
                          >
                            <Pause className="w-3 h-3" />
                            Dismiss
                          </button>
                        )}
                        {onEscalate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEscalate(alert.id)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors"
                            style={{
                              background: 'hsl(0,72%,10%)',
                              border: '1px solid hsl(0,72%,51%)',
                              color: 'hsl(0,72%,70%)',
                            }}
                          >
                            <AlertCircle className="w-3 h-3" />
                            Escalate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
