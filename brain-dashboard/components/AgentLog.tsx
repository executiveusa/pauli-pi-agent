'use client'

import { useEffect, useState } from 'react'
import { Bot, RefreshCw } from 'lucide-react'

interface LogEntry {
  id: string
  agent: string
  action: string
  note_path: string | null
  detail: string | null
  created_at: string
}

const AGENT_COLORS: Record<string, string> = {
  architect: 'text-amber-400',
  scribe: 'text-emerald-400',
  sorter: 'text-blue-400',
  seeker: 'text-purple-400',
  connector: 'text-pink-400',
  librarian: 'text-cyan-400',
  transcriber: 'text-orange-400',
  postman: 'text-yellow-400',
  'food-coach': 'text-lime-400',
  'wellness-guide': 'text-teal-400',
  'emerald-tablets': 'text-indigo-400',
}

export default function AgentLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent-log')
      const { logs: l } = await res.json()
      setLogs(l)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-zinc-300">Agent Activity</span>
        </div>
        <button
          onClick={load}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            No agent activity yet
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase ${AGENT_COLORS[log.agent] ?? 'text-zinc-400'}`}>
                {log.agent}
              </span>
              <span className="text-xs text-zinc-500">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-zinc-300">{log.action}</p>
            {log.note_path && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{log.note_path}</p>
            )}
            {log.detail && (
              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{log.detail}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
