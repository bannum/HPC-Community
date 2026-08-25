"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/ensureProfile";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        await ensureProfile(user);
      }
      router.push("/");
    }
    handle();
  }, [router]);

  return <p>Signing you in…</p>;
}
