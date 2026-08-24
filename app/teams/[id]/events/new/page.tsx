"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("net_practice");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
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
      setError("Sign in first.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("events").insert({
      team_id: params.id,
      title,
      event_type: eventType,
      starts_at: new Date(startsAt).toISOString(),
      location,
      capacity: capacity ? parseInt(capacity, 10) : null,
      created_by: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/teams/${params.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-6">New event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="Sunday morning nets"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          >
            <option value="net_practice">Net practice</option>
            <option value="match">Match</option>
            <option value="tournament">Tournament</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date & time</label>
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="Gachibowli Stadium nets"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Capacity (optional)
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create event"}
        </button>
      </form>
    </div>
  );
}
