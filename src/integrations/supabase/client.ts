import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createConfiguredClient(): SupabaseClient<Database> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Add them to your .env for local dev or to the hosting dashboard.",
    );
  }
  return createClient<Database>(url, key);
}

let _client: SupabaseClient<Database> | undefined;

/** Singleton Supabase browser client (anon key + RLS). */
export function getSupabase(): SupabaseClient<Database> {
  if (!_client) _client = createConfiguredClient();
  return _client;
}

/** Proxy keeps existing `import { supabase } from ...` usage while lazy‑creating the client. */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
