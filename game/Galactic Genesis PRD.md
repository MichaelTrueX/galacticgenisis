Galactic 4X Game – PRD (Product Requirements Document)

Working Title: Galactic Genisis (placeholder)
Genre: 4X Strategy (Explore, Expand, Exploit, Exterminate) in Space
Platforms: PC (Windows/Linux/Mac) → later console
Target Audience: Fans of Civilization, Stellaris, Endless Space, competitive strategy players, MMO explorers
Business Model: Buy-to-play OR Free-to-play with cosmetics/expansions. No pay-to-win.

1. Game Vision

A persistent, multiplayer 4X space strategy game where empires expand across real star systems, develop advanced technology, manage trade, and influence galactic councils. Unlike classic Civ-style games, this continues beyond victory conditions with a Legacy System (empire persistence across sessions).

2. Core Gameplay Loop

Explore – Discover new star systems, planets, resources, artifacts.

Expand – Colonize planets, build stations, establish trade routes.

Exploit – Manage resources, markets, yields, and fleets.

Exterminate – War, blockades, and sabotage.

Persist – Win or lose, your empire leaves a legacy (ruins, artifacts, chronicles) influencing future games.

3. Key Features

3D Galactic Map (rotatable, scalable) with real star names (Proxima Centauri, Vega, Sirius, etc.).

Multiplayer scale: Supports 50 → 500 players per galaxy.

Trade System: Dynamic markets, resource exchanges, empire credit economy.

Council Politics: Galactic votes (sanctions, tech sharing, trade pacts, victory resolutions).

Tech Web: Non-linear, 3 branches (Physics/Engineering, Biotech/Colonization, Society/Influence).

Victory Conditions: Science, Diplomacy, Domination, Economic, Unity.

Legacy Dimension: Artifacts, monuments, ruins remain after empires fall.

4. Resources & Yields

Energy (power, fleet upkeep).

Minerals (construction).

Food (population).

Research (unlock tech).

Credits (currency for trade, bribes, markets).

Influence (diplomacy, council).

Culture (unity projects, legacy strength).

Artifacts (unique relics, endgame boosts).

5. Victory & Replayability

Science Victory: Complete Ascension Project.

Diplomatic Victory: Pass Unity Resolution in council.

Domination Victory: Control 70% of core systems.

Economic Victory: Dominate >50% of trade volume.

Unity Victory: Complete Eternal Fleet.

Post-victory gameplay:

Game continues with legacy effects.

New players can join ongoing galaxies.

Leaderboards + chronicles (historical meta).

6. Multiplayer & Social

Asynchronous turns (like Civ, but with soft timers).

Real-time fleet movement + trade execution.

WebSocket channels:

Orders, Fleets, Market, Council, Diplomacy.

Alliances: federations, trade leagues.

Player chat + council chambers.

7. Monetization (no license costs)

Free software stack (Godot, Node.js/Rust, Postgres).

Cosmetic packs: ship skins, UI themes.

Expansions: new galaxies, alien species, advanced tech trees.

No microtransaction pay-to-win.

8. Technical Requirements

Engine: Godot 4 (C#/GDScript).

Backend: Node.js (prototype) → Rust/Go (production).

Database: PostgreSQL (open source).

Multiplayer: Colyseus or custom WebSocket.

Infra: Docker, Kubernetes (cloud portable).

Cost: No licensing fees.

9. Development Roadmap
Phase 1: Prototype (0–6 months)

Core loop: explore, colonize, fleet orders.

Single galaxy, 20 players.

Tech web basic (10 nodes).

Phase 2: Multiplayer Core (6–12 months)

Trade + markets.

Council votes.

100+ tech nodes.

50–100 players.

Phase 3: Persistence (12–18 months)

Legacy system.

Artifacts + chronicles.

250+ turns support.

200–500 players.

Phase 4: Live Ops & Expansions (18+ months)

Cosmetics.

Advanced diplomacy.

Expansion galaxies.

10. Risks & Mitigations

Scalability: Use microservices early (Node → Rust).

Monetization backlash: No P2W, only cosmetics.

Complexity creep: Stick to phased roadmap.

Licensing risk: Only use MIT/BSD/Apache licensed tech.