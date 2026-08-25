import { supabase } from "./client";

export async function ensureProfile(user: { id: string; email?: string | null }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.email?.split("@")[0] ?? "New player",
    });
  }
}
