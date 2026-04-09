import { sb } from "./supabaseClient.js";
import { toBaseUrl } from "../config/paths.js";

export async function getSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    location.href = toBaseUrl("index.html");
    return null;
  }
  return session;
}
