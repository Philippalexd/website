import type { Session } from "@supabase/supabase-js";
import { sb } from "./supabaseClient";

export async function getSession(): Promise<Session | null> {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session;
}
