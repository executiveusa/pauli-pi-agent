'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Scale,
} from 'lucide-react'

export type JudgeVerdict = 'PASS' | 'PASS WITH CONDITIONS' | 'FAIL' | 'PENDING'

export interface JudgeDecision {
  id: string
  projectId: string
  projectName: string
  verdict: JudgeVerdict
  udecScore: number
  motScore: number
  accScore: number
  overallScore: number
  timestamp: string
  conditions?: string[]
  summary?: string
  agentId?: string
}

interface JudgeDecisionsTableProps {
  decisions: JudgeDecision[]
}

const VERDICT_CONFIG: Record<
  JudgeVerdict,
  { bg: string; border: string; text: string; glow?: string }
> = {
  PASS: {
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    text: 'hsl(142,76%,60%)',
    glow: '0 0 6px hsl(142,76%,36%)',
  },
  'PASS WITH CONDITIONS': {
    bg: 'hsl(38,92%,10%)',
    border: 'hsl(38,92%,50%)',
    text: 'hsl(38,92%,70%)',
  },
  FAIL: {
    bg: 'hsl(0,72%,10%)',
    border: 'hsl(0,72%,51%)',
    text: 'hsl(0,72%,70%)',
    glow: '0 0 6px hsl(0,72%,51%)',
  },
  PENDING: {
    bg: 'hsl(222,47%,11%)',
    border: 'hsl(222,40%,18%)',
    text: 'hsl(215,20%,65%)',
  },
}

function scoreColor(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 80) return 'hsl(142,76%,60%)'
  if (pct >= 60) return 'hsl(38,92%,70%)'
  return 'hsl(0,72%,70%)'
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ScorePill({ label, value, max }: { label: string; value: number; max: number }) {
  const color = scoreColor(value, max)
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(215,16%,47%)' }}>
        {label}
      </span>
      <span className="text-xs font-black" style={{ color }}>
        {value}
        <span className="text-[9px] font-normal" style={{ color: 'hsl(215,16%,47%)' }}>
          /{max}
        </span>
      </span>
    </div>
  )
}

export default function JudgeDecisionsTable({ decisions }: JudgeDecisionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
          <Scale className="w-4 h-4" style={{ color: 'hsl(217,91%,60%)' }} />
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            Judge Decisions
          </h3>
        </div>
        <span
          className="text-[10px]"
          style={{ color: 'hsl(215,16%,47%)' }}
        >
          {decisions.length} total
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid gap-2 px-4 py-2 border-b"
        style={{
          gridTemplateColumns: '1fr 120px 120px 80px',
          borderColor: 'hsl(222,40%,18%)',
          background: 'hsl(222,84%,5%)',
        }}
      >
        {['Project', 'Verdict', 'Scores', 'Time'].map((h) => (
          <span
            key={h}
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto max-h-80">
        {decisions.length === 0 ? (
          <div
            className="flex items-center justify-center h-20 text-sm"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            No decisions yet
          </div>
        ) : (
          decisions.map((decision) => {
            const vcfg = VERDICT_CONFIG[decision.verdict]
            const isExpanded = expandedId === decision.id

            return (
              <div
                key={decision.id}
                className="border-b"
                style={{ borderColor: 'hsl(222,40%,18%)' }}
              >
                {/* Main row */}
                <div
                  className="grid gap-2 px-4 py-2.5 cursor-pointer hover:bg-[hsl(222,84%,7%)] transition-colors items-center"
                  style={{ gridTemplateColumns: '1fr 120px 120px 80px' }}
                  onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                >
                  {/* Project name */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'hsl(215,16%,47%)' }} />
                    ) : (
                      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'hsl(215,16%,47%)' }} />
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: 'hsl(210,40%,98%)' }}
                      >
                        {decision.projectName}
                      </p>
                      <p
                        className="text-[10px] font-mono truncate"
                        style={{ color: 'hsl(215,16%,47%)' }}
                      >
                        {decision.projectId}
                      </p>
                    </div>
                  </div>

                  {/* Verdict badge */}
                  <div>
                    <span
                      className="inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg"
                      style={{
                        background: vcfg.bg,
                        border: `1px solid ${vcfg.border}`,
                        color: vcfg.text,
                        boxShadow: vcfg.glow,
                      }}
                    >
                      {decision.verdict}
                    </span>
                  </div>

                  {/* Scores summary */}
                  <div className="flex items-center gap-2">
                    <ScorePill label="U" value={decision.udecScore} max={10} />
                    <ScorePill label="M" value={decision.motScore} max={10} />
                    <ScorePill label="A" value={decision.accScore} max={10} />
                  </div>

                  {/* Timestamp */}
                  <p className="text-[10px]" style={{ color: 'hsl(215,16%,47%)' }}>
                    {formatTimestamp(decision.timestamp)}
                  </p>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="px-6 pb-4"
                    style={{ background: 'hsl(222,84%,5%)' }}
                  >
                    {/* Score breakdown */}
                    <div
                      className="grid grid-cols-4 gap-3 p-3 rounded-lg mb-3"
                      style={{ background: 'hsl(222,47%,11%)' }}
                    >
                      {[
                        { label: 'UDEC', value: decision.udecScore, max: 10 },
                        { label: 'MOT', value: decision.motScore, max: 10 },
                        { label: 'ACC', value: decision.accScore, max: 10 },
                        { label: 'OVERALL', value: decision.overallScore, max: 10 },
                      ].map(({ label, value, max }) => {
                        const color = scoreColor(value, max)
                        return (
                          <div key={label} className="text-center">
                            <p
                              className="text-[9px] uppercase tracking-wider mb-1"
                              style={{ color: 'hsl(215,16%,47%)' }}
                            >
                              {label}
                            </p>
                            <p className="text-lg font-black" style={{ color }}>
                              {value}
                              <span
                                className="text-xs font-normal"
                                style={{ color: 'hsl(215,16%,47%)' }}
                              >
                                /{max}
                              </span>
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary */}
                    {decision.summary && (
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: 'hsl(215,20%,65%)' }}
                      >
                        {decision.summary}
                      </p>
                    )}

                    {/* Conditions */}
                    {decision.conditions && decision.conditions.length > 0 && (
                      <div>
                        <p
                          className="text-[9px] font-bold uppercase tracking-widest mb-2"
                          style={{ color: 'hsl(38,92%,70%)' }}
                        >
                          Conditions
                        </p>
                        <ul className="flex flex-col gap-1">
                          {decision.conditions.map((c, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs"
                              style={{ color: 'hsl(215,20%,65%)' }}
                            >
                              <span style={{ color: 'hsl(38,92%,70%)' }}>›</span>
                              {c}
                            </li>
                          ))}
                        </ul>
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
