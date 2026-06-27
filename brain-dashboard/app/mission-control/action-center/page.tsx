'use client'

import { useState } from 'react'
import { ChevronLeft, Clock, Terminal } from 'lucide-react'
import Link from 'next/link'
import ActionCenter from '@/components/action-center/ActionCenter'
import { DEFAULT_COMMANDS } from '@/lib/commandRegistry'

interface ExecutionRecord {
  id: string
  commandId: string
  commandTitle: string
  startedAt: string
  completedAt?: string
  status: 'running' | 'success' | 'error'
  error?: string
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ActionCenterPage() {
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([])
  const [activeCommandId, setActiveCommandId] = useState<string | undefined>()

  async function handleExecute(commandId: string): Promise<void> {
    const command = DEFAULT_COMMANDS.find((c) => c.id === commandId)
    if (!command) return

    const execId = `exec-${Date.now()}`
    const startedAt = new Date().toISOString()

    const record: ExecutionRecord = {
      id: execId,
      commandId,
      commandTitle: command.title,
      startedAt,
      status: 'running',
    }

    setExecutionHistory((prev) => [record, ...prev].slice(0, 50))
    setActiveCommandId(commandId)

    // Simulate async command execution (replace with real API calls)
    await new Promise<void>((resolve, reject) => {
      const duration = 1500 + Math.random() * 2000
      setTimeout(() => {
        // Simulate occasional errors for demo
        if (Math.random() < 0.1) {
          reject(new Error('Agent unavailable'))
        } else {
          resolve()
        }
      }, duration)
    })
      .then(() => {
        setExecutionHistory((prev) =>
          prev.map((r) =>
            r.id === execId
              ? { ...r, status: 'success' as const, completedAt: new Date().toISOString() }
              : r
          )
        )
      })
      .catch((err: Error) => {
        setExecutionHistory((prev) =>
          prev.map((r) =>
            r.id === execId
              ? {
                  ...r,
                  status: 'error' as const,
                  completedAt: new Date().toISOString(),
                  error: err.message,
                }
              : r
          )
        )
        throw err
      })
      .finally(() => {
        setActiveCommandId(undefined)
      })
  }

  const runningCount = executionHistory.filter((e) => e.status === 'running').length

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'hsl(222,84%,5%)', color: 'hsl(210,40%,98%)' }}
    >
      {/* Top nav */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'hsl(222,40%,18%)', background: 'hsl(222,47%,11%)' }}
      >
        <Link
          href="/mission-control"
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-[hsl(217,91%,60%)]"
          style={{ color: 'hsl(215,16%,47%)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Mission Control
        </Link>
        <span style={{ color: 'hsl(222,40%,18%)' }}>/</span>
        <span className="text-xs font-semibold" style={{ color: 'hsl(210,40%,98%)' }}>
          Action Center
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Action center — main area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ActionCenter
            commands={DEFAULT_COMMANDS}
            onExecute={handleExecute}
            activeCommandId={activeCommandId}
            userPermission="admin"
          />
        </div>

        {/* Execution history sidebar */}
        <div
          className="w-72 border-l flex flex-col shrink-0"
          style={{
            borderColor: 'hsl(222,40%,18%)',
            background: 'hsl(222,47%,11%)',
          }}
        >
          {/* Sidebar header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'hsl(222,40%,18%)' }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" style={{ color: 'hsl(217,91%,60%)' }} />
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'hsl(210,40%,98%)' }}
              >
                Execution Log
              </h3>
            </div>
            {runningCount > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                style={{
                  background: 'hsl(217,91%,10%)',
                  border: '1px solid hsl(217,91%,60%)',
                  color: 'hsl(217,91%,70%)',
                }}
              >
                {runningCount} running
              </span>
            )}
          </div>

          {/* Execution list */}
          <div className="flex-1 overflow-y-auto">
            {executionHistory.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-2 text-sm"
                style={{ color: 'hsl(215,16%,47%)' }}
              >
                <Terminal className="w-6 h-6 opacity-30" />
                <p className="text-xs">No commands executed yet</p>
              </div>
            ) : (
              executionHistory.map((exec) => (
                <div
                  key={exec.id}
                  className="px-4 py-2.5 border-b"
                  style={{ borderColor: 'hsl(222,40%,18%)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: 'hsl(210,40%,98%)' }}
                    >
                      {exec.commandTitle}
                    </p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background:
                          exec.status === 'running'
                            ? 'hsl(217,91%,10%)'
                            : exec.status === 'success'
                            ? 'hsl(142,76%,10%)'
                            : 'hsl(0,72%,10%)',
                        color:
                          exec.status === 'running'
                            ? 'hsl(217,91%,70%)'
                            : exec.status === 'success'
                            ? 'hsl(142,76%,60%)'
                            : 'hsl(0,72%,70%)',
                      }}
                    >
                      {exec.status === 'running' ? '●' : exec.status === 'success' ? '✓' : '✗'}{' '}
                      {exec.status}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1"
                    style={{ color: 'hsl(215,16%,47%)' }}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[10px]">{formatTime(exec.startedAt)}</span>
                    {exec.completedAt && (
                      <>
                        <span>→</span>
                        <span className="text-[10px]">{formatTime(exec.completedAt)}</span>
                      </>
                    )}
                  </div>

                  {exec.error && (
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: 'hsl(0,72%,70%)' }}
                    >
                      {exec.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Clear button */}
          {executionHistory.length > 0 && (
            <div
              className="px-4 py-2 border-t shrink-0"
              style={{ borderColor: 'hsl(222,40%,18%)' }}
            >
              <button
                onClick={() => setExecutionHistory([])}
                className="w-full text-xs py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'hsl(222,84%,5%)',
                  border: '1px solid hsl(222,40%,18%)',
                  color: 'hsl(215,16%,47%)',
                }}
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
