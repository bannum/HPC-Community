import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { requirementId, responderId } = await req.json();

  const { data: requirement } = await supabaseAdmin
    .from("requirements")
    .select("posted_by, details")
    .eq("id", requirementId)
    .single();

  const { data: responder } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", responderId)
    .single();

  if (!requirement) return NextResponse.json({ ok: true });

  const { data } = await supabaseAdmin.auth.admin.getUserById(requirement.posted_by);
  const email = data?.user?.email;
  if (!email) return NextResponse.json({ ok: true });

  await sendEmail({
    to: email,
    subject: `${responder?.full_name ?? "Someone"} is interested in your post`,
    html: `<p><strong>${responder?.full_name ?? "Someone"}</strong> responded "I'm interested" to your post: "${requirement.details}".</p><p>Open the post to see their contact details.</p>`,
  });

  return NextResponse.json({ ok: true });
}
