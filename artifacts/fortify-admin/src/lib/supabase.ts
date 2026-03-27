import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/runtime-env';

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
      'Local: copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
      'Production: set those on the host; they are written at container start to config-env.js.\n'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});
