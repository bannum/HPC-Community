"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/ensureProfile";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function sendCode() {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setError(error.message);
      return false;
    }
    setResendCooldown(30);
    return true;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = await sendCode();
    setSubmitting(false);
    if (ok) setStep("code");
  }

  async function handleResend() {
    setError(null);
    setResent(false);
    const ok = await sendCode();
    if (ok) setResent(true);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    if (data.user) {
      await ensureProfile(data.user);
    }
    router.push("/");
  }

  async function handleGoogleSignIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="max-w-sm">
      <h1 className="font-display text-3xl mb-6">Sign in</h1>

      <button
        onClick={handleGoogleSignIn}
        type="button"
        className="w-full border border-pitch/30 rounded px-3 py-2 font-medium mb-4"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-ink/50 mb-4">
        <div className="flex-1 border-t border-pitch/20" />
        or
        <div className="flex-1 border-t border-pitch/20" />
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
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
            disabled={submitting}
            className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm text-ink/70">We sent a sign-in code to {email}.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-pitch/30 rounded px-3 py-2 tracking-widest text-lg"
              placeholder="12345678"
              autoFocus
            />
          </div>
          {error && <p className="text-red-700 text-sm">{error}</p>}
          {resent && <p className="text-pitch text-sm">New code sent.</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-scoreboard text-ink font-semibold px-5 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify & sign in"}
          </button>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm underline text-ink/60 disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setResent(false);
              }}
              className="text-sm underline text-ink/60"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      <p className="text-sm text-ink/60 mt-4">
        No password to remember. First time signing in also creates your profile.
      </p>
    </div>
  );
}
