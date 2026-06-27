'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

export type CommandStatus = 'idle' | 'running' | 'success' | 'error'

export interface Command {
  id: string
  title: string
  description: string
  category: string
  iconName: keyof typeof LucideIcons
  shortcut?: string
  permission?: 'developer' | 'admin' | 'reviewer' | 'all'
  agentTarget?: string
}

interface CommandButtonProps {
  command: Command
  status?: CommandStatus
  isActive?: boolean
  onClick: () => void
  userPermission?: 'developer' | 'admin' | 'reviewer'
}

const CATEGORY_COLORS: Record<string, string> = {
  Audit: 'hsl(38,92%,50%)',
  Build: 'hsl(217,91%,60%)',
  Design: 'hsl(280,70%,60%)',
  QA: 'hsl(142,76%,36%)',
  Deploy: 'hsl(142,76%,60%)',
  Monetize: 'hsl(38,92%,70%)',
  Monitor: 'hsl(215,20%,65%)',
}

function getDynamicIcon(iconName: keyof typeof LucideIcons): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  const Icon = LucideIcons[iconName] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined
  return Icon ?? null
}

export default function CommandButton({
  command,
  status = 'idle',
  isActive = false,
  onClick,
  userPermission,
}: CommandButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const categoryColor = CATEGORY_COLORS[command.category] ?? 'hsl(217,91%,60%)'
  const Icon = getDynamicIcon(command.iconName)

  const isRunning = status === 'running' || isActive
  const isSuccess = status === 'success'
  const isError = status === 'error'

  const isDisabled =
    command.permission &&
    command.permission !== 'all' &&
    userPermission !== 'admin' &&
    userPermission !== command.permission

  function renderStatusIcon() {
    if (isRunning) return <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'hsl(217,91%,60%)' }} />
    if (isSuccess) return <CheckCircle className="w-3 h-3" style={{ color: 'hsl(142,76%,60%)' }} />
    if (isError) return <XCircle className="w-3 h-3" style={{ color: 'hsl(0,72%,70%)' }} />
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={isDisabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-full flex flex-col gap-2 p-3 rounded-xl text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed group"
        style={{
          background: isRunning
            ? 'hsl(217,91%,10%)'
            : isSuccess
            ? 'hsl(142,76%,8%)'
            : isError
            ? 'hsl(0,72%,8%)'
            : 'hsl(222,47%,11%)',
          border: isRunning
            ? '1px solid hsl(217,91%,60%)'
            : isSuccess
            ? '1px solid hsl(142,76%,36%)'
            : isError
            ? '1px solid hsl(0,72%,51%)'
            : '1px solid hsl(222,40%,18%)',
          boxShadow: isRunning ? '0 0 8px hsl(217,91%,60%,0.3)' : undefined,
        }}
      >
        {/* Icon row */}
        <div className="flex items-center justify-between">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `${categoryColor}20`,
              border: `1px solid ${categoryColor}40`,
            }}
          >
            {Icon && (
              <Icon
                className="w-4 h-4"
                style={{ color: categoryColor }}
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {renderStatusIcon()}
            {command.shortcut && !isRunning && (
              <kbd
                className="hidden group-hover:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                style={{
                  background: 'hsl(222,84%,5%)',
                  border: '1px solid hsl(222,40%,18%)',
                  color: 'hsl(215,16%,47%)',
                }}
              >
                {command.shortcut}
              </kbd>
            )}
          </div>
        </div>

        {/* Title and description */}
        <div>
          <p
            className="text-xs font-bold leading-tight"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            {command.title}
          </p>
          <p
            className="text-[10px] mt-0.5 leading-relaxed line-clamp-2"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            {command.description}
          </p>
        </div>

        {/* Category tag */}
        <div className="flex items-center gap-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {command.category}
          </span>
          {command.agentTarget && (
            <span
              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: 'hsl(222,84%,5%)',
                color: 'hsl(215,16%,47%)',
              }}
            >
              {command.agentTarget}
            </span>
          )}
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 w-56 p-2.5 rounded-lg text-xs pointer-events-none"
          style={{
            background: 'hsl(222,47%,11%)',
            border: '1px solid hsl(222,40%,18%)',
            boxShadow: '0 8px 32px hsl(222,84%,3%,0.8)',
            color: 'hsl(215,20%,65%)',
          }}
        >
          <p className="font-semibold mb-1" style={{ color: 'hsl(210,40%,98%)' }}>
            {command.title}
          </p>
          <p className="leading-relaxed">{command.description}</p>
          {command.permission && command.permission !== 'all' && (
            <p
              className="mt-1.5 text-[9px] uppercase tracking-wider"
              style={{ color: 'hsl(38,92%,70%)' }}
            >
              Requires: {command.permission}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
