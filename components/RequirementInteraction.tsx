"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isProfileComplete } from "@/lib/supabase/ensureProfile";
import { waLink, telLink } from "@/lib/phone";

type Response = {
  id: string;
  user_id: string;
  message: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default function RequirementInteraction({
  requirementId,
  postedBy,
  contactPhone,
}: {
  requirementId: string;
  postedBy: string;
  contactPhone: string | null;
}) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [responses, setResponses] = useState<Response[] | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      if (user && user.id === postedBy) {
        const { data } = await supabase
          .from("requirement_responses")
          .select("id, user_id, message, profiles(full_name, phone)")
          .eq("requirement_id", requirementId)
          .order("created_at", { ascending: true });
        if (!cancelled) setResponses((data as unknown as Response[]) ?? []);
      } else if (user) {
        const { data } = await supabase
          .from("requirement_responses")
          .select("id")
          .eq("requirement_id", requirementId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setAlreadyResponded(Boolean(data));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [requirementId, postedBy]);

  async function respond() {
    setResponding(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/sign-in`;
      return;
    }
    if (!(await isProfileComplete(user.id))) {
      window.location.href = `/profile?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    await supabase
      .from("requirement_responses")
      .insert({ requirement_id: requirementId, user_id: user.id });
    setAlreadyResponded(true);
    setResponding(false);
  }

  if (userId === undefined) return null;

  const isPoster = userId === postedBy;

  if (isPoster) {
    if (!responses || responses.length === 0) {
      return <p className="text-sm text-ink/60 mt-5">No responses yet.</p>;
    }
    return (
      <div className="mt-5 space-y-3">
        <h2 className="font-display text-lg">Responses</h2>
        <ul className="space-y-2">
          {responses.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 flex-wrap">
              <span>{r.profiles?.full_name ?? "Unknown"}</span>
              {r.profiles?.phone && (
                <div className="flex gap-2">
                  <a
                    href={waLink(r.profiles.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-scoreboard text-ink font-semibold px-3 py-1 rounded"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={telLink(r.profiles.phone)}
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

  return (
    <div className="mt-5 space-y-3">
      {contactPhone && (
        <div className="flex gap-3">
          <a
            href={waLink(contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
          >
            WhatsApp
          </a>
          <a
            href={telLink(contactPhone)}
            className="border border-pitch text-pitch font-semibold px-4 py-2 rounded text-sm"
          >
            Call
          </a>
        </div>
      )}
      {alreadyResponded ? (
        <p className="text-sm text-pitch font-medium">You've let them know you're available.</p>
      ) : (
        <button
          onClick={respond}
          disabled={responding}
          className="border border-pitch text-pitch font-semibold px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {responding ? "Sending…" : "I'm available"}
        </button>
      )}
    </div>
  );
}
