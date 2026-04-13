import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getSession(): Promise<Session | null> {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session;
}