"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isProfileComplete } from "@/lib/supabase/ensureProfile";
import { ensureAcceptedMembership } from "@/lib/supabase/autoJoin";
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
  status,
  teamId,
}: {
  requirementId: string;
  postedBy: string;
  contactPhone: string | null;
  status: string;
  teamId: string | null;
}) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [responses, setResponses] = useState<Response[] | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [responding, setResponding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    if (teamId) {
      await ensureAcceptedMembership(teamId, user.id);
    }
    fetch("/api/notify/requirement-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementId, responderId: user.id }),
    }).catch(() => {});
    setAlreadyResponded(true);
    setResponding(false);
  }

  async function toggleStatus() {
    setUpdatingStatus(true);
    await supabase
      .from("requirements")
      .update({ status: status === "fulfilled" ? "open" : "fulfilled" })
      .eq("id", requirementId);
    window.location.reload();
  }

  if (userId === undefined) return null;

  const isPoster = userId === postedBy;

  if (isPoster) {
    return (
      <div className="mt-5 space-y-5">
        <div className="flex gap-3">
          <Link
            href={`/requirements/${requirementId}/edit`}
            className="border border-pitch/30 text-ink font-semibold px-4 py-2 rounded text-sm"
          >
            Edit
          </Link>
          <button
            onClick={toggleStatus}
            disabled={updatingStatus}
            className="border border-pitch text-pitch font-semibold px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {updatingStatus
              ? "Updating…"
              : status === "fulfilled"
                ? "Reopen"
                : "Mark as fulfilled"}
          </button>
        </div>

        {!responses || responses.length === 0 ? (
          <p className="text-sm text-ink/60">No responses yet.</p>
        ) : (
          <div className="space-y-3">
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
        )}
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
        <p className="text-sm text-pitch font-medium">You've let them know you're interested.</p>
      ) : (
        <button
          onClick={respond}
          disabled={responding}
          className="border border-pitch text-pitch font-semibold px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {responding ? "Sending…" : "I'm interested"}
        </button>
      )}
    </div>
  );
}
