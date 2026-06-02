// Vault source abstraction — GitHub API or Tailscale local proxy
// Set VAULT_SOURCE=github (default) or VAULT_SOURCE=tailscale in env

export interface VaultFile {
  path: string
  name: string
  type: 'file' | 'dir'
  sha?: string
  size?: number
  url?: string
}

export interface VaultNote {
  path: string
  content: string
  frontmatter: Record<string, unknown>
  body: string
}

// ── GitHub source ──────────────────────────────────────────────────────────

async function githubFetch(endpoint: string) {
  const token = process.env.VAULT_GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`https://api.github.com${endpoint}`, {
    headers,
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${endpoint}`)
  return res.json()
}

async function listGithubPath(path: string): Promise<VaultFile[]> {
  const owner = process.env.VAULT_GITHUB_OWNER!
  const repo = process.env.VAULT_GITHUB_REPO!
  const branch = process.env.VAULT_GITHUB_BRANCH ?? 'main'
  const ref = path
    ? `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    : `/repos/${owner}/${repo}/contents?ref=${branch}`
  const data = await githubFetch(ref)
  if (!Array.isArray(data)) return []
  return data.map((f: Record<string, unknown>) => ({
    path: f.path as string,
    name: f.name as string,
    type: (f.type as string) === 'dir' ? 'dir' : 'file',
    sha: f.sha as string,
    size: f.size as number,
  }))
}

async function readGithubFile(path: string): Promise<string> {
  const owner = process.env.VAULT_GITHUB_OWNER!
  const repo = process.env.VAULT_GITHUB_REPO!
  const branch = process.env.VAULT_GITHUB_BRANCH ?? 'main'
  const data = await githubFetch(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  )
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return data.content as string
}

// ── Tailscale proxy source ─────────────────────────────────────────────────

async function tailscaleFetch(endpoint: string) {
  const host = process.env.TAILSCALE_PROXY_HOST ?? 'localhost:3001'
  const secret = process.env.TAILSCALE_PROXY_SECRET ?? ''
  const res = await fetch(`http://${host}${endpoint}`, {
    headers: { 'x-proxy-secret': secret },
    next: { revalidate: 10 },
  })
  if (!res.ok) throw new Error(`Tailscale proxy ${res.status}: ${endpoint}`)
  return res.json()
}

async function listTailscalePath(path: string): Promise<VaultFile[]> {
  const data = await tailscaleFetch(`/api/list?path=${encodeURIComponent(path)}`)
  return data.files as VaultFile[]
}

async function readTailscaleFile(path: string): Promise<string> {
  const data = await tailscaleFetch(`/api/read?path=${encodeURIComponent(path)}`)
  return data.content as string
}

// ── Public API ─────────────────────────────────────────────────────────────

function source(): 'github' | 'tailscale' {
  return (process.env.VAULT_SOURCE ?? 'github') as 'github' | 'tailscale'
}

export async function listVaultPath(path = ''): Promise<VaultFile[]> {
  try {
    if (source() === 'tailscale') return listTailscalePath(path)
    return listGithubPath(path)
  } catch {
    return []
  }
}

export async function readVaultFile(path: string): Promise<string> {
  if (source() === 'tailscale') return readTailscaleFile(path)
  return readGithubFile(path)
}

export async function walkVaultMd(
  path = '',
  maxDepth = 5,
  depth = 0
): Promise<VaultFile[]> {
  if (depth > maxDepth) return []
  const entries = await listVaultPath(path)
  const results: VaultFile[] = []
  for (const e of entries) {
    if (e.type === 'dir' && !e.name.startsWith('.')) {
      const sub = await walkVaultMd(e.path, maxDepth, depth + 1)
      results.push(...sub)
    } else if (e.name.endsWith('.md')) {
      results.push(e)
    }
  }
  return results
}
