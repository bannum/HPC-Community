"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Status = "going" | "maybe" | "not_going";

export default function RsvpSummary({
  eventId,
  going,
  maybe,
  notGoing,
}: {
  eventId: string;
  going: number;
  maybe: number;
  notGoing: number;
}) {
  const [expanded, setExpanded] = useState<Status | null>(null);
  const [names, setNames] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle(status: Status) {
    if (expanded === status) {
      setExpanded(null);
      return;
    }
    setExpanded(status);
    setNames(null);
    setLoading(true);

    const { data: rows } = await supabase
      .from("rsvps")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("status", status);

    const userIds = (rows ?? []).map((r) => r.user_id);
    if (userIds.length === 0) {
      setNames([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, full_name")
      .in("id", userIds);

    setNames((profiles ?? []).map((p) => p.full_name ?? "Someone"));
    setLoading(false);
  }

  const labels: Record<Status, string> = {
    going: "Going",
    maybe: "Maybe",
    not_going: "Not going",
  };

  return (
    <div>
      <div className="flex gap-4 scoreboard-digit text-xl">
        <button onClick={() => toggle("going")} title="Going">
          {going}✓
        </button>
        <button onClick={() => toggle("maybe")} className="text-scoreboard" title="Maybe">
          {maybe}?
        </button>
        <button onClick={() => toggle("not_going")} className="text-ink/40" title="Not going">
          {notGoing}✕
        </button>
      </div>
      {expanded && (
        <p className="mt-2 text-sm text-ink/70">
          <span className="font-medium">{labels[expanded]}: </span>
          {loading
            ? "Loading…"
            : names && names.length > 0
              ? names.join(", ")
              : "No one yet."}
        </p>
      )}
    </div>
  );
}
