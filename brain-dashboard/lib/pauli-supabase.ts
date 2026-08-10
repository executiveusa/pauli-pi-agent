import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }

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
