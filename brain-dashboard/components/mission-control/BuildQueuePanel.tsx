'use client'

import { useState } from 'react'
import {
  Bot,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react'

export interface BuildQueueItem {
  id: string
  projectName: string
  agentAssigned: string
  status: 'queued' | 'building' | 'failed' | 'succeeded'
  startedAt?: string
  durationSeconds?: number
  stage?: string
}

interface BuildQueuePanelProps {
  items: BuildQueueItem[]
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
}

const STATUS_CONFIG = {
  queued: {
    label: 'Queued',
    color: 'hsl(215,20%,65%)',
    bg: 'hsl(222,47%,11%)',
    border: 'hsl(222,40%,18%)',
    Icon: Clock,
    spin: false,
  },
  building: {
    label: 'Building',
    color: 'hsl(217,91%,60%)',
    bg: 'hsl(217,91%,10%)',
    border: 'hsl(217,91%,60%)',
    Icon: Loader2,
    spin: true,
  },
  failed: {
    label: 'Failed',
    color: 'hsl(0,72%,70%)',
    bg: 'hsl(0,72%,10%)',
    border: 'hsl(0,72%,51%)',
    Icon: XCircle,
    spin: false,
  },
  succeeded: {
    label: 'Succeeded',
    color: 'hsl(142,76%,60%)',
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    Icon: CheckCircle,
    spin: false,
  },
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function BuildQueuePanel({
  items,
  onCancel,
  onRetry,
}: BuildQueuePanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const active = items.filter((i) => i.status === 'building').length
  const queued = items.filter((i) => i.status === 'queued').length

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'hsl(222,47%,11%)',
        border: '1px solid hsl(222,40%,18%)',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div className="flex items-center gap-2">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: 'hsl(217,91%,60%)' }}
          />
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            Build Queue
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {active > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'hsl(217,91%,10%)',
                border: '1px solid hsl(217,91%,60%)',
                color: 'hsl(217,91%,60%)',
              }}
            >
              {active} building
            </span>
          )}
          {queued > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'hsl(222,84%,5%)',
                border: '1px solid hsl(222,40%,18%)',
                color: 'hsl(215,20%,65%)',
              }}
            >
              {queued} queued
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto max-h-72">
        {items.length === 0 ? (
          <div
            className="flex items-center justify-center h-24 text-sm"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            Queue is empty
          </div>
        ) : (
          items.map((item) => {
            const cfg = STATUS_CONFIG[item.status]
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b transition-colors"
                style={{
                  borderColor: 'hsl(222,40%,18%)',
                  background:
                    hoveredId === item.id
                      ? 'hsl(222,84%,5%)'
                      : 'transparent',
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Status icon */}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <cfg.Icon
                    className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`}
                    style={{ color: cfg.color }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: 'hsl(210,40%,98%)' }}
                    >
                      {item.projectName}
                    </p>
                    {item.stage && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'hsl(222,84%,5%)',
                          color: 'hsl(215,16%,47%)',
                        }}
                      >
                        {item.stage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Bot className="w-2.5 h-2.5" style={{ color: 'hsl(215,16%,47%)' }} />
                    <span
                      className="text-[10px]"
                      style={{ color: 'hsl(215,16%,47%)' }}
                    >
                      {item.agentAssigned}
                    </span>
                    {item.durationSeconds !== undefined && (
                      <>
                        <span style={{ color: 'hsl(215,16%,47%)' }}>·</span>
                        <span
                          className="text-[10px]"
                          style={{ color: 'hsl(215,16%,47%)' }}
                        >
                          {formatDuration(item.durationSeconds)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    color: cfg.color,
                  }}
                >
                  {cfg.label}
                </span>

                {/* Actions */}
                {hoveredId === item.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'failed' && onRetry && (
                      <button
                        onClick={() => onRetry(item.id)}
                        className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                        style={{
                          background: 'hsl(217,91%,10%)',
                          color: 'hsl(217,91%,60%)',
                        }}
                        title="Retry"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    {(item.status === 'queued' || item.status === 'building') &&
                      onCancel && (
                        <button
                          onClick={() => onCancel(item.id)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                          style={{
                            background: 'hsl(0,72%,10%)',
                            color: 'hsl(0,72%,70%)',
                          }}
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
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
