# Cricket Connect — MVP

A lightweight, free events + team-connection app for cricket communities in
Hyderabad: teams/channels, events with RSVP, and a searchable requirement
board (grounds / opponents / players) — the things WhatsApp groups bury.

## What's in here

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase for auth (magic link), database, and row-level security
- Pages: home/discovery, team create + detail, event create + RSVP,
  requirement board + post

## 1. Create a free Supabase project

1. Go to https://supabase.com, sign up, and create a new project (free tier).
2. In the dashboard, go to the **SQL Editor** and paste in the full contents
   of `supabase/schema.sql` from this project, then run it. This creates all
   tables (profiles, teams, memberships, events, rsvps, requirements) with
   the right security rules already set up.
3. Go to **Project Settings > API**. Copy the **Project URL** and the
   **anon public key**.
4. Go to **Authentication > URL Configuration** and add
   `http://localhost:3000/auth/callback` as a redirect URL (needed for the
   magic-link sign-in to work locally).

## 2. Configure this project

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste in your Project URL and anon key from step 1.

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sign in with your email (you'll get a magic
link), then try creating a team, an event, and a requirement post.

## What's deliberately left out of this MVP

- In-app chat/messaging (people already use WhatsApp for that — don't
  compete there)
- Payments for events
- Multiple sports (stay cricket-only until this works for one)
- An admin screen to accept/reject join requests (right now requests are
  stored but need to be actioned directly in the Supabase table editor —
  worth building next once you're testing with real people)

## Suggested next build steps, in order

1. A simple "manage requests" view on the team page so owners can accept
   or reject join requests without opening Supabase directly
2. Email notifications for RSVP reminders (Supabase has a scheduled
   functions feature, or a simple daily cron job, for this)
3. "I'm available" responses on requirement posts (the `requirement_responses`
   table already exists in the schema — just needs a UI)
4. Deploy to Vercel (free tier) once you're ready to share a real link
   instead of running locally

## Deploying (when ready)

Push this to a GitHub repo, then import it at https://vercel.com — it
auto-detects Next.js. Add the same two environment variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel
project settings, and add your Vercel URL's `/auth/callback` path to
Supabase's redirect URLs the same way you did for localhost.
