-- Seed minimal data for dev; idempotent via ON CONFLICT DO NOTHING

-- players
insert into players (id, email, display_name)
values ('player-1', 'demo@example.com', 'Demo')
on conflict (id) do nothing;

-- empires
insert into empires (id, owner_player_id, name)
values ('emp-1', 'player-1', 'Demo Empire')
on conflict (id) do nothing;

-- systems
insert into systems (id, name, position_xyz)
values ('sys-1', 'Sol', '{"x":0,"y":0,"z":0}'::jsonb)
on conflict (id) do nothing;
insert into systems (id, name, position_xyz)
values ('sys-2', 'Alpha Centauri', '{"x":1,"y":0,"z":0}'::jsonb)
on conflict (id) do nothing;

-- fleets
insert into fleets (id, empire_id, system_id, stance, supply)
values ('fleet-1', 'emp-1', 'sys-1', 'neutral', 100)
on conflict (id) do nothing;

