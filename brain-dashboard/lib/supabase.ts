import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      vault_index: {
        Row: {
          id: string
          path: string
          title: string
          body: string
          tags: string[]
          frontmatter: Record<string, unknown>
          indexed_at: string
        }
        Insert: Omit<Database['public']['Tables']['vault_index']['Row'], 'id' | 'indexed_at'>
        Update: Partial<Database['public']['Tables']['vault_index']['Insert']>
      }
      agent_log: {
        Row: {
          id: string
          agent: string
          action: string
          note_path: string | null
          detail: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agent_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agent_log']['Insert']>
      }
    }
  }
}

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    // @ts-expect-error supabase generic type inference narrows insert to never[] without generated types
    await sb.from('agent_log').insert({ agent, action, note_path: notePath ?? null, detail: detail ?? null })
  } catch {
    // non-blocking
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
