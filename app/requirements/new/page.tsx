"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import RequireAuth from "@/components/RequireAuth";
import { fromISTInputValue } from "@/lib/formatDate";

export default function NewRequirementPage() {
  const router = useRouter();
  const [type, setType] = useState("player_needed");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [groundName, setGroundName] = useState("");
  const [groundOptions, setGroundOptions] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [neededOn, setNeededOn] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("grounds")
      .select("name")
      .order("name")
      .then(({ data }) => setGroundOptions((data ?? []).map((g) => g.name)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (groundName.trim()) {
      await supabase
        .from("grounds")
        .upsert({ name: groundName.trim(), city }, { onConflict: "name", ignoreDuplicates: true });
    }

    const { error: insertError } = await supabase.from("requirements").insert({
      posted_by: user.id,
      requirement_type: type,
      custom_type_label: type === "other" ? customTypeLabel || null : null,
      city,
      area: area || null,
      ground_name: groundName || null,
      details,
      needed_on: neededOn ? fromISTInputValue(neededOn) : null,
      contact_phone: contactPhone || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push("/requirements");
  }

  return (
    <RequireAuth>
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-6">Post a requirement</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          >
            <option value="player_needed">Player needed</option>
            <option value="opponent_needed">Opponent needed</option>
            <option value="ground_available">Ground available</option>
            <option value="other">Other</option>
          </select>
        </div>
        {type === "other" && (
          <div>
            <label className="block text-sm font-medium mb-1">Describe the type</label>
            <input
              required
              value={customTypeLabel}
              onChange={(e) => setCustomTypeLabel(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
              placeholder="e.g. Umpire needed"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
              placeholder="Hyderabad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area (optional)</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
              placeholder="Gachibowli"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ground (optional)</label>
          <input
            value={groundName}
            onChange={(e) => setGroundName(e.target.value)}
            list="ground-options"
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="Raghavendra Ground"
          />
          <datalist id="ground-options">
            {groundOptions.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            required
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            rows={3}
            placeholder="Need 2 players for Sunday box cricket match, 7am"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Date & time needed (optional)
          </label>
          <input
            type="datetime-local"
            value={neededOn}
            onChange={(e) => setNeededOn(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact phone (optional)
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="9876543210"
          />
          <p className="text-xs text-ink/50 mt-1">
            Shown as a WhatsApp/call link so people can reach you directly.
          </p>
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
    </RequireAuth>
  );
}
