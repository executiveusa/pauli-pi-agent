'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  Clock,
  CreditCard,
  DnsIcon,
  Globe,
  Rocket,
  ShieldAlert,
  X,
} from 'lucide-react'

export type ApprovalType = 'deployment' | 'dns' | 'financial' | 'access'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalItem {
  id: string
  type: ApprovalType
  title: string
  description: string
  requestorAgent: string
  requestedAt: string
  riskLevel: RiskLevel
  status: ApprovalStatus
  environment?: string
  projectName?: string
}

interface HumanApprovalQueueProps {
  items: ApprovalItem[]
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
}

const TYPE_CONFIG: Record<ApprovalType, { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  deployment: { label: 'Deployment', Icon: Rocket },
  dns: { label: 'DNS Change', Icon: Globe },
  financial: { label: 'Financial', Icon: CreditCard },
  access: { label: 'Access', Icon: ShieldAlert },
}

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; border: string; text: string }> = {
  low: {
    label: 'LOW',
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    text: 'hsl(142,76%,60%)',
  },
  medium: {
    label: 'MEDIUM',
    bg: 'hsl(217,91%,10%)',
    border: 'hsl(217,91%,60%)',
    text: 'hsl(217,91%,70%)',
  },
  high: {
    label: 'HIGH',
    bg: 'hsl(38,92%,10%)',
    border: 'hsl(38,92%,50%)',
    text: 'hsl(38,92%,70%)',
  },
  critical: {
    label: 'CRITICAL',
    bg: 'hsl(0,72%,10%)',
    border: 'hsl(0,72%,51%)',
    text: 'hsl(0,72%,70%)',
  },
}

const STATUS_CONFIG: Record<ApprovalStatus, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'hsl(38,92%,10%)',
    border: 'hsl(38,92%,50%)',
    text: 'hsl(38,92%,70%)',
  },
  approved: {
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    text: 'hsl(142,76%,60%)',
  },
  rejected: {
    bg: 'hsl(0,72%,10%)',
    border: 'hsl(0,72%,51%)',
    text: 'hsl(0,72%,70%)',
  },
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function HumanApprovalQueue({
  items,
  onApprove,
  onReject,
}: HumanApprovalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pending = items.filter((i) => i.status === 'pending').length

  async function handleApprove(id: string) {
    if (!onApprove) return
    setProcessingId(id)
    try {
      await onApprove(id)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id: string) {
    if (!onReject) return
    setProcessingId(id)
    try {
      await onReject(id)
    } finally {
      setProcessingId(null)
    }
  }

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
          <AlertTriangle
            className="w-4 h-4"
            style={{ color: 'hsl(38,92%,50%)' }}
          />
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            Human Approval Queue
          </h3>
        </div>
        {pending > 0 && (
          <span
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
            style={{
              background: 'hsl(38,92%,10%)',
              border: '1px solid hsl(38,92%,50%)',
              color: 'hsl(38,92%,70%)',
            }}
          >
            <Clock className="w-2.5 h-2.5" />
            {pending} pending
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-24 gap-2"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            <Check className="w-5 h-5" />
            <span className="text-sm">All caught up</span>
          </div>
        ) : (
          items.map((item) => {
            const typeCfg = TYPE_CONFIG[item.type]
            const riskCfg = RISK_CONFIG[item.riskLevel]
            const statusCfg = STATUS_CONFIG[item.status]
            const isExpanded = expandedId === item.id
            const isProcessing = processingId === item.id

            return (
              <div
                key={item.id}
                className="border-b transition-colors"
                style={{ borderColor: 'hsl(222,40%,18%)' }}
              >
                {/* Main row */}
                <div
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(222,84%,7%)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Type icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'hsl(222,84%,5%)' }}
                  >
                    <typeCfg.Icon
                      className="w-3.5 h-3.5"
                      style={{ color: 'hsl(217,91%,60%)' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: 'hsl(210,40%,98%)' }}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px]"
                            style={{ color: 'hsl(215,16%,47%)' }}
                          >
                            {typeCfg.label}
                          </span>
                          <span style={{ color: 'hsl(215,16%,47%)' }}>·</span>
                          <span
                            className="text-[10px]"
                            style={{ color: 'hsl(215,16%,47%)' }}
                          >
                            {item.requestorAgent}
                          </span>
                          <span style={{ color: 'hsl(215,16%,47%)' }}>·</span>
                          <span
                            className="text-[10px]"
                            style={{ color: 'hsl(215,16%,47%)' }}
                          >
                            {formatRelativeTime(item.requestedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Risk badge */}
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: riskCfg.bg,
                            border: `1px solid ${riskCfg.border}`,
                            color: riskCfg.text,
                          }}
                        >
                          {riskCfg.label}
                        </span>

                        {/* Status badge */}
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: statusCfg.bg,
                            border: `1px solid ${statusCfg.border}`,
                            color: statusCfg.text,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className="px-4 pb-3"
                    style={{ background: 'hsl(222,84%,5%)' }}
                  >
                    <p
                      className="text-xs mb-3 leading-relaxed"
                      style={{ color: 'hsl(215,20%,65%)' }}
                    >
                      {item.description}
                    </p>

                    {(item.projectName || item.environment) && (
                      <div className="flex items-center gap-3 mb-3">
                        {item.projectName && (
                          <div>
                            <p
                              className="text-[9px] uppercase tracking-wider mb-0.5"
                              style={{ color: 'hsl(215,16%,47%)' }}
                            >
                              Project
                            </p>
                            <p
                              className="text-xs font-mono"
                              style={{ color: 'hsl(217,91%,60%)' }}
                            >
                              {item.projectName}
                            </p>
                          </div>
                        )}
                        {item.environment && (
                          <div>
                            <p
                              className="text-[9px] uppercase tracking-wider mb-0.5"
                              style={{ color: 'hsl(215,16%,47%)' }}
                            >
                              Environment
                            </p>
                            <p
                              className="text-xs font-mono"
                              style={{ color: 'hsl(210,40%,98%)' }}
                            >
                              {item.environment}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {item.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(item.id)
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          style={{
                            background: 'hsl(142,76%,10%)',
                            border: '1px solid hsl(142,76%,36%)',
                            color: 'hsl(142,76%,60%)',
                          }}
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReject(item.id)
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          style={{
                            background: 'hsl(0,72%,10%)',
                            border: '1px solid hsl(0,72%,51%)',
                            color: 'hsl(0,72%,70%)',
                          }}
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
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
