import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Action Center — Pauli',
  description: 'Legacy Action Center redirects to the canonical authenticated Mission Control.',
}

export default function ActionCenterPage() {
  redirect('/mission-control')
}
