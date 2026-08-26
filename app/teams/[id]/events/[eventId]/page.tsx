import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RsvpButtons from "@/components/RsvpButtons";
import RsvpSummary from "@/components/RsvpSummary";
import ShareEventButton from "@/components/ShareEventButton";
import EventOwnerActions from "@/components/EventOwnerActions";
import { formatDateTime } from "@/lib/formatDate";

export const revalidate = 0;

export default async function EventDetailPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, event_type, starts_at, location, capacity, details, created_by, team_id, teams(name)"
    )
    .eq("id", params.eventId)
    .single();

  if (!event) {
    return <p>Event not found.</p>;
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("status")
    .eq("event_id", event.id);

  const counts = {
    going: (rsvps ?? []).filter((r) => r.status === "going").length,
    maybe: (rsvps ?? []).filter((r) => r.status === "maybe").length,
    not_going: (rsvps ?? []).filter((r) => r.status === "not_going").length,
  };

  const teamName = (event.teams as unknown as { name: string } | null)?.name ?? "";
  const when = formatDateTime(event.starts_at);

  return (
    <div className="max-w-lg space-y-4">
      <Link href={`/teams/${event.team_id}`} className="text-sm underline">
        &larr; Back to {teamName || "team"}
      </Link>

      <div className="bg-white border border-pitch/20 rounded p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
              {event.event_type.replace("_", " ")}
            </span>
            <h1 className="font-display text-2xl">{event.title}</h1>
            <p className="text-sm text-ink/60 mt-1">
              {teamName}
              {" · "}
              {when} · {event.location}
              {event.capacity ? ` · capacity ${event.capacity}` : ""}
            </p>
          </div>
          <EventOwnerActions
            eventId={event.id}
            teamId={event.team_id}
            createdBy={event.created_by}
          />
        </div>

        {event.details && <p className="text-ink/80">{event.details}</p>}

        <RsvpButtons eventId={event.id} teamId={event.team_id} initialStatus={null} />

        <RsvpSummary
          eventId={event.id}
          going={counts.going}
          maybe={counts.maybe}
          notGoing={counts.not_going}
        />

        <ShareEventButton
          title={event.title}
          teamName={teamName}
          when={when}
          location={event.location}
        />
      </div>
    </div>
  );
}
