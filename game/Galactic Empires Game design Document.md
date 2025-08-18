Galactic 4X Game – Game Design Document (GDD)

Working Title: Galactic Genisis
Genre: 4X Strategy in Space (persistent multiplayer)
Version: Draft v1.0

1. Core Systems
1.1 Galaxy Map

3D rotatable map, based on real star systems (Proxima, Vega, Sirius, etc.).

Scales: Galaxy → Star System → Planet.

Hex-based influence zones (abstracted, not visible to players, used for adjacency).

Exploration: Fog of war lifted by scout ships & sensors.

1.2 Empires

Start with 1 home system.

Government types (unlocked later): Republic, Corporate State, Hive, AI Collective.

Each has bonuses (+trade, +fleet cap, +growth).

1.3 Planets

Planet classes: Terran, Desert, Gas Giant, Ice, Volcanic.

Stats:

Population Cap

Habitability (%)

Resource Output (Food, Minerals, Energy, Research, Culture)

Improvements: Mines, Farms, Labs, Spaceports, Markets.

1.4 Resources

Food – supports population growth.

Minerals – construction of buildings/fleets.

Energy – fleet upkeep, starbase operation.

Research – unlocks tech.

Credits – universal currency.

Influence – for council votes, treaties.

Culture – unity projects, legacy.

Artifacts – rare, unique boosts.

1.5 Fleets

Units: Scout, Colony Ship, Destroyer, Cruiser, Battleship, Carrier, Titan.

Attributes: Attack, Defense, Speed, Fuel Range, Cargo Capacity.

Orders: Move, Patrol, Attack, Blockade, Escort.

Combat resolution: Server-side deterministic battle calc.

1.6 Tech Web

3 Axes:

Physics/Engineering – propulsion, weapons, shields, mining.

Biotech/Colonization – terraforming, genetics, medicine.

Society/Influence – diplomacy, espionage, unity.

120 nodes, branching, cross-links.

Unlock costs: 200 → 10,000 research points.

1.7 Trade System

Markets:

Local (planet), Regional (sector), Galactic (all players).

Prices fluctuate with supply/demand.

Trade Routes:

Auto-generated between colonies and hubs.

Can be raided by pirates/fleets.

Commercial Techs:

Banking → Interstellar Credits → Stock Markets.

Player interaction:

Buy/sell resources.

Contract deals (X minerals for Y research).

Black market (hidden, high risk/high reward).

1.8 Diplomacy & Council

Galactic Council:

Elect leader (Speaker).

Resolutions: trade embargo, shared research, peace pacts, sanctions.

Voting power = Influence + population + trade volume.

Alliances/Federations:

Shared defense.

Tech sharing.

Espionage:

Tech theft.

Sabotage fleets.

Propaganda campaigns.

1.9 Victory Conditions

Science: Complete Ascension Project.

Diplomacy: Win Unity Resolution vote.

Domination: Control 70% of core systems.

Economic: Dominate >50% of trade volume.

Unity: Build Eternal Fleet.

1.10 Legacy System

After game ends (or player eliminated):

Ruins remain on planets.

Artifacts may be found by new empires.

“Legends” recorded in galactic chronicle.

Meta reward: Achievements → unlock cosmetic empire symbols/skins.

2. Multiplayer & Backend
2.1 Turn System

Asynchronous turns.

Soft timer: 10 min → auto-resolve.

Players can queue multiple orders.

2.2 Player Count

Small Galaxy: 50 players.

Medium Galaxy: 200 players.

Large Galaxy: 500 players.

2.3 API (already drafted earlier)

Orders API – fleet moves, builds.

Market API – buy/sell.

Council API – proposals, votes.

Fleet API – position, battles.

Colony API – planet management.

3. UI/UX

Main screens:

Galaxy Map

System View

Colony Management

Tech Web

Market Screen

Council Chambers

HUD: Resources, Turn Timer, Notifications.

Chat: Player-to-player, alliance, council.

4. Technical Stack

Engine: Godot 4 (free, MIT license).

Language: GDScript (prototype), C# (production-ready).

Backend:

Prototype → Node.js (Express + Colyseus).

Production → Rust (Actix, Axum) for scaling.

Database: PostgreSQL (free, open source).

Hosting: Kubernetes clusters on any cloud (no vendor lock).

Networking: WebSockets for real-time fleet/trade updates.

AI Helpers: Augment Code in VS for rapid prototyping.

5. Balancing Guidelines (early values)

Colony Ship cost: 300 Minerals, 200 Energy.

Scout Ship cost: 100 Minerals, 50 Energy.

Research speed: ~1 tech per 10–20 turns early, scaling slower.

Trade fluctuation: ±15% per 10 turns depending on supply.

Influence regen: +1 per 100 population.

Fleet upkeep: 1 Energy per ship class tier.

6. Roadmap (detailed)

MVP (3–4 months): Exploration, Colonization, Fleets.

Alpha (6–8 months): Trade, Council, Tech Web v1.

Beta (12 months): Full Victory Conditions, Multiplayer (100 players).

Release (18 months): Legacy System, 500 players, expansions.