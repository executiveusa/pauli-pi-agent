'use client'

import { useCallback, useEffect, useState } from 'react'
import { Command, Search, Zap } from 'lucide-react'
import CommandButton, { type Command as CommandType, type CommandStatus } from './CommandButton'
import CommandPalette from './CommandPalette'

interface ActionCenterProps {
  commands: CommandType[]
  onExecute: (commandId: string, args?: Record<string, unknown>) => Promise<void>
  activeCommandId?: string
  userPermission?: 'developer' | 'admin' | 'reviewer'
}

const CATEGORIES = ['Audit', 'Build', 'Design', 'QA', 'Deploy', 'Monetize', 'Monitor']

type CommandStatuses = Record<string, CommandStatus>

export default function ActionCenter({
  commands,
  onExecute,
  activeCommandId,
  userPermission = 'developer',
}: ActionCenterProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [commandStatuses, setCommandStatuses] = useState<CommandStatuses>({})
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([])
  const [searchFilter, setSearchFilter] = useState('')

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleExecute = useCallback(
    async (commandId: string) => {
      setCommandStatuses((prev) => ({ ...prev, [commandId]: 'running' }))
      setRecentCommandIds((prev) => {
        const next = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 5)
        return next
      })
      try {
        await onExecute(commandId)
        setCommandStatuses((prev) => ({ ...prev, [commandId]: 'success' }))
        setTimeout(() => {
          setCommandStatuses((prev) => {
            const next = { ...prev }
            if (next[commandId] === 'success') delete next[commandId]
            return next
          })
        }, 3000)
      } catch {
        setCommandStatuses((prev) => ({ ...prev, [commandId]: 'error' }))
        setTimeout(() => {
          setCommandStatuses((prev) => {
            const next = { ...prev }
            if (next[commandId] === 'error') delete next[commandId]
            return next
          })
        }, 5000)
      }
    },
    [onExecute]
  )

  // Build categories list
  const availableCategories = ['All', ...CATEGORIES.filter((cat) =>
    commands.some((c) => c.category === cat)
  )]

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory
    const matchesSearch =
      !searchFilter ||
      cmd.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group by category for display
  const grouped = new Map<string, CommandType[]>()
  if (activeCategory === 'All') {
    for (const cmd of filteredCommands) {
      if (!grouped.has(cmd.category)) grouped.set(cmd.category, [])
      grouped.get(cmd.category)!.push(cmd)
    }
  } else {
    grouped.set(activeCategory, filteredCommands)
  }

  const runningCount = Object.values(commandStatuses).filter((s) => s === 'running').length

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'hsl(222,84%,5%)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'hsl(217,91%,60%)',
              boxShadow: '0 0 12px hsl(217,91%,60%,0.4)',
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: 'hsl(210,40%,98%)' }}
            >
              Action Center
            </h2>
            <p className="text-[10px]" style={{ color: 'hsl(215,16%,47%)' }}>
              {commands.length} commands available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse"
              style={{
                background: 'hsl(217,91%,10%)',
                border: '1px solid hsl(217,91%,60%)',
                color: 'hsl(217,91%,70%)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(217,91%,60%)]" />
              {runningCount} running
            </span>
          )}

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-[hsl(222,47%,11%)]"
            style={{
              background: 'hsl(222,47%,11%)',
              border: '1px solid hsl(222,40%,18%)',
              color: 'hsl(215,20%,65%)',
            }}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Search + category filter */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div
          className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg"
          style={{
            background: 'hsl(222,47%,11%)',
            border: '1px solid hsl(222,40%,18%)',
          }}
        >
          <Search className="w-3.5 h-3.5" style={{ color: 'hsl(215,16%,47%)' }} />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter actions..."
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-[hsl(215,16%,47%)]"
            style={{ color: 'hsl(210,40%,98%)' }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background:
                  activeCategory === cat
                    ? 'hsl(217,91%,60%)'
                    : 'hsl(222,47%,11%)',
                color:
                  activeCategory === cat
                    ? 'hsl(210,40%,98%)'
                    : 'hsl(215,16%,47%)',
                border:
                  activeCategory === cat
                    ? '1px solid hsl(217,91%,60%)'
                    : '1px solid hsl(222,40%,18%)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commands grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {grouped.size === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 gap-2"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            <Search className="w-6 h-6" />
            <p className="text-sm">No commands found</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, cmds]) => (
            <div key={category} className="mb-6">
              {activeCategory === 'All' && (
                <h3
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(215,16%,47%)' }}
                >
                  {category}
                </h3>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {cmds.map((cmd) => (
                  <CommandButton
                    key={cmd.id}
                    command={cmd}
                    status={
                      activeCommandId === cmd.id
                        ? 'running'
                        : commandStatuses[cmd.id]
                    }
                    isActive={activeCommandId === cmd.id}
                    onClick={() => handleExecute(cmd.id)}
                    userPermission={userPermission}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        commands={commands}
        recentCommandIds={recentCommandIds}
        onExecute={handleExecute}
        onClose={() => setPaletteOpen(false)}
        isOpen={paletteOpen}
      />
    </div>
  )
}
