'use client'

import { Activity, Cpu, GitBranch, Star, Zap } from 'lucide-react'

interface FactoryStatusHeaderProps {
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE'
  activeProjects: number
  runningAgents: number
  todayBuilds: number
  avgQualityScore: number
  lastUpdated?: string
}

const STATUS_CONFIG = {
  OPERATIONAL: {
    bg: 'bg-[hsl(142,76%,36%)]',
    text: 'text-[hsl(142,76%,90%)]',
    ring: 'shadow-[0_0_8px_hsl(142,76%,36%)]',
    dot: 'bg-[hsl(142,76%,60%)]',
  },
  DEGRADED: {
    bg: 'bg-[hsl(38,92%,50%)]',
    text: 'text-[hsl(38,92%,10%)]',
    ring: 'shadow-[0_0_8px_hsl(38,92%,50%)]',
    dot: 'bg-[hsl(38,92%,70%)]',
  },
  OFFLINE: {
    bg: 'bg-[hsl(0,72%,51%)]',
    text: 'text-[hsl(0,72%,95%)]',
    ring: 'shadow-[0_0_8px_hsl(0,72%,51%)]',
    dot: 'bg-[hsl(0,72%,70%)]',
  },
}

const METRICS = [
  {
    key: 'activeProjects' as const,
    label: 'Active Projects',
    icon: GitBranch,
    color: 'text-[hsl(217,91%,60%)]',
  },
  {
    key: 'runningAgents' as const,
    label: 'Running Agents',
    icon: Cpu,
    color: 'text-[hsl(142,76%,36%)]',
  },
  {
    key: 'todayBuilds' as const,
    label: "Today's Builds",
    icon: Zap,
    color: 'text-[hsl(38,92%,50%)]',
  },
]

export default function FactoryStatusHeader({
  systemStatus,
  activeProjects,
  runningAgents,
  todayBuilds,
  avgQualityScore,
  lastUpdated,
}: FactoryStatusHeaderProps) {
  const cfg = STATUS_CONFIG[systemStatus]
  const metricValues: Record<string, number> = {
    activeProjects,
    runningAgents,
    todayBuilds,
  }

  const qualityColor =
    avgQualityScore >= 8
      ? 'text-[hsl(142,76%,36%)]'
      : avgQualityScore >= 6
      ? 'text-[hsl(38,92%,50%)]'
      : 'text-[hsl(0,72%,51%)]'

  return (
    <header
      className="w-full border-b"
      style={{
        background:
          'linear-gradient(135deg, hsl(222,84%,7%) 0%, hsl(222,60%,9%) 100%)',
        borderColor: 'hsl(222,40%,18%)',
      }}
    >
      <div className="px-6 py-4">
        {/* Top row — title + status pill */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(217,91%,60%)', boxShadow: '0 0 12px hsl(217,91%,60%)' }}
            >
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1
                className="text-xs font-bold tracking-[0.2em] uppercase"
                style={{ color: 'hsl(215,20%,65%)' }}
              >
                Pauli Pi
              </h1>
              <h2
                className="text-lg font-black tracking-[0.08em] uppercase leading-none"
                style={{ color: 'hsl(210,40%,98%)' }}
              >
                Software Factory
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span
                className="text-xs"
                style={{ color: 'hsl(215,16%,47%)' }}
              >
                Updated {lastUpdated}
              </span>
            )}
            {/* Status pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${cfg.ring}`}
              style={{
                background:
                  systemStatus === 'OPERATIONAL'
                    ? 'hsl(142,76%,10%)'
                    : systemStatus === 'DEGRADED'
                    ? 'hsl(38,92%,12%)'
                    : 'hsl(0,72%,12%)',
                border:
                  systemStatus === 'OPERATIONAL'
                    ? '1px solid hsl(142,76%,36%)'
                    : systemStatus === 'DEGRADED'
                    ? '1px solid hsl(38,92%,50%)'
                    : '1px solid hsl(0,72%,51%)',
                color:
                  systemStatus === 'OPERATIONAL'
                    ? 'hsl(142,76%,60%)'
                    : systemStatus === 'DEGRADED'
                    ? 'hsl(38,92%,70%)'
                    : 'hsl(0,72%,70%)',
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`}
              />
              {systemStatus}
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-6 flex-wrap">
          {METRICS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: 'hsl(222,47%,11%)' }}
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div>
                <p
                  className="text-xs leading-none mb-0.5"
                  style={{ color: 'hsl(215,16%,47%)' }}
                >
                  {label}
                </p>
                <p
                  className="text-lg font-black leading-none"
                  style={{ color: 'hsl(210,40%,98%)' }}
                >
                  {metricValues[key]}
                </p>
              </div>
            </div>
          ))}

          {/* Divider */}
          <div
            className="w-px h-10 hidden sm:block"
            style={{ background: 'hsl(222,40%,18%)' }}
          />

          {/* Quality score */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'hsl(222,47%,11%)' }}
            >
              <Star className={`w-3.5 h-3.5 ${qualityColor}`} />
            </div>
            <div>
              <p
                className="text-xs leading-none mb-0.5"
                style={{ color: 'hsl(215,16%,47%)' }}
              >
                Avg Quality
              </p>
              <p className={`text-lg font-black leading-none ${qualityColor}`}>
                {avgQualityScore.toFixed(1)}
                <span
                  className="text-xs font-normal ml-0.5"
                  style={{ color: 'hsl(215,16%,47%)' }}
                >
                  /10
                </span>
              </p>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="ml-auto hidden lg:flex items-center gap-1">
            {[...Array(20)].map((_, i) => {
              const filled = i < Math.round((avgQualityScore / 10) * 20)
              return (
                <div
                  key={i}
                  className="w-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${8 + Math.sin(i * 0.8) * 4}px`,
                    background: filled
                      ? 'hsl(217,91%,60%)'
                      : 'hsl(222,40%,18%)',
                    opacity: filled ? 1 : 0.5,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
