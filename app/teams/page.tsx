import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export const revalidate = 0;

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, city, area, description")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl">Teams</h1>
        <Link
          href="/teams/new"
          className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
        >
          Start a team
        </Link>
      </div>

      {teams && teams.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/teams/${t.id}`}
                className="block bg-white rounded border border-pitch/20 p-4 hover:border-scoreboard transition-colors"
              >
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
        <p className="text-ink/60">
          No public teams yet.{" "}
          <Link href="/teams/new" className="underline">
            Start one
          </Link>
        </p>
      )}
    </div>
  );
}
