"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/formatDate";

type Requirement = {
  id: string;
  posted_by: string;
  requirement_type: string;
  custom_type_label: string | null;
  city: string;
  area: string | null;
  ground_name: string | null;
  details: string;
  needed_on: string | null;
  status: string;
};

const TYPE_LABELS: Record<string, string> = {
  player_needed: "Player needed",
  opponent_needed: "Opponent needed",
  ground_available: "Ground available",
  other: "Other",
};

function typeLabel(r: Pick<Requirement, "requirement_type" | "custom_type_label">) {
  if (r.requirement_type === "other" && r.custom_type_label) return r.custom_type_label;
  return TYPE_LABELS[r.requirement_type] ?? r.requirement_type.replace("_", " ");
}

export default function RequirementsBoard({ requirements }: { requirements: Requirement[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [city, setCity] = useState("all");
  const [showFulfilled, setShowFulfilled] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "needed_soonest">("newest");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(requirements.map((r) => r.city))).sort(),
    [requirements]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = requirements.filter((r) => {
      if (mineOnly && r.posted_by !== userId) return false;
      if (!showFulfilled && r.status === "fulfilled") return false;
      if (type !== "all" && r.requirement_type !== type) return false;
      if (city !== "all" && r.city !== city) return false;
      if (q) {
        const haystack = `${r.details} ${r.city} ${r.area ?? ""} ${r.ground_name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === "needed_soonest") {
      rows = [...rows].sort((a, b) => {
        if (!a.needed_on && !b.needed_on) return 0;
        if (!a.needed_on) return 1;
        if (!b.needed_on) return -1;
        return a.needed_on.localeCompare(b.needed_on);
      });
    }
    // "newest" relies on the server's created_at DESC order already applied.

    return rows;
  }, [requirements, search, type, city, showFulfilled, mineOnly, userId, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center bg-white border border-pitch/20 rounded p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search details, city, area, ground…"
          className="flex-1 min-w-[180px] border border-pitch/30 rounded px-3 py-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-pitch/30 rounded px-3 py-2"
        >
          <option value="all">All types</option>
          <option value="player_needed">Player needed</option>
          <option value="opponent_needed">Opponent needed</option>
          <option value="ground_available">Ground available</option>
          <option value="other">Other</option>
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-pitch/30 rounded px-3 py-2"
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "needed_soonest")}
          className="border border-pitch/30 rounded px-3 py-2"
        >
          <option value="newest">Newest first</option>
          <option value="needed_soonest">Needed soonest</option>
        </select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={showFulfilled}
            onChange={(e) => setShowFulfilled(e.target.checked)}
          />
          Show fulfilled
        </label>
        {userId && (
          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            Posted by me
          </label>
        )}
      </div>

      {filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className={`bg-white border rounded ${
                r.status === "fulfilled" ? "border-ink/10 opacity-60" : "border-pitch/20"
              }`}
            >
              <Link href={`/requirements/${r.id}`} className="block p-4 hover:border-scoreboard">
                <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                  {typeLabel(r)}
                </span>
                {r.status === "fulfilled" && (
                  <span className="text-xs ml-2 text-ink/50">· fulfilled</span>
                )}
                <p className="mt-1">{r.details}</p>
                <p className="text-sm text-ink/60 mt-1">
                  {r.ground_name ? `${r.ground_name}, ` : ""}
                  {r.area ? `${r.area}, ` : ""}
                  {r.city}
                  {r.needed_on ? ` · ${formatDateTime(r.needed_on)}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/60">No requirements match your filters.</p>
      )}
    </div>
  );
}
