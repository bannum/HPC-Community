"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function EventOwnerActions({
  eventId,
  teamId,
  createdBy,
}: {
  eventId: string;
  teamId: string;
  createdBy: string;
}) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      if (user.id === createdBy) {
        if (!cancelled) setCanEdit(true);
        return;
      }
      const { data } = await supabase
        .from("memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();
      if (!cancelled && (data?.role === "owner" || data?.role === "admin")) setCanEdit(true);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [teamId, createdBy]);

  if (!canEdit) return null;

  return (
    <Link
      href={`/teams/${teamId}/events/${eventId}/edit`}
      className="border border-pitch/30 text-ink font-semibold px-4 py-2 rounded text-sm"
    >
      Edit
    </Link>
  );
}
