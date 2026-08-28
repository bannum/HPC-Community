import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";

export async function POST(req: Request) {
  const { eventId, userId, status } = await req.json();

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("title, created_by, team_id")
    .eq("id", eventId)
    .single();

  if (!event || event.created_by === userId) return NextResponse.json({ ok: true });

  const { data: responder } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { data } = await supabaseAdmin.auth.admin.getUserById(event.created_by);
  const email = data?.user?.email;
  if (!email) return NextResponse.json({ ok: true });

  const statusLabel = status === "not_going" ? "not going" : status;

  await sendEmail({
    to: email,
    subject: `${responder?.full_name ?? "Someone"} RSVP'd to ${event.title}`,
    html: `<p><strong>${responder?.full_name ?? "Someone"}</strong> marked themselves as <strong>${statusLabel}</strong> for <strong>${event.title}</strong>.</p><p><a href="${SITE_URL}/teams/${event.team_id}/events/${eventId}">Open the event</a></p>`,
  });

  return NextResponse.json({ ok: true });
}
