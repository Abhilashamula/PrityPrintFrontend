import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Both values can be empty during local development.
// The client is created but all calls will return errors until you
// fill in .env with your Supabase project credentials.
export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

