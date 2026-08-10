import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Botanic Creations public browser configuration. The publishable key is intentionally
// browser-safe; authorization is enforced by Supabase Auth + Pauli RLS policies.
// Environment variables remain the first choice so deployments can override/rotate cleanly.
const DEFAULT_PAULI_SUPABASE_URL = 'https://cyxdevcjycmffhmwxojh.supabase.co'
const DEFAULT_PAULI_PUBLISHABLE_KEY = 'sb_publishable_PoqI-3PsCqewtJWJ0Z73Ag_5hIE0oKI'

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_PAULI_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    DEFAULT_PAULI_PUBLISHABLE_KEY

  return { url, key }
}

let browserClient: SupabaseClient | null = null

export function getPauliBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const { url, key } = getConfig()
    browserClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}

export function createPauliUserScopedSupabase(accessToken: string): SupabaseClient {
  const { url, key } = getConfig()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
