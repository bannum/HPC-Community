"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { waLink } from "@/lib/phone";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: user?.id ?? null }),
    });

    if (!res.ok) {
      setError("Something went wrong — try WhatsApp instead.");
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-4">Support</h1>
        <p className="text-ink/70 mb-3">
          Ran into an issue, or have feedback? Reach out directly:
        </p>
        <a
          href={waLink("9704193489")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-scoreboard text-ink font-semibold px-5 py-2 rounded"
        >
          Chat on WhatsApp
        </a>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3">Or send a message</h2>
        {sent ? (
          <p className="text-pitch font-medium">Thanks — we'll get back to you.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-pitch/30 rounded px-3 py-2"
              placeholder="What's going on?"
            />
            {error && <p className="text-red-700 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
