"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
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
      setError("Sign in first to start a team.");
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("teams")
      .insert({
        name,
        city,
        area: area || null,
        description: description || null,
        is_public: isPublic,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Owner is automatically an accepted member with the owner role.
    await supabase.from("memberships").insert({
      team_id: data.id,
      user_id: user.id,
      status: "accepted",
      role: "owner",
    });

    router.push(`/teams/${data.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-6">Start a team</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Team name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="e.g. Sunday Warriors"
          />
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
          <label className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            rows={3}
            placeholder="Weekend box cricket, all skill levels welcome."
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public — anyone can find and request to join
        </label>

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create team"}
        </button>
      </form>
    </div>
  );
}
