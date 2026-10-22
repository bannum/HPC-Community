import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RequirementInteraction from "@/components/RequirementInteraction";
import ShareRequirementButton from "@/components/ShareRequirementButton";
import { formatDateTime } from "@/lib/formatDate";

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  player_needed: "Player needed",
  opponent_needed: "Opponent needed",
  ground_available: "Ground available",
  other: "Other",
};

function labelFor(r: { requirement_type: string; custom_type_label: string | null }) {
  return r.requirement_type === "other" && r.custom_type_label
    ? r.custom_type_label
    : TYPE_LABELS[r.requirement_type] ?? r.requirement_type.replace("_", " ");
}

// Gives the link a proper title/description when pasted into WhatsApp.
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data: r } = await supabase
    .from("requirements")
    .select("requirement_type, custom_type_label, city, details")
    .eq("id", params.id)
    .single();
  if (!r) return {};

  const title = `${labelFor(r).trim()} — ${r.city.trim()} | Cricket Connect`;
  const description = r.details
    .replace(/\s*\(via WhatsApp\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function RequirementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: requirement } = await supabase
    .from("requirements")
    .select(
      "id, team_id, posted_by, requirement_type, custom_type_label, city, area, ground_name, details, needed_on, status, contact_phone, created_at"
    )
    .eq("id", params.id)
    .single();

  if (!requirement) {
    return <p>Requirement not found.</p>;
  }

  const typeLabel = labelFor(requirement);

  const isExpired =
    requirement.status === "open" &&
    Boolean(requirement.needed_on) &&
    new Date(requirement.needed_on as string) < new Date();

  return (
    <div className="max-w-lg space-y-4">
      <Link href="/requirements" className="text-sm underline">
        &larr; Back to the board
      </Link>

      <div className="bg-white border border-pitch/20 rounded p-6">
        <span className="text-xs uppercase tracking-wide text-pitch font-semibold">
          {typeLabel}
        </span>
        {requirement.status === "fulfilled" && (
          <span className="text-xs ml-2 text-ink/50">· fulfilled</span>
        )}
        {requirement.status !== "fulfilled" && isExpired && (
          <span className="text-xs ml-2 text-ink/50">· expired</span>
        )}

        <p className="mt-3 text-lg">{requirement.details}</p>

        <p className="text-sm text-ink/60 mt-2">
          {requirement.ground_name ? `${requirement.ground_name}, ` : ""}
          {requirement.area ? `${requirement.area}, ` : ""}
          {requirement.city}
          {requirement.needed_on
            ? ` · needed ${formatDateTime(requirement.needed_on)}`
            : ""}
        </p>

        {requirement.status !== "fulfilled" && !isExpired && (
          <div className="mt-4">
            <ShareRequirementButton
              requirement={{
                id: requirement.id,
                typeLabel,
                city: requirement.city,
                area: requirement.area,
                groundName: requirement.ground_name,
                neededOn: requirement.needed_on,
                details: requirement.details,
                contactPhone: requirement.contact_phone,
              }}
            />
          </div>
        )}

        <RequirementInteraction
          requirementId={requirement.id}
          postedBy={requirement.posted_by}
          contactPhone={requirement.contact_phone}
          status={requirement.status}
          teamId={requirement.team_id}
        />
      </div>
    </div>
  );
}
