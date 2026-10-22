import { SITE_URL } from "./siteUrl";
import { formatDateTime } from "./formatDate";

export type ShareableRequirement = {
  id: string;
  typeLabel: string;
  city: string;
  area: string | null;
  groundName: string | null;
  neededOn: string | null;
  details: string;
  contactPhone: string | null;
};

// Builds a clean, WhatsApp-formatted message. The link always uses the
// canonical domain, even if the post is being viewed on the vercel.app one.
// People type stray spaces and trailing commas ("RUMA GROUND ,"); tidy them.
const tidy = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").replace(/[\s,]+$/, "").trim();

export function buildShareText(r: ShareableRequirement) {
  const details = r.details
    .replace(/\s*\(via WhatsApp\)\s*$/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  const place = [tidy(r.groundName), tidy(r.area), tidy(r.city)].filter(Boolean).join(", ");

  // Many posters already put their number in the text; don't print it twice.
  const phoneDigits = (r.contactPhone ?? "").replace(/\D/g, "").slice(-10);
  const phoneAlreadyInDetails =
    phoneDigits.length >= 10 && details.replace(/\D/g, "").includes(phoneDigits);

  const lines = [`🏏 *${tidy(r.typeLabel)}*`, ""];
  if (place) lines.push(`📍 ${place}`);
  if (r.neededOn) lines.push(`🗓️ ${formatDateTime(r.neededOn)}`);
  lines.push("", details);
  if (r.contactPhone && !phoneAlreadyInDetails) lines.push("", `📞 ${r.contactPhone}`);
  lines.push("", `👉 View & respond: ${SITE_URL}/requirements/${r.id}`);

  return lines.join("\n");
}

export function openWhatsAppShare(r: ShareableRequirement) {
  window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText(r))}`, "_blank");
}
