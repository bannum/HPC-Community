import type { Metadata } from "next";
import Link from "next/link";
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
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl tracking-wide">
              CRICKET CONNECT
            </Link>
            <nav className="flex gap-5 text-sm font-medium">
              <Link href="/teams">Teams</Link>
              <Link href="/requirements">Board</Link>
              <Link href="/teams/new">Start a team</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
