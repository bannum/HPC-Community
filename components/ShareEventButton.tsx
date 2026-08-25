"use client";

export default function ShareEventButton({
  title,
  teamName,
  when,
  location,
}: {
  title: string;
  teamName: string;
  when: string;
  location: string;
}) {
  function handleShare() {
    const text = `${title} — ${teamName}\n${when} · ${location}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <button
      onClick={handleShare}
      className="bg-scoreboard text-ink font-semibold px-4 py-2 rounded text-sm"
    >
      Share on WhatsApp
    </button>
  );
}
