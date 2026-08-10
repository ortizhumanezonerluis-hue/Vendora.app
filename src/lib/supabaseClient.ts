import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in environment variables. Real-time DB calls might fail.')
}

// Fallback to empty placeholders if environment variables are not supplied, avoiding hard crashes
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co'
const resolvedKey = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(resolvedUrl, resolvedKey)
