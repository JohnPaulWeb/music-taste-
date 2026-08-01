import { createClient } from '@supabase/supabase-js'

// Supabase expects the project root, for example https://project-id.supabase.co.
// Strip the REST/Auth path when it was copied from an API endpoint by mistake.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/(?:rest|auth)\/v1\/?$/, '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createClient> | undefined

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key to .env.local.')
  }

  client ??= createClient(supabaseUrl, supabaseAnonKey)
  return client
}
