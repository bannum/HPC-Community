import { supabase } from "./client";

// Called when a user RSVPs to an event or responds to a requirement tied
// to a team — engagement implies membership, so we don't make them go
// through a separate join request for something they've already acted on.
export async function ensureAcceptedMembership(teamId: string, userId: string) {
  const { data: existing } = await supabase
    .from("memberships")
    .select("id, status, role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("memberships")
      .insert({ team_id: teamId, user_id: userId, status: "accepted", role: "member" });
  } else if (existing.status !== "accepted" && existing.role === "member") {
    await supabase.from("memberships").update({ status: "accepted" }).eq("id", existing.id);
  }
}
