import { supabase } from "./client";

export async function ensureProfile(user: { id: string }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({ id: user.id });
    if (!error) {
      // First-ever sign-in: let the owner know a real user arrived.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        fetch("/api/notify/new-user", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
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
