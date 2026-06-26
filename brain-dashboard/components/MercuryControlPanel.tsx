'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Bot, Mic, Play, Radio, RotateCw, Send, Settings2, Square } from 'lucide-react'

type RuntimeMode = 'idle' | 'diffusing' | 'ready'
type FallbackMode = 'auto' | 'backend-only' | 'force-local'
type Task = 'mercury-diffusion' | 'mercury-voice' | 'mercury-operator' | 'default'

interface ChatMessage {
  role: 'user' | 'assistant'
  body: string
}

interface SessionState {
  sessionId: string
  messages: ChatMessage[]
  apiBase: string
  tenantId: string
  task: Task
  fallbackMode: FallbackMode
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    body: 'Mercury is online locally. Send a prompt, check health, or upload a voice sample.',
  },
]

function createSession(): SessionState {
  return {
    sessionId: crypto.randomUUID(),
    messages: DEFAULT_MESSAGES,
    apiBase: '',
    tenantId: 'client_demo',
    task: 'mercury-diffusion',
    fallbackMode: 'auto',
  }
}

function localReply(prompt: string, task: Task) {
  if (/production|next step|finish/i.test(prompt)) {
    return [
      'Production shape is now clear: Next app, local API routes, Mercury adapter, voice path, and browser control panel.',
      'The remaining live dependency is secrets: Mercury and OpenAI keys must exist in the deployment environment.',
    ].join('\n')
  }

  if (/what is this|explain/i.test(prompt)) {
    return 'This is the Mercury operator panel inside the Pauli brain dashboard. It controls chat, voice, routing, tenant context, and runtime health from one browser surface.'
  }

  return `Local ${task} fallback: ${prompt}`
}

