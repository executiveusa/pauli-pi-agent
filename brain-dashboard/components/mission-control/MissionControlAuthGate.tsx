'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getPauliBrowserSupabase } from '@/lib/pauli-supabase'

type PauliContext = {
  user: { id: string; email: string | null }
  memberships: Array<{ organization_id: string; role: string; status: string }>
  organizations: Array<{ id: string; slug: string; name: string; preferred_language: string; status: string }>
  agents: unknown[]
  missions: unknown[]
  approvals: unknown[]
  events: unknown[]
  generatedAt: string
}

export default function MissionControlAuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [context, setContext] = useState<PauliContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadContext = useCallback(async (activeSession: Session) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/pauli/context', {
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        cache: 'no-store',
      })

      const body = (await response.json()) as PauliContext & {
        error?: string
        detail?: string
        code?: string
      }

      if (!response.ok) {
        const detail = body.detail ? ` ${body.detail}` : ''
        throw new Error(`${body.error ?? 'Unable to load Mission Control.'}${detail}`)
      }

      setContext(body)
    } catch (err) {
      setContext(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = getPauliBrowserSupabase()
    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const current = data.session ?? null
      setSession(current)
      if (current) {
        void loadContext(current)
      } else {
        setLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setContext(null)
      setError('')

      if (nextSession) {
        void loadContext(nextSession)
      } else {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [loadContext])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    setLoading(true)
    try {
      const supabase = getPauliBrowserSupabase()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/mission-control`,
        },
      })

      if (signInError) throw signInError

      setMessage('Check your email for the Mission Control sign-in link.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setLoading(true)
    const supabase = getPauliBrowserSupabase()
    await supabase.auth.signOut()
    setSession(null)
    setContext(null)
    setLoading(false)
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <section className="w-full max-w-md border border-slate-800 bg-slate-900/70 rounded-2xl p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Pauli</p>
          <h1 className="mt-2 text-2xl font-semibold">Mission Control</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Sign in with an allowlisted email. Access is enforced by the Pauli organization and role policies in Supabase.
          </p>

          <form onSubmit={handleSignIn} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-slate-300" htmlFor="pauli-email">
              Email
            </label>
            <input
              id="pauli-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </section>
      </main>
    )
  }

  if (loading && !context) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading authorized Pauli context…</p>
      </main>
    )
  }

  if (!context) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <section className="w-full max-w-lg border border-red-900/60 bg-slate-900 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Access not ready</p>
          <h1 className="mt-2 text-xl font-semibold">Mission Control could not load your Pauli role.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{error || 'No active Pauli membership is available for this account.'}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void loadContext(session)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    )
  }

  const role = context.memberships[0]?.role ?? 'member'
  const organizationNames = context.organizations.map((organization) => organization.name).join(', ')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400">
        <div className="min-w-0 truncate">
          <span className="text-emerald-400">Connected</span>
          <span className="mx-2">·</span>
          <span>{organizationNames || 'Pauli organization'}</span>
          <span className="mx-2">·</span>
          <span className="uppercase tracking-wide">{role}</span>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="ml-4 shrink-0 rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 hover:border-slate-600"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  )
}
