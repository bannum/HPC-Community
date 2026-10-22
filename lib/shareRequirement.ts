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
export function buildShareText(r: ShareableRequirement) {
  const details = r.details.replace(/\s*\(via WhatsApp\)\s*$/i, "").trim();
  const place = [r.groundName, r.area, r.city].filter(Boolean).join(", ");

  const lines = [`🏏 *${r.typeLabel}*`, ""];
  if (place) lines.push(`📍 ${place}`);
  if (r.neededOn) lines.push(`🗓️ ${formatDateTime(r.neededOn)}`);
  lines.push("", details);
  if (r.contactPhone) lines.push("", `📞 ${r.contactPhone}`);
  lines.push("", `👉 View & respond: ${SITE_URL}/requirements/${r.id}`);

  return lines.join("\n");
}

export function openWhatsAppShare(r: ShareableRequirement) {
  window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText(r))}`, "_blank");
}
