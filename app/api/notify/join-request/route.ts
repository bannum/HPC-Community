import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { teamId, requesterId } = await req.json();

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  const { data: requester } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", requesterId)
    .single();

  const { data: managers } = await supabaseAdmin
    .from("memberships")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("status", "accepted")
    .in("role", ["owner", "admin"]);

  if (!team || !managers) return NextResponse.json({ ok: true });

  for (const m of managers) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
    const email = data?.user?.email;
    if (!email) continue;
    await sendEmail({
      to: email,
      subject: `New join request for ${team.name}`,
      html: `<p><strong>${requester?.full_name ?? "Someone"}</strong> has requested to join <strong>${team.name}</strong>.</p><p>Open the team page to accept or reject the request.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