export default function MercuryControlPanel() {
  const [session, setSession] = useState<SessionState>(() => createSession())
  const [prompt, setPrompt] = useState('')
  const [health, setHealth] = useState('Not checked')
  const [healthTone, setHealthTone] = useState<'good' | 'warn' | 'bad'>('warn')
  const [mode, setMode] = useState<RuntimeMode>('idle')
  const [isSending, setIsSending] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('Ready for upload')
  const [voiceTone, setVoiceTone] = useState<'good' | 'warn' | 'bad'>('warn')
  const fileRef = useRef<HTMLInputElement>(null)

  const apiBase = useMemo(() => {
    if (session.apiBase.trim()) return session.apiBase.replace(/\/$/, '')
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }, [session.apiBase])

  useEffect(() => {
    const raw = localStorage.getItem('mercury-next-session')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<SessionState>
      setSession({
        sessionId: parsed.sessionId ?? crypto.randomUUID(),
        messages: parsed.messages?.length ? parsed.messages : DEFAULT_MESSAGES,
        apiBase: parsed.apiBase ?? '',
        tenantId: parsed.tenantId ?? 'client_demo',
        task: parsed.task ?? 'mercury-diffusion',
        fallbackMode: parsed.fallbackMode ?? 'auto',
      })
    } catch {
      setSession(createSession())
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mercury-next-session', JSON.stringify(session))
  }, [session])

  async function checkHealth() {
    setHealth('Checking backend...')
    setHealthTone('warn')

    try {
      const response = await fetch(`${apiBase}/api/llm/health`, { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || data.status || `HTTP ${response.status}`)
      setHealth(`${data.status ?? 'ready'} | ${data.model ?? 'model unknown'}`)
      setHealthTone('good')
    } catch (error) {
      setHealth(error instanceof Error ? error.message : 'Health check failed')
      setHealthTone('bad')
    }
  }

  async function sendPrompt(seed?: string) {
    const value = (seed ?? prompt).trim()
    if (!value || isSending) return

    const userMessage: ChatMessage = { role: 'user', body: value }
    setSession((current) => ({ ...current, messages: [...current.messages, userMessage] }))
    setPrompt('')
    setMode('diffusing')
    setIsSending(true)

    let reply = ''
    if (session.fallbackMode !== 'force-local') {
      try {
        const response = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: session.tenantId,
            task: session.task,
            messages: [...session.messages, userMessage].map((message) => ({
              role: message.role,
              content: message.body,
            })),
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
        reply = data.reply
      } catch (error) {
        if (session.fallbackMode === 'backend-only') {
          reply = `Backend error: ${error instanceof Error ? error.message : 'request failed'}`
        } else {
          reply = localReply(value, session.task)
        }
      }
    } else {
      reply = localReply(value, session.task)
    }

    setSession((current) => ({
      ...current,
      messages: [...current.messages, { role: 'assistant', body: reply || localReply(value, session.task) }],
    }))
    setMode('ready')
    setIsSending(false)
  }

  async function runVoiceRoute() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setVoiceStatus('Choose an audio file first')
      setVoiceTone('warn')
      return
    }

    if (session.fallbackMode === 'force-local') {
      setVoiceStatus('Local fallback mode is active')
      setVoiceTone('warn')
      return
    }

    setVoiceStatus('Uploading audio...')
    setVoiceTone('warn')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('pageTitle', 'Mercury Control Panel')
    formData.append('contextAnalogy', 'A diffusion chatbot control room with live routing.')

    try {
      const response = await fetch(`${apiBase}/api/voice`, { method: 'POST', body: formData })
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok) {
        const data = contentType.includes('application/json') ? await response.json() : {}
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      await new Audio(url).play().catch(() => undefined)
      setVoiceStatus(`Audio returned for ${file.name}`)
      setVoiceTone('good')
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (error) {
      setVoiceStatus(error instanceof Error ? error.message : 'Voice route failed')
      setVoiceTone('bad')
    }
  }

  function updateSession(patch: Partial<SessionState>) {
    setSession((current) => ({ ...current, ...patch }))
  }

  const statusClass = {
    good: 'border-emerald-400/25 text-emerald-200',
    warn: 'border-amber-300/25 text-amber-100',
    bad: 'border-rose-300/25 text-rose-100',
  }

  return (
    <main className="h-screen overflow-y-auto bg-[#07090d] text-slate-50">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(103,247,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(103,247,200,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative px-5 py-4 border-b border-white/10 bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Mercury chatbot</p>
            <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight">Diffusion control panel</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-200">
            <Radio className="h-4 w-4" />
            {mode}
          </div>
        </div>
      </div>

      <div className="relative grid gap-4 p-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Diffusion lane</p>
              <p className="mt-2 max-w-2xl text-slate-300">
                Chat, voice, routing, fallback, tenant state, and runtime health now live in the deployable Next app.
              </p>
            </div>
            <button
              onClick={checkHealth}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4" />
              Check health
            </button>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-300/20 bg-black/40 p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-200">
              <Activity className="h-4 w-4" />
              {mode === 'diffusing' ? 'Diffusing response' : 'Ready'}
            </div>
            <h2 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
              {mode === 'diffusing' ? 'Shaping the answer into a stable signal.' : 'Boot the lane and settle the signal.'}
            </h2>

            <div className="mt-6 space-y-3">
              {session.messages.slice(-7).map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-lg border p-3 ${
                    message.role === 'user'
                      ? 'border-emerald-300/20 bg-emerald-300/10'
                      : 'border-blue-300/20 bg-blue-300/10'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{message.role}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">{message.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Mercury to explain, route, generate, or operate."
              className="min-h-28 rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-slate-50 outline-none focus:border-emerald-300/40"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => sendPrompt()}
                disabled={isSending}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
              <button
                onClick={() => {
                  setMode('ready')
                  setIsSending(false)
                }}
                disabled={!isSending}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
              {['Explain this build', 'Show production gaps', 'Draft next deployment checklist'].map((seed) => (
                <button
                  key={seed}
                  onClick={() => setPrompt(seed)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                >
                  {seed}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2 text-slate-100">
              <Settings2 className="h-5 w-5 text-emerald-200" />
              <h2 className="font-semibold">Runtime</h2>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                API base
                <input
                  value={session.apiBase}
                  onChange={(event) => updateSession({ apiBase: event.target.value })}
                  placeholder="Current origin"
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                Tenant
                <input
                  value={session.tenantId}
                  onChange={(event) => updateSession({ tenantId: event.target.value })}
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                Task
                <select
                  value={session.task}
                  onChange={(event) => updateSession({ task: event.target.value as Task })}
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none"
                >
                  <option value="mercury-diffusion">Mercury diffusion</option>
                  <option value="mercury-voice">Mercury voice</option>
                  <option value="mercury-operator">Mercury operator</option>
                  <option value="default">Default</option>
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                Fallback
                <select
                  value={session.fallbackMode}
                  onChange={(event) => updateSession({ fallbackMode: event.target.value as FallbackMode })}
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none"
                >
                  <option value="auto">Auto fallback</option>
                  <option value="backend-only">Backend only</option>
                  <option value="force-local">Force local demo</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className={`rounded-lg border p-3 ${statusClass[healthTone]}`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Health</p>
                <p className="mt-2 text-sm">{health}</p>
              </div>
              <div className="rounded-lg border border-emerald-300/20 p-3 text-emerald-100">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Session</p>
                <p className="mt-2 text-sm">{session.sessionId.slice(0, 8)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2 text-slate-100">
              <Mic className="h-5 w-5 text-blue-200" />
              <h2 className="font-semibold">Voice route</h2>
            </div>
            <input ref={fileRef} type="file" accept="audio/*" className="mt-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm" />
            <button
              onClick={runVoiceRoute}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-blue-300/25 bg-blue-300/15 px-4 py-2 text-sm text-blue-100"
            >
              <Play className="h-4 w-4" />
              Run voice route
            </button>
            <div className={`mt-4 rounded-lg border p-3 ${statusClass[voiceTone]}`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Voice</p>
              <p className="mt-2 text-sm">{voiceStatus}</p>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2 text-slate-100">
              <Bot className="h-5 w-5 text-emerald-200" />
              <h2 className="font-semibold">Runtime contract</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              {['INCEPTION_API_KEY', 'MERCURY_BASE_URL', 'MERCURY_MODEL', 'OPENAI_API_KEY'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
