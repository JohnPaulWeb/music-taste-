import { createClient } from '@supabase/supabase-js'

// Supabase expects the project root URL, e.g. https://project-id.supabase.co
// Strip any /rest/v1 or /auth/v1 suffix that may have been accidentally copied.
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
const supabaseUrl = rawUrl.replace(/\/(?:rest|auth)\/v1\/?$/, '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

let client: ReturnType<typeof createClient> | undefined

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. ' +
      'Get these values from your Supabase project: Project Settings → API.'
    )
  }

  // Accept legacy anon JWT keys (eyJ...) or new publishable keys (sb_publishable_...).
  const isLegacyAnonKey = supabaseAnonKey.startsWith('eyJ')
  const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_')
  if (!isLegacyAnonKey && !isPublishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY looks incorrect. ' +
      'Use the "Publishable key" (sb_publishable_...) or legacy "anon public" JWT (eyJ...) from ' +
      'Supabase Dashboard → Project Settings → API Keys.'
    )
  }

  client ??= createClient(supabaseUrl, supabaseAnonKey)
  return client
}
