'use client'

import { useState } from 'react'
import Link from 'next/link'
import NoteTree from '@/components/NoteTree'
import NoteViewer from '@/components/NoteViewer'
import SearchBar from '@/components/SearchBar'
import AgentLog from '@/components/AgentLog'
import { Activity, Bot, Brain, ChevronLeft, ChevronRight, Gauge } from 'lucide-react'

type Panel = 'activity'

export default function Dashboard() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanel, setRightPanel] = useState<Panel>('activity')
  const [rightOpen, setRightOpen] = useState(true)

  function handleWikiLinkClick(name: string) {
    console.log('wiki-link clicked:', name)
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <div
        className={`flex flex-col border-r border-zinc-800 transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
          <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-200 truncate">Second Brain</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <NoteTree onSelect={setSelectedPath} selectedPath={selectedPath ?? undefined} />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Toggle file tree"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <SearchBar onSelect={setSelectedPath} />

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/mercury"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/10"
              title="Mercury control panel"
            >
              <Bot className="w-4 h-4" />
              Mercury
            </Link>
            <Link
              href="/mission-control"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-blue-200 hover:bg-blue-400/10"
              title="Mission control"
            >
              <Gauge className="w-4 h-4" />
              Mission
            </Link>
            <button
              onClick={() => setRightPanel('activity')}
              className={`p-1.5 rounded transition-colors ${
                rightPanel === 'activity' && rightOpen
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Agent activity"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (rightOpen) setRightOpen(false)
                else {
                  setRightPanel('activity')
                  setRightOpen(true)
                }
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2"
            >
              {rightOpen ? '->' : '<-'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <NoteViewer path={selectedPath} onWikiLinkClick={handleWikiLinkClick} />
          </div>

          {rightOpen && (
            <div className="w-72 border-l border-zinc-800 shrink-0 flex flex-col overflow-hidden">
              <AgentLog />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
