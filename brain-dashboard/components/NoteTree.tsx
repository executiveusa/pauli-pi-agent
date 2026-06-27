'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'

interface VaultFile {
  path: string
  name: string
  type: 'file' | 'dir'
}

interface Props {
  onSelect: (path: string) => void
  selectedPath?: string
}

function Node({
  file,
  onSelect,
  selectedPath,
  depth,
}: {
  file: VaultFile
  onSelect: (path: string) => void
  selectedPath?: string
  depth: number
}) {
  const [open, setOpen] = useState(depth < 1)
  const [children, setChildren] = useState<VaultFile[]>([])
  const [loaded, setLoaded] = useState(false)

  async function toggle() {
    if (file.type !== 'dir') return
    if (!loaded) {
      const res = await fetch(`/api/vault?path=${encodeURIComponent(file.path)}`)
      const { files } = await res.json()
      setChildren(
        [...(files as VaultFile[])].sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
      )
      setLoaded(true)
    }
    setOpen((v) => !v)
  }

  const isSelected = selectedPath === file.path
  const indent = depth * 12

  if (file.type === 'dir') {
    return (
      <div>
        <button
          className="flex items-center gap-1 w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 text-sm"
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={toggle}
        >
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
          )}
          <Folder className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{file.name}</span>
        </button>
        {open && loaded && (
          <div>
            {children.map((c) => (
              <Node
                key={c.path}
                file={c}
                onSelect={onSelect}
                selectedPath={selectedPath}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!file.name.endsWith('.md')) return null

  return (
    <button
      className={`flex items-center gap-1 w-full text-left px-2 py-1 rounded text-sm truncate ${
        isSelected
          ? 'bg-indigo-600 text-white'
          : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
      }`}
      style={{ paddingLeft: `${8 + indent + 16}px` }}
      onClick={() => onSelect(file.path)}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{file.name.replace('.md', '')}</span>
    </button>
  )
}

export default function NoteTree({ onSelect, selectedPath }: Props) {
  const [roots, setRoots] = useState<VaultFile[]>([])

  useEffect(() => {
    fetch('/api/vault')
      .then((r) => r.json())
      .then(({ files }) => {
        setRoots(
          [...(files as VaultFile[])].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
            return a.name.localeCompare(b.name)
          })
        )
      })
  }, [])

  return (
    <div className="h-full overflow-y-auto py-2">
      {roots.map((f) => (
        <Node
          key={f.path}
          file={f}
          onSelect={onSelect}
          selectedPath={selectedPath}
          depth={0}
        />
      ))}
    </div>
  )
}
