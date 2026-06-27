import matter from 'gray-matter'

export interface ParsedNote {
  path: string
  title: string
  frontmatter: Record<string, unknown>
  body: string
  tags: string[]
  wikiLinks: string[]
}

export function parseNote(path: string, raw: string): ParsedNote {
  const { data, content } = matter(raw)
  const title =
    (data.title as string) ??
    content.match(/^#\s+(.+)$/m)?.[1] ??
    path.split('/').pop()?.replace('.md', '') ??
    path

  const tags: string[] = Array.isArray(data.tags)
    ? data.tags.map(String)
    : typeof data.tags === 'string'
    ? [data.tags]
    : []

  const wikiLinks = [...content.matchAll(/\[\[([^\]#|]+)/g)].map((m) =>
    m[1].trim()
  )

  return { path, title, frontmatter: data, body: content, tags, wikiLinks }
}
