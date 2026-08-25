-- Cricket Connect: core schema
-- Run this in the Supabase SQL editor on a fresh project.
-- Relies on Supabase's built-in auth.users table for identity.

-- ============ PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, -- nullable until the user completes their profile
  city text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- SELECT policies for profiles are defined near the bottom of this file,
-- once memberships/requirements/requirement_responses exist (phone numbers
-- are only visible to teammates/team admins/requirement contacts, not
-- the general public — see "Profiles visible to ..." policies below).

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ============ TEAMS ============
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'team' check (kind in ('team', 'group', 'club')),
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

-- Security-definer helpers: a policy on `memberships` cannot safely query
-- `memberships` again in its own USING clause (Postgres re-applies the same
-- policy to that inner query and recurses forever). Routing the check
-- through a security-definer function breaks the cycle since RLS doesn't
-- re-enter it.
create or replace function public.is_accepted_member(_team_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where team_id = _team_id and user_id = _user_id and status = 'accepted'
  );
$$;

create or replace function public.has_team_role(_team_id uuid, _user_id uuid, _roles membership_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where team_id = _team_id and user_id = _user_id
      and status = 'accepted' and role = any(_roles)
  );
$$;

create policy "Members viewable by team members and the requester"
  on memberships for select using (
    user_id = auth.uid()
    or team_id in (select id from teams where owner_id = auth.uid())
    or public.is_accepted_member(team_id, auth.uid())
  );

create policy "Users can request to join"
  on memberships for insert with check (auth.uid() = user_id);

create policy "Owners/admins can update membership status"
  on memberships for update using (
    team_id in (select id from teams where owner_id = auth.uid())
    or public.has_team_role(team_id, auth.uid(), array['owner','admin']::membership_role[])
  );

-- Lets anyone compute an accurate "N members" count for public teams
-- without needing to already be a member (previous policies only let a
-- member see rows they're part of, so anonymous/public reads saw nothing).
create policy "Accepted memberships of public teams are viewable by everyone"
  on memberships for select using (
    status = 'accepted' and team_id in (select id from teams where is_public = true)
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

create policy "Members can create events"
  on events for insert with check (
    team_id in (select id from teams where owner_id = auth.uid())
    or public.is_accepted_member(team_id, auth.uid())
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

-- ============ GROUNDS ============
-- A lightweight, growing registry of ground names so future requirement
-- posts can autocomplete from previous entries. No location data yet —
-- room to add lat/lng later for a maps link.
create table if not exists grounds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  area text,
  created_at timestamptz not null default now()
);

alter table grounds enable row level security;

create policy "Grounds are viewable by everyone"
  on grounds for select using (true);

create policy "Authenticated users can add grounds"
  on grounds for insert with check (auth.uid() is not null);

-- ============ REQUIREMENT POSTS ============
create type requirement_type as enum ('ground_available', 'opponent_needed', 'player_needed', 'other');
create type requirement_status as enum ('open', 'fulfilled');

create table if not exists requirements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade, -- nullable: solo organizers without a team
  posted_by uuid not null references profiles(id),
  requirement_type requirement_type not null,
  custom_type_label text, -- set when requirement_type = 'other'
  city text not null,
  area text,
  ground_name text,
  details text not null,
  needed_on timestamptz,
  contact_phone text,
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

-- ============ PROFILE VISIBILITY ============
-- Now that phone is effectively mandatory, profiles must NOT be readable
-- by everyone (that would let anyone dump every user's phone number).
-- Visible only: to yourself, to teammates, to team owners/admins (including
-- over pending join requests, so they can be reviewed), and between a
-- requirement's poster and its responders.
create or replace function public.shares_team_with(_other_user uuid, _viewer uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m1
    join memberships m2 on m1.team_id = m2.team_id
    where m1.user_id = _viewer and m1.status = 'accepted'
      and m2.user_id = _other_user and m2.status = 'accepted'
  );
$$;

create or replace function public.manages_team_of(_other_user uuid, _viewer uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m
    where m.user_id = _other_user
      and (
        m.team_id in (select id from teams where owner_id = _viewer)
        or public.has_team_role(m.team_id, _viewer, array['owner','admin']::membership_role[])
      )
  );
$$;

create or replace function public.requirement_contact_visible(_profile_id uuid, _viewer uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from requirement_responses rr
    join requirements r on r.id = rr.requirement_id
    where (rr.user_id = _profile_id and r.posted_by = _viewer)
       or (r.posted_by = _profile_id and rr.user_id = _viewer)
  );
$$;

create policy "Profiles visible to self"
  on profiles for select using (auth.uid() = id);

create policy "Teammates can view each other's profiles"
  on profiles for select using (public.shares_team_with(id, auth.uid()));

create policy "Team owners/admins can view member and requester profiles"
  on profiles for select using (public.manages_team_of(id, auth.uid()));

create policy "Requirement poster and responder can view each other"
  on profiles for select using (public.requirement_contact_visible(id, auth.uid()));
