-- Cricket Connect: core schema
-- Run this in the Supabase SQL editor on a fresh project.
-- Relies on Supabase's built-in auth.users table for identity.

-- ============ PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  city text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ============ TEAMS ============
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'cricket',
  city text not null,
  area text,
  description text,
  is_public boolean not null default true,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;

create policy "Public teams are viewable by everyone"
  on teams for select using (is_public = true or owner_id = auth.uid());

create policy "Authenticated users can create teams"
  on teams for insert with check (auth.uid() = owner_id);

create policy "Owners can update their team"
  on teams for update using (auth.uid() = owner_id);

-- ============ MEMBERSHIPS ============
create type membership_status as enum ('requested', 'accepted', 'rejected');
create type membership_role as enum ('owner', 'admin', 'member');

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status membership_status not null default 'requested',
  role membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table memberships enable row level security;

create policy "Members viewable by team members and the requester"
  on memberships for select using (
    user_id = auth.uid()
    or team_id in (select id from teams where owner_id = auth.uid())
    or team_id in (select team_id from memberships m where m.user_id = auth.uid() and m.status = 'accepted')
  );

create policy "Users can request to join"
  on memberships for insert with check (auth.uid() = user_id);

create policy "Owners/admins can update membership status"
  on memberships for update using (
    team_id in (select id from teams where owner_id = auth.uid())
    or team_id in (select team_id from memberships m where m.user_id = auth.uid() and m.role in ('owner','admin') and m.status = 'accepted')
  );

-- ============ EVENTS ============
create type event_type as enum ('net_practice', 'match', 'tournament');

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  event_type event_type not null default 'net_practice',
  starts_at timestamptz not null,
  location text not null,
  capacity int,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "Events viewable if team is public or user is a member"
  on events for select using (
    team_id in (select id from teams where is_public = true)
    or team_id in (select team_id from memberships where user_id = auth.uid() and status = 'accepted')
    or team_id in (select id from teams where owner_id = auth.uid())
  );

create policy "Owners/admins can create events"
  on events for insert with check (
    team_id in (select id from teams where owner_id = auth.uid())
    or team_id in (select team_id from memberships m where m.user_id = auth.uid() and m.role in ('owner','admin') and m.status = 'accepted')
  );

-- ============ RSVPs ============
create type rsvp_status as enum ('going', 'maybe', 'not_going');

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status rsvp_status not null,
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table rsvps enable row level security;

create policy "RSVPs viewable by anyone who can see the event"
  on rsvps for select using (true);

create policy "Users manage their own RSVP"
  on rsvps for insert with check (auth.uid() = user_id);

create policy "Users update their own RSVP"
  on rsvps for update using (auth.uid() = user_id);

-- ============ REQUIREMENT POSTS ============
create type requirement_type as enum ('ground_available', 'opponent_needed', 'player_needed');
create type requirement_status as enum ('open', 'fulfilled');

create table if not exists requirements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade, -- nullable: solo organizers without a team
  posted_by uuid not null references profiles(id),
  requirement_type requirement_type not null,
  city text not null,
  area text,
  details text not null,
  needed_on date,
  status requirement_status not null default 'open',
  created_at timestamptz not null default now()
);

alter table requirements enable row level security;

create policy "Requirements are viewable by everyone"
  on requirements for select using (true);

create policy "Authenticated users can post requirements"
  on requirements for insert with check (auth.uid() = posted_by);

create policy "Posters can update their own requirement"
  on requirements for update using (auth.uid() = posted_by);

-- ============ REQUIREMENT RESPONSES ============
-- e.g. "I'm available" on a player_needed post
create table if not exists requirement_responses (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  unique (requirement_id, user_id)
);

alter table requirement_responses enable row level security;

create policy "Responses viewable by everyone"
  on requirement_responses for select using (true);

create policy "Users can respond once per requirement"
  on requirement_responses for insert with check (auth.uid() = user_id);
