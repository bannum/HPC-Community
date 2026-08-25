"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { waLink, telLink } from "@/lib/phone";

type Organizer = {
  id: string;
  role: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default function ContactOrganizers({ teamId }: { teamId: string }) {
  const [organizers, setOrganizers] = useState<Organizer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: own } = await supabase
        .from("memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();

      // Only regular members need this — owners/admins already see the full
      // Members panel with everyone's contact info.
      if (!own || own.role === "owner" || own.role === "admin" || cancelled) return;

      const { data } = await supabase
        .from("memberships")
        .select("id, role, profiles(full_name, phone)")
        .eq("team_id", teamId)
        .eq("status", "accepted")
        .in("role", ["owner", "admin"]);

      if (!cancelled) setOrganizers((data as unknown as Organizer[]) ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (!organizers || organizers.length === 0) return null;

  return (
    <div className="bg-white border border-pitch/20 rounded p-4 space-y-3">
      <h2 className="font-display text-xl">Contact organizers</h2>
      <ul className="space-y-3">
        {organizers.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 flex-wrap">
            <span>{o.profiles?.full_name ?? "Unknown"}</span>
            {o.profiles?.phone && (
              <div className="flex gap-2">
                <a
                  href={waLink(o.profiles.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-scoreboard text-ink font-semibold px-3 py-1 rounded"
                >
                  WhatsApp
                </a>
                <a
                  href={telLink(o.profiles.phone)}
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
