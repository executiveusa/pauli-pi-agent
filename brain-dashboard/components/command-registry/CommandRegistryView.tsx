'use client'

import { useMemo, useState } from 'react'
import { Filter, Plus, Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { Command } from '../action-center/CommandButton'

interface CommandRegistryViewProps {
  commands: Command[]
  activeCommandIds?: string[]
}

const CATEGORIES = ['All', 'Audit', 'Build', 'Design', 'QA', 'Deploy', 'Monetize', 'Monitor']
const PERMISSIONS = ['All', 'developer', 'admin', 'reviewer', 'all']

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

export default function CommandRegistryView({
  commands,
  activeCommandIds = [],
}: CommandRegistryViewProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [permissionFilter, setPermissionFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return commands.filter((cmd) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        cmd.id.toLowerCase().includes(q) ||
        cmd.title.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        (cmd.agentTarget ?? '').toLowerCase().includes(q)
      const matchesCategory =
        categoryFilter === 'All' || cmd.category === categoryFilter
      const matchesPermission =
        permissionFilter === 'All' || (cmd.permission ?? 'all') === permissionFilter
      return matchesSearch && matchesCategory && matchesPermission
    })
  }, [commands, search, categoryFilter, permissionFilter])

  const activeCount = activeCommandIds.length

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden h-full"
      style={{
        background: 'hsl(222,47%,11%)',
        border: '1px solid hsl(222,40%,18%)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div>
          <h2
            className="text-sm font-black uppercase tracking-wider"
            style={{ color: 'hsl(210,40%,98%)' }}
          >
            Command Registry
          </h2>
          <p className="text-[10px] mt-0.5" style={{ color: 'hsl(215,16%,47%)' }}>
            {filtered.length} of {commands.length} commands
            {activeCount > 0 && (
              <span style={{ color: 'hsl(217,91%,60%)' }}>
                {' '}· {activeCount} active
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: showFilters ? 'hsl(217,91%,10%)' : 'hsl(222,84%,5%)',
              border: showFilters ? '1px solid hsl(217,91%,60%)' : '1px solid hsl(222,40%,18%)',
              color: showFilters ? 'hsl(217,91%,70%)' : 'hsl(215,20%,65%)',
            }}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>

          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors opacity-50 cursor-not-allowed"
            style={{
              background: 'hsl(142,76%,10%)',
              border: '1px solid hsl(142,76%,36%)',
              color: 'hsl(142,76%,60%)',
            }}
            title="Coming soon"
            disabled
          >
            <Plus className="w-3 h-3" />
            Add Command
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
          style={{
            background: 'hsl(222,84%,5%)',
            border: '1px solid hsl(222,40%,18%)',
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(215,16%,47%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by id, title, description, agent..."
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-[hsl(215,16%,47%)]"
            style={{ color: 'hsl(210,40%,98%)' }}
          />
        </div>

        {showFilters && (
          <div className="flex items-start gap-4 flex-wrap">
            {/* Category filter */}
            <div>
              <p
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: 'hsl(215,16%,47%)' }}
              >
                Category
              </p>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                    style={{
                      background:
                        categoryFilter === cat
                          ? CATEGORY_COLORS[cat] ?? 'hsl(217,91%,60%)'
                          : 'hsl(222,84%,5%)',
                      color:
                        categoryFilter === cat
                          ? 'hsl(222,84%,5%)'
                          : 'hsl(215,16%,47%)',
                      border:
                        categoryFilter === cat
                          ? 'none'
                          : '1px solid hsl(222,40%,18%)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Permission filter */}
            <div>
              <p
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: 'hsl(215,16%,47%)' }}
              >
                Permission
              </p>
              <div className="flex flex-wrap gap-1">
                {PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    onClick={() => setPermissionFilter(perm)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                    style={{
                      background:
                        permissionFilter === perm
                          ? 'hsl(217,91%,60%)'
                          : 'hsl(222,84%,5%)',
                      color:
                        permissionFilter === perm
                          ? 'hsl(222,84%,5%)'
                          : 'hsl(215,16%,47%)',
                      border:
                        permissionFilter === perm
                          ? 'none'
                          : '1px solid hsl(222,40%,18%)',
                    }}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div
          className="grid gap-2 px-4 py-2 sticky top-0"
          style={{
            gridTemplateColumns: '200px 1fr 100px 100px 100px 80px',
            background: 'hsl(222,84%,5%)',
            borderBottom: '1px solid hsl(222,40%,18%)',
          }}
        >
          {['Command', 'Description', 'Category', 'Permission', 'Agent', 'Status'].map((h) => (
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
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center h-20 text-sm"
            style={{ color: 'hsl(215,16%,47%)' }}
          >
            No commands match your filters
          </div>
        ) : (
          filtered.map((cmd) => {
            const Icon = getDynamicIcon(cmd.iconName)
            const categoryColor = CATEGORY_COLORS[cmd.category] ?? 'hsl(217,91%,60%)'
            const isActive = activeCommandIds.includes(cmd.id)

            return (
              <div
                key={cmd.id}
                className="grid gap-2 px-4 py-2.5 border-b items-center transition-colors hover:bg-[hsl(222,84%,7%)]"
                style={{
                  gridTemplateColumns: '200px 1fr 100px 100px 100px 80px',
                  borderColor: 'hsl(222,40%,18%)',
                  background: isActive ? 'hsl(217,91%,5%)' : 'transparent',
                }}
              >
                {/* Command ID + title */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${categoryColor}20` }}
                  >
                    {Icon && (
                      <Icon className="w-3 h-3" style={{ color: categoryColor }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: 'hsl(210,40%,98%)' }}
                    >
                      {cmd.title}
                    </p>
                    <p
                      className="text-[9px] font-mono truncate"
                      style={{ color: 'hsl(215,16%,47%)' }}
                    >
                      {cmd.id}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-xs truncate"
                  style={{ color: 'hsl(215,20%,65%)' }}
                >
                  {cmd.description}
                </p>

                {/* Category */}
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit"
                  style={{
                    background: `${categoryColor}15`,
                    color: categoryColor,
                  }}
                >
                  {cmd.category}
                </span>

                {/* Permission */}
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit"
                  style={{
                    background: 'hsl(222,84%,5%)',
                    border: '1px solid hsl(222,40%,18%)',
                    color: 'hsl(215,16%,47%)',
                  }}
                >
                  {cmd.permission ?? 'all'}
                </span>

                {/* Agent */}
                <span
                  className="text-[9px] font-mono truncate"
                  style={{ color: 'hsl(215,16%,47%)' }}
                >
                  {cmd.agentTarget ?? '—'}
                </span>

                {/* Status */}
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit"
                  style={{
                    background: isActive ? 'hsl(217,91%,10%)' : 'hsl(222,84%,5%)',
                    border: isActive
                      ? '1px solid hsl(217,91%,60%)'
                      : '1px solid hsl(222,40%,18%)',
                    color: isActive ? 'hsl(217,91%,70%)' : 'hsl(215,16%,47%)',
                  }}
                >
                  {isActive ? 'Active' : 'Idle'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
