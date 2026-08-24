"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        // Create a profile row on first login if one doesn't exist yet.
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
      router.push("/");
    }
    handle();
  }, [router]);

  return <p>Signing you in…</p>;
}
