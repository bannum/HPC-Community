import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";

export async function POST(req: Request) {
  const { teamId, eventId } = await req.json();

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("title, starts_at, location, created_by")
    .eq("id", eventId)
    .single();

  const { data: members } = await supabaseAdmin
    .from("memberships")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("status", "accepted");

  if (!team || !event || !members) return NextResponse.json({ ok: true });

  const when = new Date(event.starts_at).toLocaleString();

  for (const m of members) {
    if (m.user_id === event.created_by) continue;
    const { data } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
    const email = data?.user?.email;
    if (!email) continue;
    await sendEmail({
      to: email,
      subject: `New event for ${team.name}: ${event.title}`,
      html: `<p><strong>${event.title}</strong> was just posted for <strong>${team.name}</strong>.</p><p>${when} · ${event.location}</p><p><a href="${SITE_URL}/teams/${teamId}/events/${eventId}">Open the event to RSVP</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
