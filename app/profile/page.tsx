"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileForm />
    </Suspense>
  );
}

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, city")
        .eq("id", user.id)
        .maybeSingle();
      setFullName(data?.full_name ?? "");
      setPhone(data?.phone ?? "");
      setCity(data?.city ?? "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone, city: city || null });

    if (upsertError) {
      setError(upsertError.message);
      setSubmitting(false);
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
  }

  if (loading) return null;

  return (
    <div className="max-w-sm">
      <h1 className="font-display text-3xl mb-2">Complete your profile</h1>
      <p className="text-sm text-ink/60 mb-6">
        Your name and phone are needed so teammates and organizers can reach you.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="9876543210"
          />
          <p className="text-xs text-ink/50 mt-1">
            Only shared with your team's organizers, and with people you contact
            through the requirement board.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City (optional)</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="Hyderabad"
          />
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save & continue"}
        </button>
      </form>
    </div>
  );
}
