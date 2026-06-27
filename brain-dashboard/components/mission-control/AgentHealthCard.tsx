'use client'

import { Bot, CheckCircle, Clock, Pause, XCircle } from 'lucide-react'

export interface AgentHealthCardProps {
  agentId: string
  name: string
  status: 'active' | 'idle' | 'error' | 'paused'
  lastActivity?: string
  currentTask?: string
  tokensUsed?: number
  successRate?: number // 0-100
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    ringColor: 'hsl(142,76%,36%)',
    ringGlow: '0 0 12px hsl(142,76%,36%)',
    badgeBg: 'hsl(142,76%,10%)',
    badgeBorder: 'hsl(142,76%,36%)',
    badgeText: 'hsl(142,76%,60%)',
    dotPulse: true,
    Icon: CheckCircle,
  },
  idle: {
    label: 'Idle',
    ringColor: 'hsl(215,20%,65%)',
    ringGlow: '0 0 0px transparent',
    badgeBg: 'hsl(222,47%,11%)',
    badgeBorder: 'hsl(222,40%,18%)',
    badgeText: 'hsl(215,20%,65%)',
    dotPulse: false,
    Icon: Clock,
  },
  error: {
    label: 'Error',
    ringColor: 'hsl(0,72%,51%)',
    ringGlow: '0 0 12px hsl(0,72%,51%)',
    badgeBg: 'hsl(0,72%,10%)',
    badgeBorder: 'hsl(0,72%,51%)',
    badgeText: 'hsl(0,72%,70%)',
    dotPulse: true,
    Icon: XCircle,
  },
  paused: {
    label: 'Paused',
    ringColor: 'hsl(38,92%,50%)',
    ringGlow: '0 0 8px hsl(38,92%,50%)',
    badgeBg: 'hsl(38,92%,10%)',
    badgeBorder: 'hsl(38,92%,50%)',
    badgeText: 'hsl(38,92%,70%)',
    dotPulse: false,
    Icon: Pause,
  },
}

function SuccessGauge({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 16
  const offset = circumference - (rate / 100) * circumference
  const color =
    rate >= 80
      ? 'hsl(142,76%,36%)'
      : rate >= 60
      ? 'hsl(38,92%,50%)'
      : 'hsl(0,72%,51%)'

  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="hsl(222,40%,18%)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute text-[9px] font-bold"
        style={{ color }}
      >
        {rate}%
      </span>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function AgentHealthCard({
  agentId,
  name,
  status,
  lastActivity,
  currentTask,
  tokensUsed,
  successRate,
}: AgentHealthCardProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: 'hsl(222,47%,11%)',
        border: `1px solid ${cfg.ringColor}`,
        boxShadow: cfg.ringGlow,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Status ring around bot icon */}
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'hsl(222,84%,5%)',
              border: `2px solid ${cfg.ringColor}`,
              boxShadow: cfg.ringGlow,
            }}
          >
            <Bot
              className="w-4 h-4"
              style={{ color: cfg.ringColor }}
            />
            {cfg.dotPulse && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                style={{ background: cfg.ringColor }}
              />
            )}
          </div>

          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider leading-none"
              style={{ color: 'hsl(210,40%,98%)' }}
            >
              {name}
            </p>
            <p
              className="text-[10px] leading-none mt-0.5"
              style={{ color: 'hsl(215,16%,47%)' }}
            >
              {agentId}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
          style={{
            background: cfg.badgeBg,
            border: `1px solid ${cfg.badgeBorder}`,
            color: cfg.badgeText,
          }}
        >
          <cfg.Icon className="w-2.5 h-2.5" />
          {cfg.label}
        </span>
      </div>

      {/* Current task */}
      <div
        className="text-xs rounded-lg px-3 py-2 min-h-[36px] flex items-center"
        style={{ background: 'hsl(222,84%,5%)', color: 'hsl(215,20%,65%)' }}
      >
        {currentTask ?? (
          <span style={{ color: 'hsl(215,16%,47%)' }}>No active task</span>
        )}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between">
        <div>
          {lastActivity && (
            <p className="text-[10px]" style={{ color: 'hsl(215,16%,47%)' }}>
              {lastActivity}
            </p>
          )}
          {tokensUsed !== undefined && (
            <p className="text-[10px]" style={{ color: 'hsl(215,20%,65%)' }}>
              <span style={{ color: 'hsl(215,16%,47%)' }}>Tokens: </span>
              {formatTokens(tokensUsed)}
            </p>
          )}
        </div>

        {successRate !== undefined && (
          <SuccessGauge rate={successRate} />
        )}
      </div>
    </div>
  )
}
