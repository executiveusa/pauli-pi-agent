'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { pauliAuthorizedFetch } from '@/lib/pauli-api'
import type { PauliApproval } from './MissionControlAuthGate'

const DECIDER_ROLES = new Set(['owner', 'admin', 'reviewer'])
const HIGH_RISK = new Set(['DANGEROUS', 'CRITICAL'])

export default function ApprovalDecisionControls({
  approval,
  role,
  refresh,
}: {
  approval: PauliApproval
  role: string
  refresh: () => Promise<void>
}) {
  const [busyDecision, setBusyDecision] = useState<'approved' | 'denied' | null>(null)
  const [error, setError] = useState('')

  if (approval.status.toLowerCase() !== 'pending') return null
  if (!DECIDER_ROLES.has(role.toLowerCase())) {
    return (
      <p className="mt-3 text-[10px] text-slate-600">
        Your role can inspect this approval but cannot decide it.
      </p>
    )
  }

  async function decide(decision: 'approved' | 'denied') {
    if (decision === 'approved' && HIGH_RISK.has(approval.risk_class.toUpperCase())) {
      const confirmed = window.confirm(
        `Approve ${approval.action_class}? This is classified ${approval.risk_class}. The decision can authorize consequential downstream work.`
      )
      if (!confirmed) return
    }

    const rationale = window.prompt(
      `${decision === 'approved' ? 'Approval' : 'Denial'} rationale (optional):`,
      approval.rationale ?? ''
    )
    if (rationale === null) return

    setBusyDecision(decision)
    setError('')

    try {
      const response = await pauliAuthorizedFetch('/api/pauli/approvals/decide', {
        method: 'POST',
        body: JSON.stringify({
          approvalId: approval.id,
          decision,
          rationale,
        }),
      })
      const body = (await response.json()) as {
        error?: string
        detail?: string
        currentStatus?: string
      }

      if (!response.ok) {
        throw new Error(
          [body.error, body.detail, body.currentStatus ? `Current status: ${body.currentStatus}` : null]
            .filter(Boolean)
            .join(' — ') || 'Approval decision failed.'
        )
      }

      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyDecision(null)
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void decide('denied')}
          disabled={busyDecision !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/70 bg-red-950/20 px-3 py-1.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          {busyDecision === 'denied' ? 'Denying…' : 'Deny'}
        </button>
        <button
          type="button"
          onClick={() => void decide('approved')}
          disabled={busyDecision !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-950/50 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {busyDecision === 'approved' ? 'Approving…' : 'Approve'}
        </button>
      </div>
      {error ? <p className="mt-2 text-[10px] leading-4 text-red-400">{error}</p> : null}
    </div>
  )
}
