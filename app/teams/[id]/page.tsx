import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RsvpButtons from "@/components/RsvpButtons";
import RsvpSummary from "@/components/RsvpSummary";
import JoinButton from "@/components/JoinButton";
import NewEventButton from "@/components/NewEventButton";
import PendingRequests from "@/components/PendingRequests";
import MembersList from "@/components/MembersList";
import ContactOrganizers from "@/components/ContactOrganizers";
import { formatDateTime } from "@/lib/formatDate";

export const revalidate = 0;

export default async function TeamPage({ params }: { params: { id: string } }) {
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, kind, city, area, description")
    .eq("id", params.id)
    .single();

  if (!team) {
    return <p>Team not found.</p>;
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_type, starts_at, location, capacity")
    .eq("team_id", params.id)
    .order("starts_at", { ascending: true });

  const { count: memberCount } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("team_id", params.id)
    .eq("status", "accepted");

  // Pull RSVP counts per event in one query, then group client-side (kept simple for MVP).
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: rsvps } = eventIds.length
    ? await supabase
        .from("rsvps")
        .select("event_id, status")
        .in("event_id", eventIds)
    : { data: [] as { event_id: string; status: string }[] };

  function countsFor(eventId: string) {
    const rows = (rsvps ?? []).filter((r) => r.event_id === eventId);
    return {
      going: rows.filter((r) => r.status === "going").length,
      maybe: rows.filter((r) => r.status === "maybe").length,
      not_going: rows.filter((r) => r.status === "not_going").length,
    };
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
            {team.kind}
          </span>
          <h1 className="font-display text-3xl">{team.name}</h1>
          <p className="text-ink/60">
            {team.area ? `${team.area}, ` : ""}
            {team.city} · {memberCount ?? 0} members
          </p>
          {team.description && <p className="mt-2">{team.description}</p>}
        </div>
        <JoinButton teamId={team.id} />
      </div>

      <PendingRequests teamId={team.id} />
      <MembersList teamId={team.id} />
      <ContactOrganizers teamId={team.id} />

      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl">Events</h2>
        <NewEventButton teamId={team.id} />
      </div>

      {events && events.length > 0 ? (
        <ul className="space-y-3">
          {events.map((e) => {
            const c = countsFor(e.id);
            return (
              <li key={e.id} className="bg-white border border-pitch/20 rounded p-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
                      {e.event_type.replace("_", " ")}
                    </span>
                    <Link
                      href={`/teams/${team.id}/events/${e.id}`}
                      className="font-semibold hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="text-sm text-ink/60">
                      {formatDateTime(e.starts_at)} · {e.location}
                      {e.capacity ? ` · capacity ${e.capacity}` : ""}
                    </p>
                  </div>
                  {/* Scoreboard-style RSVP tally — click a count to see who — the screen meant to replace scrolling a WhatsApp thread */}
                  <RsvpSummary
                    eventId={e.id}
                    going={c.going}
                    maybe={c.maybe}
                    notGoing={c.not_going}
                  />
                </div>
                <div className="mt-3">
                  <RsvpButtons eventId={e.id} teamId={team.id} initialStatus={null} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-ink/60">No events yet.</p>
      )}
    </div>
  );
}
