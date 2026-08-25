import { supabase } from "./client";

export async function ensureProfile(user: { id: string }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({ id: user.id });
  }
}

export async function isProfileComplete(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.full_name && data?.phone);
}
