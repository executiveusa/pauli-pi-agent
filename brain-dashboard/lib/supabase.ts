import { createClient } from '@supabase/supabase-js'

type VaultIndexRow = {
  id: string
  path: string
  title: string
  body: string
  tags: string[]
  frontmatter: Record<string, unknown>
  indexed_at: string
}

type VaultIndexInsert = {
  id?: string
  path: string
  title: string
  body?: string
  tags?: string[]
  frontmatter?: Record<string, unknown>
  indexed_at?: string
}

type AgentLogRow = {
  id: string
  agent: string
  action: string
  note_path: string | null
  detail: string | null
  created_at: string
}

type AgentLogInsert = {
  id?: string
  agent: string
  action: string
  note_path?: string | null
  detail?: string | null
  created_at?: string
}

export type Database = {
  public: {
    Tables: {
      vault_index: {
        Row: VaultIndexRow
        Insert: VaultIndexInsert
        Update: Partial<VaultIndexInsert>
        Relationships: []
      }
      agent_log: {
        Row: AgentLogRow
        Insert: AgentLogInsert
        Update: Partial<AgentLogInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient<Database>(url, key)
  }
  return _client
}

export async function logAgentAction(
  agent: string,
  action: string,
  notePath?: string,
  detail?: string
) {
  try {
    const sb = getSupabase()
    await sb.from('agent_log').insert({
      agent,
      action,
      note_path: notePath ?? null,
      detail: detail ?? null,
    })
  } catch {
    // Historical dashboard logging is non-blocking. Canonical Mission Control
    // evidence/audit writes use the Pauli schema through authenticated routes.
  }
}

export async function searchVaultIndex(query: string, limit = 20) {
  const sb = getSupabase()
  const { data } = await sb
    .from('vault_index')
    .select('path, title, body, tags')
    .textSearch('body', query, { type: 'websearch', config: 'english' })
    .limit(limit)
  return data ?? []
}

export async function upsertVaultNote(
  path: string,
  title: string,
  body: string,
  tags: string[],
  frontmatter: Record<string, unknown>
) {
  const sb = getSupabase()
  await sb
    .from('vault_index')
    .upsert({ path, title, body, tags, frontmatter }, { onConflict: 'path' })
}
