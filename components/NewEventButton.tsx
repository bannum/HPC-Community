"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function NewEventButton({ teamId }: { teamId: string }) {
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("memberships")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();
      if (!cancelled && data) setCanCreate(true);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (!canCreate) return null;

  return (
    <Link
      href={`/teams/${teamId}/events/new`}
      className="text-sm bg-scoreboard text-ink font-semibold px-4 py-2 rounded"
    >
      New event
    </Link>
  );
}
