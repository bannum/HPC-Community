import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  player_needed: "Player needed",
  opponent_needed: "Opponent needed",
  ground_available: "Ground available",
  other: "Other",
};

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

export default async function RequirementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: requirement } = await supabase
    .from("requirements")
    .select(
      "id, requirement_type, custom_type_label, city, area, ground_name, details, needed_on, status, contact_phone, created_at"
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

        {requirement.contact_phone && (
          <div className="mt-5 flex gap-3">
            <a
              href={waLink(requirement.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${requirement.contact_phone}`}
              className="border border-pitch text-pitch font-semibold px-4 py-2 rounded text-sm"
            >
              Call
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
