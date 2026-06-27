import { Suspense } from 'react'
import MissionControlDashboard from '@/components/mission-control/MissionControlDashboard'

export const metadata = {
  title: 'Mission Control — Pauli Pi Software Factory',
  description: 'Real-time dashboard for the Pauli Pi AI Software Factory',
}

function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'hsl(222,84%,5%)' }}
    >
      {/* Header skeleton */}
      <div
        className="w-full border-b px-6 py-4"
        style={{
          background: 'linear-gradient(135deg, hsl(222,84%,7%) 0%, hsl(222,60%,9%) 100%)',
          borderColor: 'hsl(222,40%,18%)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg animate-pulse"
              style={{ background: 'hsl(222,47%,11%)' }}
            />
            <div className="flex flex-col gap-1.5">
              <div
                className="h-2.5 w-16 rounded animate-pulse"
                style={{ background: 'hsl(222,47%,11%)' }}
              />
              <div
                className="h-4 w-40 rounded animate-pulse"
                style={{ background: 'hsl(222,47%,11%)' }}
              />
            </div>
          </div>
          <div
            className="h-7 w-28 rounded-full animate-pulse"
            style={{ background: 'hsl(222,47%,11%)' }}
          />
        </div>

        <div className="flex items-center gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded animate-pulse"
                style={{ background: 'hsl(222,47%,11%)' }}
              />
              <div className="flex flex-col gap-1">
                <div
                  className="h-2 w-16 rounded animate-pulse"
                  style={{ background: 'hsl(222,47%,11%)' }}
                />
                <div
                  className="h-4 w-8 rounded animate-pulse"
                  style={{ background: 'hsl(222,47%,11%)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-6 py-6">
        {/* Agent cards */}
        <div
          className="h-3 w-24 rounded mb-3 animate-pulse"
          style={{ background: 'hsl(222,47%,11%)' }}
        />
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ background: 'hsl(222,47%,11%)' }}
            />
          ))}
        </div>

        {/* Project cards */}
        <div
          className="h-3 w-28 rounded mb-3 animate-pulse"
          style={{ background: 'hsl(222,47%,11%)' }}
        />
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl animate-pulse"
              style={{ background: 'hsl(222,47%,11%)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MissionControlPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MissionControlDashboard />
    </Suspense>
  )
}
