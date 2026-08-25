"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Request = {
  id: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

export default function PendingRequests({ teamId }: { teamId: string }) {
  const [canManage, setCanManage] = useState(false);
  const [requests, setRequests] = useState<Request[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();

      const isManager = membership?.role === "owner" || membership?.role === "admin";
      if (!isManager || cancelled) return;
      setCanManage(true);

      const { data } = await supabase
        .from("memberships")
        .select("id, user_id, profiles(full_name)")
        .eq("team_id", teamId)
        .eq("status", "requested")
        .order("created_at", { ascending: true });

      if (!cancelled) setRequests((data as unknown as Request[]) ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function respond(id: string, status: "accepted" | "rejected") {
    await supabase.from("memberships").update({ status }).eq("id", id);
    setRequests((prev) => (prev ?? []).filter((r) => r.id !== id));
  }

  if (!canManage || !requests || requests.length === 0) return null;

  return (
    <div className="bg-white border border-scoreboard/40 rounded p-4 space-y-3">
      <h2 className="font-display text-xl">Join requests</h2>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3">
            <span>{r.profiles?.full_name ?? "Unknown"}</span>
            <div className="flex gap-2">
              <button
                onClick={() => respond(r.id, "accepted")}
                className="text-sm bg-scoreboard text-ink font-semibold px-3 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => respond(r.id, "rejected")}
                className="text-sm border border-pitch/30 px-3 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
