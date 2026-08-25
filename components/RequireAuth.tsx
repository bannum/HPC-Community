"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isProfileComplete } from "@/lib/supabase/ensureProfile";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/sign-in");
        return;
      }
      const complete = await isProfileComplete(data.user.id);
      if (!complete) {
        router.replace(`/profile?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setReady(true);
    });
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
