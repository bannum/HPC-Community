"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import RequireAuth from "@/components/RequireAuth";
import { fromISTInputValue, toISTInputValue } from "@/lib/formatDate";

export default function EditRequirementPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth>
      <EditRequirementForm requirementId={params.id} />
    </RequireAuth>
  );
}

function EditRequirementForm({ requirementId }: { requirementId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [type, setType] = useState("player_needed");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [groundName, setGroundName] = useState("");
  const [groundOptions, setGroundOptions] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [neededOn, setNeededOn] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: requirement } = await supabase
        .from("requirements")
        .select(
          "posted_by, requirement_type, custom_type_label, city, area, ground_name, details, needed_on, contact_phone"
        )
        .eq("id", requirementId)
        .single();

      if (!requirement || !user || requirement.posted_by !== user.id) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      setType(requirement.requirement_type);
      setCustomTypeLabel(requirement.custom_type_label ?? "");
      setCity(requirement.city);
      setArea(requirement.area ?? "");
      setGroundName(requirement.ground_name ?? "");
      setDetails(requirement.details);
      setNeededOn(requirement.needed_on ? toISTInputValue(requirement.needed_on) : "");
      setContactPhone(requirement.contact_phone ?? "");
      setLoading(false);
    }
    load();

    supabase
      .from("grounds")
      .select("name")
      .order("name")
      .then(({ data }) => setGroundOptions((data ?? []).map((g) => g.name)));
  }, [requirementId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (groundName.trim()) {
      await supabase
        .from("grounds")
        .upsert({ name: groundName.trim(), city }, { onConflict: "name", ignoreDuplicates: true });
    }

    const { error: updateError } = await supabase
      .from("requirements")
      .update({
        requirement_type: type,
        custom_type_label: type === "other" ? customTypeLabel || null : null,
        city,
        area: area || null,
        ground_name: groundName || null,
        details,
        needed_on: neededOn ? fromISTInputValue(neededOn) : null,
        contact_phone: contactPhone || null,
      })
      .eq("id", requirementId);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/requirements/${requirementId}`);
  }

  if (loading) return null;

  if (notAllowed) {
    return <p className="text-ink/60">You can only edit requirements you posted.</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-6">Edit requirement</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          >
            <option value="player_needed">Player needed</option>
            <option value="opponent_needed">Opponent needed</option>
            <option value="ground_available">Ground available</option>
            <option value="other">Other</option>
          </select>
        </div>
        {type === "other" && (
          <div>
            <label className="block text-sm font-medium mb-1">Describe the type</label>
            <input
              required
              value={customTypeLabel}
              onChange={(e) => setCustomTypeLabel(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
              placeholder="e.g. Umpire needed"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area (optional)</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ground (optional)</label>
          <input
            value={groundName}
            onChange={(e) => setGroundName(e.target.value)}
            list="ground-options"
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
          <datalist id="ground-options">
            {groundOptions.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            required
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Date & time needed (optional)
          </label>
          <input
            type="datetime-local"
            value={neededOn}
            onChange={(e) => setNeededOn(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact phone (optional)
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
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
