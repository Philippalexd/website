import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://odpbvvjuvwdjwhkjpykm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_5OHJxuFD8QHQsK9YeWSMjQ_ruq7Lhrk";

export const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
