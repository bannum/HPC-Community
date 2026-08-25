import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { teamId, requesterId, decision } = await req.json();

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  const { data } = await supabaseAdmin.auth.admin.getUserById(requesterId);
  const email = data?.user?.email;
  if (!team || !email) return NextResponse.json({ ok: true });

  const accepted = decision === "accepted";
  await sendEmail({
    to: email,
    subject: accepted
      ? `You're in — ${team.name}`
      : `Update on your request to join ${team.name}`,
    html: accepted
      ? `<p>Your request to join <strong>${team.name}</strong> was accepted. Open the app to see upcoming events.</p>`
      : `<p>Your request to join <strong>${team.name}</strong> wasn't accepted this time.</p>`,
  });

  return NextResponse.json({ ok: true });
}
