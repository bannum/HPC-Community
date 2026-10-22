import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const OWNER_EMAIL = "bannum4@gmail.com";

export async function POST(req: Request) {
  // Identify the caller from their own session token rather than trusting a
  // user id in the body, so this can't be used to spam fake signup emails.
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: true });

  const { data } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (!user) return NextResponse.json({ ok: true });

  // Only announce genuinely new profiles.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || Date.now() - new Date(profile.created_at).getTime() > 5 * 60 * 1000) {
    return NextResponse.json({ ok: true });
  }

  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  await sendEmail({
    to: OWNER_EMAIL,
    subject: `New Cricket Connect user (#${count ?? "?"})`,
    html: `<p><strong>${user.email ?? "A new user"}</strong> just signed up.</p><p>Total users: <strong>${count ?? "?"}</strong></p>`,
  });

  return NextResponse.json({ ok: true });
}
