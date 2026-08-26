"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isProfileComplete } from "@/lib/supabase/ensureProfile";
import { ensureAcceptedMembership } from "@/lib/supabase/autoJoin";

type Status = "going" | "maybe" | "not_going";

export default function RsvpButtons({
  eventId,
  teamId,
  initialStatus,
}: {
  eventId: string;
  teamId: string;
  initialStatus: Status | null;
}) {
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function setRsvp(newStatus: Status) {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/sign-in";
      return;
    }
    if (!(await isProfileComplete(user.id))) {
      window.location.href = `/profile?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    await supabase
      .from("rsvps")
      .upsert(
        { event_id: eventId, user_id: user.id, status: newStatus },
        { onConflict: "event_id,user_id" }
      );
    await ensureAcceptedMembership(teamId, user.id);
    fetch("/api/notify/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, userId: user.id, status: newStatus }),
    }).catch(() => {});
    setStatus(newStatus);
    setSaving(false);
  }

  const options: { key: Status; label: string }[] = [
    { key: "going", label: "Going" },
    { key: "maybe", label: "Maybe" },
    { key: "not_going", label: "Not going" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setRsvp(o.key)}
          disabled={saving}
          className={`text-sm px-3 py-1 rounded border ${
            status === o.key
              ? "bg-pitch text-stumps border-pitch"
              : "border-pitch/30 text-ink hover:border-pitch"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
