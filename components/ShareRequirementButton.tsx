"use client";

import { openWhatsAppShare, type ShareableRequirement } from "@/lib/shareRequirement";

export default function ShareRequirementButton({
  requirement,
}: {
  requirement: ShareableRequirement;
}) {
  return (
    <button
      onClick={() => openWhatsAppShare(requirement)}
      className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
    >
      Share on WhatsApp
    </button>
  );
}
