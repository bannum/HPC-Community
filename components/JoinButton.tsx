"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Status = "loading" | "signed_out" | "idle" | "requested" | "accepted" | "error";

export default function JoinButton({ teamId }: { teamId: string }) {
  const [state, setState] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState("signed_out");
        return;
      }
      const { data } = await supabase
        .from("memberships")
        .select("status")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.status === "accepted") setState("accepted");
      else if (data?.status === "requested") setState("requested");
      else setState("idle");
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function handleJoin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/sign-in";
      return;
    }
    const { error } = await supabase
      .from("memberships")
      .insert({ team_id: teamId, user_id: user.id, status: "requested" });
    setState(error ? "error" : "requested");
  }

  if (state === "loading") return null;

  if (state === "accepted") {
    return <p className="text-sm text-pitch font-medium">You're a member</p>;
  }

  if (state === "requested") {
    return <p className="text-sm text-pitch font-medium">Request sent — pending approval</p>;
  }

  return (
    <button
      onClick={handleJoin}
      className="border border-pitch text-pitch font-semibold px-4 py-2 rounded"
    >
      Request to join
    </button>
  );
}
