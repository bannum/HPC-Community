"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function AuthNav() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (email === undefined) return null;

  if (email) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-stumps/80 truncate max-w-[9rem] sm:max-w-none">{email}</span>
        <button onClick={handleSignOut} className="underline shrink-0">
          Sign out
        </button>
      </div>
    );
  }

  return <Link href="/sign-in">Sign in</Link>;
}
