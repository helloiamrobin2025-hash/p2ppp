import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

const getSupabaseEnv = (): SupabaseEnv | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient;
  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }
  browserClient = createBrowserClient(env.url, env.anonKey);
  return browserClient;
};
