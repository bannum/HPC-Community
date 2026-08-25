import type { Metadata } from "next";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket Connect",
  description: "Find teams, grounds, and matches — without losing it in a WhatsApp group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen">
        <header className="bg-pitch text-stumps border-b-4 border-scoreboard">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-y-2">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl tracking-wide">
              <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="48" fill="#4A6B57" />
                <circle cx="50" cy="50" r="36" fill="#D98E2B" />
                <path
                  d="M50 16 C 36 36, 36 64, 50 84"
                  fill="none"
                  stroke="#EDE6D6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="1 8"
                />
              </svg>
              CRICKET CONNECT
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
              <Link href="/teams">Teams</Link>
              <Link href="/requirements">Board</Link>
              <Link href="/teams/new">Start a team</Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-6 text-sm text-ink/50">
          <Link href="/support" className="underline">
            Support / Feedback
          </Link>
        </footer>
      </body>
    </html>
  );
}
