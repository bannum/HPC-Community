import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import RequirementsBoard from "@/components/RequirementsBoard";

export const revalidate = 0;

export default async function RequirementsPage() {
  const { data: requirements } = await supabase
    .from("requirements")
    .select(
      "id, requirement_type, custom_type_label, city, area, ground_name, details, needed_on, status"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl">The board</h1>
        <Link
          href="/requirements/new"
          className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
        >
          Post a requirement
        </Link>
      </div>

      {requirements && requirements.length > 0 ? (
        <RequirementsBoard requirements={requirements} />
      ) : (
        <p className="text-ink/60">Nothing posted yet.</p>
      )}
    </div>
  );
}
