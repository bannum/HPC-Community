"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewRequirementPage() {
  const router = useRouter();
  const [type, setType] = useState("player_needed");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [details, setDetails] = useState("");
  const [neededOn, setNeededOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in first to post.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("requirements").insert({
      posted_by: user.id,
      requirement_type: type,
      city,
      area: area || null,
      details,
      needed_on: neededOn || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push("/requirements");
  }

  return (
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
          </select>
        </div>
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
            Date needed (optional)
          </label>
          <input
            type="date"
            value={neededOn}
            onChange={(e) => setNeededOn(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
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
  );
}
