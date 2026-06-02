'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, Tag } from 'lucide-react'

interface ParsedNote {
  path: string
  title: string
  frontmatter: Record<string, unknown>
  body: string
  tags: string[]
  wikiLinks: string[]
}

interface Props {
  path: string | null
  onWikiLinkClick?: (name: string) => void
}

export default function NoteViewer({ path, onWikiLinkClick }: Props) {
  const [note, setNote] = useState<ParsedNote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!path) { setNote(null); return }
    setLoading(true)
    setError(null)
    fetch(`/api/note?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setNote(null) }
        else setNote(data)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [path])

  if (!path) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 select-none">
        <p className="text-sm">Select a note to read it</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 text-sm">
        Error: {error}
      </div>
    )
  }

  if (!note) return null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">{note.title}</h1>

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {note.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 text-xs"
              >
                <Tag className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ href, children }) {
                // Handle wiki-links rendered as [[Name]]
                const wikiMatch = String(children).match(/^\[\[(.+?)]]$/)
                const target = wikiMatch?.[1] ?? href ?? ''
                return (
                  <button
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    onClick={() => onWikiLinkClick?.(target)}
                  >
                    {wikiMatch ? wikiMatch[1] : String(children)}
                  </button>
                )
              },
            }}
          >
            {/* Replace [[WikiLinks]] with clickable markup */}
            {note.body.replace(
              /\[\[([^\]#|]+)(?:#[^\]|]*)?(|[^\]]+)?]]/g,
              (_, name, alias) =>
                `[[${(alias?.slice(1) ?? name).trim()}]]`
            )}
          </ReactMarkdown>
        </div>

        {note.wikiLinks.length > 0 && (
          <div className="mt-8 border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              Links in this note
            </p>
            <div className="flex flex-wrap gap-2">
              {[...new Set(note.wikiLinks)].map((l) => (
                <button
                  key={l}
                  onClick={() => onWikiLinkClick?.(l)}
                  className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
