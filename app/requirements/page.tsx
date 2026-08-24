import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export const revalidate = 0;

export default async function RequirementsPage() {
  const { data: requirements } = await supabase
    .from("requirements")
    .select("id, requirement_type, city, area, details, needed_on, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl">The board</h1>
        <Link
          href="/requirements/new"
          className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
        >
          Post a requirement
        </Link>
      </div>

      {requirements && requirements.length > 0 ? (
        <ul className="space-y-3">
          {requirements.map((r) => (
            <li
              key={r.id}
              className={`bg-white border rounded p-4 ${
                r.status === "fulfilled"
                  ? "border-ink/10 opacity-60"
                  : "border-pitch/20"
              }`}
            >
              <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                {r.requirement_type.replace("_", " ")}
              </span>
              {r.status === "fulfilled" && (
                <span className="text-xs ml-2 text-ink/50">· fulfilled</span>
              )}
              <p className="mt-1">{r.details}</p>
              <p className="text-sm text-ink/60 mt-1">
                {r.area ? `${r.area}, ` : ""}
                {r.city}
                {r.needed_on ? ` · ${r.needed_on}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/60">Nothing posted yet.</p>
      )}
    </div>
  );
}
