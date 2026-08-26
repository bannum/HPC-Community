"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import RequireAuth from "@/components/RequireAuth";

export default function EditEventPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  return (
    <RequireAuth>
      <EditEventForm teamId={params.id} eventId={params.eventId} />
    </RequireAuth>
  );
}

function EditEventForm({ teamId, eventId }: { teamId: string; eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("net_practice");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: event } = await supabase
        .from("events")
        .select("title, event_type, starts_at, location, capacity, details, created_by")
        .eq("id", eventId)
        .single();

      if (!event || !user) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      let allowed = event.created_by === user.id;
      if (!allowed) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("role")
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .eq("status", "accepted")
          .maybeSingle();
        allowed = membership?.role === "owner" || membership?.role === "admin";
      }

      if (!allowed) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      setTitle(event.title);
      setEventType(event.event_type);
      setStartsAt(event.starts_at.slice(0, 16));
      setLocation(event.location);
      setCapacity(event.capacity ? String(event.capacity) : "");
      setDetails(event.details ?? "");
      setLoading(false);
    }
    load();
  }, [teamId, eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title,
        event_type: eventType,
        starts_at: new Date(startsAt).toISOString(),
        location,
        capacity: capacity ? parseInt(capacity, 10) : null,
        details: details || null,
      })
      .eq("id", eventId);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/teams/${teamId}/events/${eventId}`);
  }

  if (loading) return null;

  if (notAllowed) {
    return <p className="text-ink/60">You can only edit events you manage.</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-6">Edit event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
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
        <div>
          <label className="block text-sm font-medium mb-1">
            Details (optional)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
