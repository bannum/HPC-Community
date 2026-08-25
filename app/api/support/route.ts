import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { message, userId } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  let fromLine = "Anonymous (not signed in)";
  if (userId) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();
    fromLine = `${profile?.full_name ?? "Unknown"} (${email ?? "no email"}${
      profile?.phone ? `, ${profile.phone}` : ""
    })`;
  }

  await sendEmail({
    to: "bannum4@gmail.com",
    subject: "Cricket Connect support message",
    html: `<p><strong>From:</strong> ${fromLine}</p><p>${message.replace(/\n/g, "<br>")}</p>`,
  });

  return NextResponse.json({ ok: true });
}
