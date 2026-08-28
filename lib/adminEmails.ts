// Client-side visibility gate only, not a real security boundary -- anyone
// with an account can already post requirements one at a time via the
// normal form (same RLS policy this bulk tool relies on). This just keeps
// the bulk-import power-tool out of the UI for everyone but the curator(s).
export const ADMIN_EMAILS = ["bannum4@gmail.com"];

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}
