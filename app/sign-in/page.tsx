"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-sm">
        <h1 className="font-display text-3xl mb-4">Check your email</h1>
        <p>We sent a sign-in link to {email}. Tap it to continue.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <h1 className="font-display text-3xl mb-6">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-pitch/30 rounded px-3 py-2"
            placeholder="you@example.com"
          />
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded"
        >
          Send login link
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        No password to remember — we'll email you a one-tap link. First time
        signing in also creates your profile.
      </p>
    </div>
  );
}
