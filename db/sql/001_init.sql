-- MVP schema subset aligned with system-architecture-and-erd.md

create table if not exists players (
  id text primary key,
  email text,
  display_name text,
  pubkey_ed25519 text,
  created_at timestamptz default now()
);

create table if not exists empires (
  id text primary key,
  owner_player_id text references players(id),
  name text,
  banner text,
  policies jsonb,
  created_at timestamptz default now()
);

create table if not exists systems (
  id text primary key,
  name text not null,
  position_xyz jsonb not null,
  owner_empire_id text references empires(id)
);

create table if not exists fleets (
  id text primary key,
  empire_id text references empires(id),
  system_id text references systems(id),
  stance text,
  supply integer
);

create table if not exists ships (
  id text primary key,
  fleet_id text references fleets(id),
  hull text,
  count integer
);

create table if not exists orders (
  id text primary key,
  empire_id text references empires(id),
  kind text not null,
  payload jsonb not null,
  target_turn integer not null,
  idem_key text unique,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists order_receipts (
  id text primary key,
  order_id text references orders(id),
  status text not null,
  result jsonb
);

