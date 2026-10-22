import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const OWNER_EMAIL = "bannum4@gmail.com";

export async function GET(req: Request) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Fail closed if
  // the secret isn't configured, so the public URL can't be used to trigger
  // emails.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const countSince = async (table: string, column: string) => {
    const { count } = await supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte(column, since);
    return count ?? 0;
  };

  const [
    { count: totalUsers },
    newUsers,
    newRequirements,
    { count: importedRequirements },
    newEvents,
    rsvps,
    responses,
    joinRequests,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    countSince("profiles", "created_at"),
    countSince("requirements", "created_at"),
    supabaseAdmin
      .from("requirements")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .ilike("details", "%(via WhatsApp)"),
    countSince("events", "created_at"),
    countSince("rsvps", "updated_at"),
    countSince("requirement_responses", "created_at"),
    countSince("memberships", "created_at"),
  ]);

  // last_sign_in_at only moves when someone actually signs in, so people who
  // stay logged in between visits won't show up here -- the activity counts
  // below are the better signal of real usage.
  const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const signedIn = (usersPage?.users ?? []).filter(
    (u) => u.last_sign_in_at && u.last_sign_in_at >= since
  ).length;

  const userPosted = newRequirements - (importedRequirements ?? 0);
  const activity = userPosted + newEvents + rsvps + responses + joinRequests;

  const row = (label: string, value: number | string) =>
    `<tr><td style="padding:4px 16px 4px 0">${label}</td><td><strong>${value}</strong></td></tr>`;

  await sendEmail({
    to: OWNER_EMAIL,
    subject: `Cricket Connect daily: ${newUsers} new, ${signedIn} signed in, ${activity} actions`,
    html: `
      <h3>Last 24 hours</h3>
      <table>
        ${row("Total users", totalUsers ?? 0)}
        ${row("New signups", newUsers)}
        ${row("Users who signed in", signedIn)}
      </table>
      <h3>Activity by users</h3>
      <table>
        ${row("Requirements posted", userPosted)}
        ${row("Events created", newEvents)}
        ${row("RSVPs (new or changed)", rsvps)}
        ${row("&ldquo;I'm interested&rdquo; responses", responses)}
        ${row("Team join requests / auto-joins", joinRequests)}
      </table>
      <p style="color:#666">Also imported from WhatsApp: ${importedRequirements ?? 0} requirements (not counted above).</p>
      <p style="color:#666">Visitors and page views: Vercel project &rarr; Analytics.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
