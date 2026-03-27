export type FortifyAdminRuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

declare global {
  interface Window {
    __FORTIFY_ADMIN_ENV__?: FortifyAdminRuntimeEnv;
  }
}

export function getSupabaseUrl(): string | undefined {
  const w = typeof window !== "undefined" ? window.__FORTIFY_ADMIN_ENV__ : undefined;
  const fromRuntime = w?.VITE_SUPABASE_URL?.trim();
  if (fromRuntime) return fromRuntime;
  return (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const w = typeof window !== "undefined" ? window.__FORTIFY_ADMIN_ENV__ : undefined;
  const fromRuntime = w?.VITE_SUPABASE_ANON_KEY?.trim();
  if (fromRuntime) return fromRuntime;
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || undefined;
}
