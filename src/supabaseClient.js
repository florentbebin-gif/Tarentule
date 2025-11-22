import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.sessionStorage,
    detectSessionInUrl: false,
    autoRefreshToken: true,
  },
})

export async function waitInitialSession() {

  await supabase.auth.getSession()
}
