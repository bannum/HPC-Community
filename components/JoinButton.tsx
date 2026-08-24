"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function JoinButton({ teamId }: { teamId: string }) {
  const [state, setState] = useState<"idle" | "requested" | "error">("idle");

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

  if (state === "requested") {
    return <p className="text-sm text-pitch font-medium">Request sent</p>;
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
