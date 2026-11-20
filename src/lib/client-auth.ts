"use client";

import { supabase } from "@/lib/supabase";

export async function getAuthenticatedHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Your session expired. Sign in again to continue.");
  return { Authorization: `Bearer ${data.session.access_token}` };
}
