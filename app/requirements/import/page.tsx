"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import RequireAuth from "@/components/RequireAuth";
import { isAdminEmail } from "@/lib/adminEmails";
import { fromISTInputValue } from "@/lib/formatDate";
import {
  parseWhatsAppExport,
  buildCandidates,
  normalizeForMatch,
  type Candidate,
} from "@/lib/whatsappImport";

export default function ImportWhatsAppPage() {
  return (
    <RequireAuth>
      <AdminGate />
    </RequireAuth>
  );
}

function AdminGate() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAllowed(isAdminEmail(data.user?.email));
    });
  }, []);

  if (allowed === null) return null;
  if (!allowed) return <p className="text-ink/60">This tool isn't available on your account.</p>;
  return <ImportForm />;
}

function ImportForm() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [skippedExisting, setSkippedExisting] = useState(0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function analyze() {
    setAnalyzing(true);
    const messages = parseWhatsAppExport(raw);
    const built = buildCandidates(messages, city);

    // Drop anything that's already on the board (same text, same date), so
    // re-importing an overlapping export -- or the same ad from two groups --
    // doesn't create duplicates.
    const { data: existing } = await supabase
      .from("requirements")
      .select("details, needed_on")
      .order("created_at", { ascending: false })
      .limit(1000);
    const onBoard = new Set(
      (existing ?? []).map(
        (e) =>
          `${normalizeForMatch(e.details)}|${e.needed_on ? new Date(e.needed_on).toISOString().slice(0, 16) : ""}`
      )
    );
    const fresh = built.filter(
      (c) =>
        !onBoard.has(
          `${normalizeForMatch(c.details)}|${c.neededOn ? fromISTInputValue(c.neededOn).slice(0, 16) : ""}`
        )
    );
    setSkippedExisting(built.length - fresh.length);

    setCandidates(fresh);
    // Undated posts never expire on the board, so they'd linger forever --
    // leave them unticked and let the curator opt in deliberately.
    setSelected(
      new Set(
        fresh
          .filter((c) => c.isFuture && c.neededOn !== "" && c.requirementType !== "other")
          .map((c) => c.key)
      )
    );
    setPosted(null);
    setAnalyzing(false);
  }

  function updateCandidate(key: string, patch: Partial<Candidate>) {
    setCandidates((prev) => (prev ?? []).map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function postSelected() {
    if (!candidates) return;
    setPosting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const rows = candidates.filter((c) => selected.has(c.key));
    const postedKeys = new Set<string>();
    for (const row of rows) {
      if (row.groundName.trim()) {
        await supabase
          .from("grounds")
          .upsert(
            { name: row.groundName.trim(), city: row.city },
            { onConflict: "name", ignoreDuplicates: true }
          );
      }
      const { error: insertError } = await supabase.from("requirements").insert({
        posted_by: user.id,
        requirement_type: row.requirementType === "other" ? "other" : row.requirementType,
        custom_type_label: row.requirementType === "other" ? "Cricket requirement" : null,
        city: row.city,
        area: row.area || null,
        ground_name: row.groundName || null,
        details: `${row.details} (via WhatsApp)`,
        needed_on: row.neededOn ? fromISTInputValue(row.neededOn) : null,
        contact_phone: row.contactPhone || null,
      });
      if (!insertError) postedKeys.add(row.key);
    }

    // Remove posted rows from the list so they can't be double-posted, and
    // so the shrinking list itself is visible feedback that something happened.
    setCandidates((prev) => (prev ?? []).filter((c) => !postedKeys.has(c.key)));
    setSelected((prev) => {
      const next = new Set(prev);
      postedKeys.forEach((k) => next.delete(k));
      return next;
    });
    setPosting(false);
    setPosted(postedKeys.size);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Import from WhatsApp</h1>
      <p className="text-ink/70 text-sm">
        Paste or upload a WhatsApp chat export (.txt). It'll be parsed, de-duplicated, and
        filtered to likely-future requirements — nothing gets posted until you review and select
        rows below. Only import with the consent of the group's owner/members.
      </p>

      <div className="bg-white border border-pitch/20 rounded p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Upload export file (.txt)</label>
          <input type="file" accept=".txt" onChange={handleFile} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Or paste export text</label>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            className="w-full border border-pitch/30 rounded px-3 py-2 font-mono text-xs"
            placeholder="15/06/26, 21:56 - Messages and calls are end-to-end encrypted...."
          />
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium mb-1">Default city</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={analyze}
          disabled={!raw.trim() || analyzing}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {analyzing ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {candidates && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">
                {candidates.length} new candidates — {selected.size} selected
              </h2>
              {skippedExisting > 0 && (
                <p className="text-sm text-ink/60">
                  {skippedExisting} already on the board, skipped.
                </p>
              )}
            </div>
            {posted !== null && (
              <p className="text-pitch font-medium text-sm">
                Posted {posted} requirement{posted === 1 ? "" : "s"} to the board.{" "}
                <Link href="/requirements" className="underline">
                  View board
                </Link>
              </p>
            )}
          </div>

          <div className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c.key}
                className={`bg-white border rounded p-4 ${
                  selected.has(c.key) ? "border-scoreboard" : "border-pitch/20 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.key)}
                    onChange={() => toggle(c.key)}
                    className="mt-2"
                  />
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={c.requirementType}
                        onChange={(e) =>
                          updateCandidate(c.key, {
                            requirementType: e.target.value as Candidate["requirementType"],
                          })
                        }
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      >
                        <option value="player_needed">Player needed</option>
                        <option value="opponent_needed">Opponent needed</option>
                        <option value="ground_available">Ground available</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Needed on</label>
                      <input
                        type="datetime-local"
                        value={c.neededOn}
                        onChange={(e) => updateCandidate(c.key, { neededOn: e.target.value })}
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">City</label>
                      <input
                        value={c.city}
                        onChange={(e) => updateCandidate(c.key, { city: e.target.value })}
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Ground</label>
                      <input
                        value={c.groundName}
                        onChange={(e) => updateCandidate(c.key, { groundName: e.target.value })}
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Contact phone</label>
                      <input
                        value={c.contactPhone}
                        onChange={(e) => updateCandidate(c.key, { contactPhone: e.target.value })}
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Source ({c.sourceWhen}
                        {!c.isFuture ? " — looks past-dated" : ""}
                        {c.neededOn === "" ? " — no date found, won't expire" : ""})
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Details</label>
                      <textarea
                        value={c.details}
                        onChange={(e) => updateCandidate(c.key, { details: e.target.value })}
                        rows={2}
                        className="w-full border border-pitch/30 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-700 text-sm">{error}</p>}
          {posted !== null && (
            <p className="text-pitch font-medium text-sm">
              Posted {posted} requirement{posted === 1 ? "" : "s"} to the board.{" "}
              <Link href="/requirements" className="underline">
                View board
              </Link>
            </p>
          )}
          {candidates.length > 0 && (
            <button
              onClick={postSelected}
              disabled={posting || selected.size === 0}
              className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
            >
              {posting ? "Posting…" : `Post ${selected.size} selected`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
