import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RequirementInteraction from "@/components/RequirementInteraction";

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  player_needed: "Player needed",
  opponent_needed: "Opponent needed",
  ground_available: "Ground available",
  other: "Other",
};

export default async function RequirementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: requirement } = await supabase
    .from("requirements")
    .select(
      "id, posted_by, requirement_type, custom_type_label, city, area, ground_name, details, needed_on, status, contact_phone, created_at"
    )
    .eq("id", params.id)
    .single();

  if (!requirement) {
    return <p>Requirement not found.</p>;
  }

  const typeLabel =
    requirement.requirement_type === "other" && requirement.custom_type_label
      ? requirement.custom_type_label
      : TYPE_LABELS[requirement.requirement_type] ??
        requirement.requirement_type.replace("_", " ");

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

        <p className="mt-3 text-lg">{requirement.details}</p>

        <p className="text-sm text-ink/60 mt-2">
          {requirement.ground_name ? `${requirement.ground_name}, ` : ""}
          {requirement.area ? `${requirement.area}, ` : ""}
          {requirement.city}
          {requirement.needed_on
            ? ` · needed ${new Date(requirement.needed_on).toLocaleString()}`
            : ""}
        </p>

        <RequirementInteraction
          requirementId={requirement.id}
          postedBy={requirement.posted_by}
          contactPhone={requirement.contact_phone}
          status={requirement.status}
        />
      </div>
    </div>
  );
}
