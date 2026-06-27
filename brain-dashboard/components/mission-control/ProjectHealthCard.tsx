'use client'

import { CheckCircle, Clock, Rocket, XCircle } from 'lucide-react'

export interface ProjectHealthCardProps {
  projectId: string
  name: string
  udecScore: number    // 0-10
  motScore: number     // 0-10
  accScore: number     // 0-10
  revenueScore: number // 0-100
  productionReadiness: number // 0-100
  status: 'passing' | 'failing' | 'review' | 'deployed'
  judgeVerdict?: 'PASS' | 'PASS WITH CONDITIONS' | 'FAIL' | 'PENDING'
}

const STATUS_CONFIG = {
  passing: {
    label: 'Passing',
    color: 'hsl(142,76%,36%)',
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    Icon: CheckCircle,
  },
  failing: {
    label: 'Failing',
    color: 'hsl(0,72%,51%)',
    bg: 'hsl(0,72%,10%)',
    border: 'hsl(0,72%,51%)',
    Icon: XCircle,
  },
  review: {
    label: 'In Review',
    color: 'hsl(38,92%,50%)',
    bg: 'hsl(38,92%,10%)',
    border: 'hsl(38,92%,50%)',
    Icon: Clock,
  },
  deployed: {
    label: 'Deployed',
    color: 'hsl(217,91%,60%)',
    bg: 'hsl(217,91%,10%)',
    border: 'hsl(217,91%,60%)',
    Icon: Rocket,
  },
}

const VERDICT_CONFIG = {
  PASS: {
    bg: 'hsl(142,76%,10%)',
    border: 'hsl(142,76%,36%)',
    text: 'hsl(142,76%,60%)',
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
  },
  PENDING: {
    bg: 'hsl(222,47%,11%)',
    border: 'hsl(222,40%,18%)',
    text: 'hsl(215,20%,65%)',
  },
}

function ScoreBar({
  label,
  value,
  max,
}: {
  label: string
  value: number
  max: number
}) {
  const pct = (value / max) * 100
  const color =
    pct >= 80
      ? 'hsl(142,76%,36%)'
      : pct >= 60
      ? 'hsl(38,92%,50%)'
      : 'hsl(0,72%,51%)'

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] font-medium w-10 shrink-0 uppercase tracking-wider"
        style={{ color: 'hsl(215,16%,47%)' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'hsl(222,84%,5%)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-bold w-6 text-right shrink-0"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  )
}

function ReadinessArc({ value }: { value: number }) {
  // SVG half-circle arc for production readiness
  const r = 28
  const cx = 36
  const cy = 36
  const startAngle = Math.PI
  const endAngle = 2 * Math.PI
  const totalArc = endAngle - startAngle
  const filled = startAngle + (value / 100) * totalArc

  const toXY = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  })

  const start = toXY(startAngle)
  const endFull = toXY(endAngle)
  const endFilled = toXY(filled)

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${endFull.x} ${endFull.y}`
  const large = value > 50 ? 1 : 0
  const fgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${endFilled.x} ${endFilled.y}`

  const color =
    value >= 80
      ? 'hsl(142,76%,36%)'
      : value >= 60
      ? 'hsl(38,92%,50%)'
      : 'hsl(0,72%,51%)'

  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="44" viewBox="0 0 72 44">
        <path
          d={bgPath}
          fill="none"
          stroke="hsl(222,40%,18%)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {value > 0 && (
          <path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
      </svg>
      <p className="text-sm font-black -mt-2" style={{ color }}>
        {value}%
      </p>
      <p
        className="text-[9px] uppercase tracking-wider"
        style={{ color: 'hsl(215,16%,47%)' }}
      >
        Prod Ready
      </p>
    </div>
  )
}

export default function ProjectHealthCard({
  projectId,
  name,
  udecScore,
  motScore,
  accScore,
  revenueScore,
  productionReadiness,
  status,
  judgeVerdict,
}: ProjectHealthCardProps) {
  const statusCfg = STATUS_CONFIG[status]
  const verdictCfg = judgeVerdict ? VERDICT_CONFIG[judgeVerdict] : null

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
      style={{
        background: 'hsl(222,47%,11%)',
        border: `1px solid hsl(222,40%,18%)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-sm font-bold truncate"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            {name}
          </p>
          <p
            className="text-[10px] font-mono truncate"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            {projectId}
          </p>
        </div>

        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
          style={{
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            color: statusCfg.color,
          }}
        >
          <statusCfg.Icon className="w-2.5 h-2.5" />
          {statusCfg.label}
        </span>
      </div>

      {/* Scores */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <ScoreBar label="UDEC" value={udecScore} max={10} />
          <ScoreBar label="MOT" value={motScore} max={10} />
          <ScoreBar label="ACC" value={accScore} max={10} />
          <ScoreBar label="REV" value={revenueScore} max={100} />
        </div>

        <ReadinessArc value={productionReadiness} />
      </div>

      {/* Judge verdict */}
      {verdictCfg && judgeVerdict && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: verdictCfg.bg,
            border: `1px solid ${verdictCfg.border}`,
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            Judge:
          </span>
          <span
            className="text-[10px] font-black uppercase tracking-wider"
            style={{ color: verdictCfg.text }}
          >
            {judgeVerdict}
          </span>
        </div>
      )}
    </div>
  )
}
