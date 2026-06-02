'use client'

import { useState, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  path: string
  title: string
  body: string
  tags: string[]
}

interface Props {
  onSelect: (path: string) => void
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    setQuery(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!v.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(v)}`)
        const { results: r } = await res.json()
        setResults(r ?? [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-700 focus-within:border-indigo-500 transition-colors">
        {loading ? (
          <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
        )}
        <input
          className="bg-transparent flex-1 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}>
            <X className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.path}
              className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 last:border-0"
              onClick={() => {
                onSelect(r.path)
                setOpen(false)
                setQuery('')
              }}
            >
              <p className="text-sm font-medium text-zinc-100">{r.title}</p>
              {r.body && (
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                  {r.body.slice(0, 120)}
                </p>
              )}
              {r.tags?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {r.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs text-indigo-400">#{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && query && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-sm text-zinc-500">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
