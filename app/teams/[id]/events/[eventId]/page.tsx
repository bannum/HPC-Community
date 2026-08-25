import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RsvpButtons from "@/components/RsvpButtons";
import ShareEventButton from "@/components/ShareEventButton";

export const revalidate = 0;

export default async function EventDetailPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_type, starts_at, location, capacity, team_id, teams(name)")
    .eq("id", params.eventId)
    .single();

  if (!event) {
    return <p>Event not found.</p>;
  }

  const teamName = (event.teams as unknown as { name: string } | null)?.name ?? "";
  const when = new Date(event.starts_at).toLocaleString();

  return (
    <div className="max-w-lg space-y-4">
      <Link href={`/teams/${event.team_id}`} className="text-sm underline">
        &larr; Back to {teamName || "team"}
      </Link>

      <div className="bg-white border border-pitch/20 rounded p-6 space-y-4">
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

        <RsvpButtons eventId={event.id} teamId={event.team_id} initialStatus={null} />

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
