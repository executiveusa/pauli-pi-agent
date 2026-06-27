'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock, Command, Search, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { Command as CommandType } from './CommandButton'

interface CommandPaletteProps {
  commands: CommandType[]
  recentCommandIds?: string[]
  onExecute: (commandId: string) => void
  onClose: () => void
  isOpen: boolean
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

export default function CommandPalette({
  commands,
  recentCommandIds = [],
  onExecute,
  onClose,
  isOpen,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter commands
  const q = query.toLowerCase().trim()
  const filtered = q
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.agentTarget ?? '').toLowerCase().includes(q)
      )
    : commands

  // Build display sections
  interface Section {
    title: string
    items: CommandType[]
    isRecent?: boolean
  }

  const sections: Section[] = []

  if (!q && recentCommandIds.length > 0) {
    const recentCmds = recentCommandIds
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is CommandType => c !== undefined)
      .slice(0, 3)
    if (recentCmds.length > 0) {
      sections.push({ title: 'Recent', items: recentCmds, isRecent: true })
    }
  }

  // Group by category
  const byCategory = new Map<string, CommandType[]>()
  for (const cmd of filtered) {
    const cat = cmd.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(cmd)
  }
  for (const [cat, items] of byCategory) {
    sections.push({ title: cat, items })
  }

  // Flat list for keyboard navigation
  const flatItems = sections.flatMap((s) => s.items)

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = flatItems[selectedIndex]
        if (cmd) {
          onExecute(cmd.id)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [flatItems, selectedIndex, onExecute, onClose]
  )

  // Track global flat index per item
  let globalIndex = 0

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'hsl(222,84%,3%,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(222,47%,11%)',
          border: '1px solid hsl(222,40%,18%)',
          boxShadow: '0 24px 64px hsl(222,84%,3%,0.9)',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'hsl(222,40%,18%)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'hsl(215,16%,47%)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[hsl(215,16%,47%)]"
            style={{ color: 'hsl(210,40%,98%)' }}
          />
          <div className="flex items-center gap-2">
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="w-3.5 h-3.5" style={{ color: 'hsl(215,16%,47%)' }} />
              </button>
            )}
            <kbd
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono"
              style={{
                background: 'hsl(222,84%,5%)',
                border: '1px solid hsl(222,40%,18%)',
                color: 'hsl(215,16%,47%)',
              }}
            >
              ESC
            </kbd>
          </div>
        </div>

        {/* Results list */}
        <div ref={listRef} className="overflow-y-auto max-h-[50vh]">
          {flatItems.length === 0 ? (
            <div
              className="flex items-center justify-center h-16 text-sm"
              style={{ color: 'hsl(215,16%,47%)' }}
            >
              No commands match &ldquo;{query}&rdquo;
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.title}>
                {/* Section header */}
                <div
                  className="flex items-center gap-2 px-4 py-2 sticky top-0"
                  style={{ background: 'hsl(222,84%,5%)' }}
                >
                  {section.isRecent && (
                    <Clock className="w-3 h-3" style={{ color: 'hsl(215,16%,47%)' }} />
                  )}
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: 'hsl(215,16%,47%)' }}
                  >
                    {section.title}
                  </span>
                </div>

                {/* Commands in this section */}
                {section.items.map((cmd) => {
                  const idx = globalIndex++
                  const isSelected = idx === selectedIndex
                  const Icon = getDynamicIcon(cmd.iconName)
                  const categoryColor = CATEGORY_COLORS[cmd.category] ?? 'hsl(217,91%,60%)'

                  return (
                    <div
                      key={cmd.id}
                      data-index={idx}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                      style={{
                        background: isSelected
                          ? 'hsl(217,91%,10%)'
                          : 'transparent',
                        borderLeft: isSelected
                          ? '2px solid hsl(217,91%,60%)'
                          : '2px solid transparent',
                      }}
                      onClick={() => {
                        onExecute(cmd.id)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {/* Icon */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${categoryColor}20` }}
                      >
                        {Icon && (
                          <Icon className="w-3.5 h-3.5" style={{ color: categoryColor }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: 'hsl(210,40%,98%)' }}
                        >
                          {cmd.title}
                        </p>
                        <p
                          className="text-[10px] truncate"
                          style={{ color: 'hsl(215,16%,47%)' }}
                        >
                          {cmd.description}
                        </p>
                      </div>

                      {/* Shortcut + category */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: `${categoryColor}15`,
                            color: categoryColor,
                          }}
                        >
                          {cmd.category}
                        </span>
                        {cmd.shortcut && (
                          <kbd
                            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono"
                            style={{
                              background: 'hsl(222,84%,5%)',
                              border: '1px solid hsl(222,40%,18%)',
                              color: 'hsl(215,16%,47%)',
                            }}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{
            borderColor: 'hsl(222,40%,18%)',
            background: 'hsl(222,84%,5%)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px]" style={{ color: 'hsl(215,16%,47%)' }}>
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'hsl(222,40%,18%)' }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1 text-[9px]" style={{ color: 'hsl(215,16%,47%)' }}>
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'hsl(222,40%,18%)' }}>↵</kbd>
              execute
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px]" style={{ color: 'hsl(215,16%,47%)' }}>
            <Command className="w-2.5 h-2.5" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}
