"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { waLink, telLink } from "@/lib/phone";

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default function MembersList({ teamId }: { teamId: string }) {
  const [canManage, setCanManage] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setViewerId(user.id);

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
        .select("id, user_id, role, profiles(full_name, phone)")
        .eq("team_id", teamId)
        .eq("status", "accepted")
        .order("role");

      if (!cancelled) setMembers((data as unknown as Member[]) ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (!canManage || !members || members.length === 0) return null;

  return (
    <div className="bg-white border border-pitch/20 rounded p-4 space-y-3">
      <h2 className="font-display text-xl">Members</h2>
      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span>
                {m.profiles?.full_name ?? "Unknown"}
                {m.user_id === viewerId && " (you)"}
              </span>
              <span className="text-xs uppercase tracking-wide text-ink/50 ml-2">
                {m.role}
              </span>
            </div>
            {m.profiles?.phone && m.user_id !== viewerId && (
              <div className="flex gap-2">
                <a
                  href={waLink(m.profiles.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-scoreboard text-ink font-semibold px-3 py-1 rounded"
                >
                  WhatsApp
                </a>
                <a
                  href={telLink(m.profiles.phone)}
                  className="text-sm border border-pitch/30 px-3 py-1 rounded"
                >
                  Call
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
