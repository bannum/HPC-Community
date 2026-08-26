// Always renders in IST, regardless of the runtime's own timezone.
// Server components run on Vercel (UTC by default) while the app's
// audience is entirely in India, so relying on the runtime's default
// timezone silently shows the wrong time.
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Converts a stored UTC ISO timestamp into the "YYYY-MM-DDTHH:mm" format
// <input type="datetime-local"> expects, expressed in IST -- so editing a
// form shows the time the organizer actually entered, not the UTC value.
export function toISTInputValue(iso: string) {
  const istString = new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
  return istString.replace(" ", "T").slice(0, 16);
}

// Converts a "YYYY-MM-DDTHH:mm" value from a datetime-local input into a
// UTC ISO string for storage, treating it as IST regardless of the
// browser's own timezone (this app is India-only).
export function fromISTInputValue(value: string) {
  return new Date(`${value}+05:30`).toISOString();
}
