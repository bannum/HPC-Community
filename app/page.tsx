import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export const revalidate = 0;

export default async function HomePage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, kind, city, area, description")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: openRequirements } = await supabase
    .from("requirements")
    .select("id, requirement_type, custom_type_label, city, area, ground_name, details, needed_on")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title, event_type, starts_at, location, team_id, teams(name)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6);

  return (
    <div className="space-y-12">
      <section className="bg-pitch text-stumps rounded-lg p-8">
        <h1 className="font-display text-4xl mb-2">Find your next game.</h1>
        <p className="max-w-xl text-stumps/90">
          Ground needs, opponent requests, player slots — searchable and always
          up to date. Not buried three hundred messages back in a group chat.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/teams/new"
            className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded"
          >
            Start a team
          </Link>
          <Link
            href="/requirements"
            className="border border-stumps px-5 py-2 rounded"
          >
            Browse the board
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Open right now</h2>
        {openRequirements && openRequirements.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {openRequirements.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requirements/${r.id}`}
                  className="block bg-white rounded border border-pitch/20 p-4 hover:border-scoreboard transition-colors"
                >
                  <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                    {r.requirement_type === "other" && r.custom_type_label
                      ? r.custom_type_label
                      : r.requirement_type.replace("_", " ")}
                  </span>
                  <p className="mt-1">{r.details}</p>
                  <p className="text-sm text-ink/60 mt-1">
                    {r.ground_name ? `${r.ground_name}, ` : ""}
                    {r.area ? `${r.area}, ` : ""}
                    {r.city}
                    {r.needed_on ? ` · ${new Date(r.needed_on).toLocaleString()}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/60">
            Nothing posted yet — be the first.{" "}
            <Link href="/requirements/new" className="underline">
              Post a requirement
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Upcoming events</h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {upcomingEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/teams/${e.team_id}/events/${e.id}`}
                  className="block bg-white rounded border border-pitch/20 p-4 hover:border-scoreboard transition-colors"
                >
                  <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                    {e.event_type.replace("_", " ")}
                  </span>
                  <p className="font-semibold mt-1">{e.title}</p>
                  <p className="text-sm text-ink/60 mt-1">
                    {(e.teams as unknown as { name: string } | null)?.name}
                    {" · "}
                    {new Date(e.starts_at).toLocaleString()} · {e.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/60">No upcoming events yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Teams</h2>
        {teams && teams.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/teams/${t.id}`}
                  className="block bg-white rounded border border-pitch/20 p-4 hover:border-scoreboard transition-colors"
                >
                  <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                    {t.kind}
                  </span>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-ink/60">
                    {t.area ? `${t.area}, ` : ""}
                    {t.city}
                  </p>
                  {t.description && (
                    <p className="text-sm mt-1 text-ink/80">{t.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/60">No public teams yet.</p>
        )}
      </section>
    </div>
  );
}
