# Space 4X Game – UI Wireframes Document

This document provides the **initial wireframe sketches and UX flows** for the Space 4X game. It translates gameplay systems (economy, fleets, diplomacy, trade) into visual user interfaces suitable for both prototype and production builds. All designs assume a **3D hex-free star map** with system nodes, expandable menus, and modular panels.

---

## 1. Main Screen (Galaxy View)

* **Center:** 3D galactic map with zoom/rotate.
* **Top Bar:** Resources (credits, science, industry, culture, influence, strategic).
* **Left Sidebar:** Empire panel (colonies, fleets, council influence).
* **Right Sidebar:** Contextual actions (system details, fleet commands).
* **Bottom Bar:** Turn controls (End Turn, Notifications, Messages).

---

## 2. Star System Detail View

* **Top:** System name + discovery status.
* **Left:** Planet list (with icons: habitable, resource-rich, barren).
* **Center:** 3D orbital map (zoomable, shows colonies/fleets).
* **Right:** Construction panel:

  * Planet improvements (with cost & yields).
  * Colony stats (population, happiness, defense).
* **Bottom:** Trade routes originating/terminating here.

---

## 3. Fleet Command View

* **Top:** Selected fleet info (ships, admiral, upkeep).
* **Left:** Fleet roster by ship type.
* **Center:** 3D tactical mini-map (neighbor systems, jump routes).
* **Right:** Orders panel:

  * Move, Patrol, Escort, Trade Protection.
  * Battle simulation preview.
* **Bottom:** Quick actions (Split fleet, Merge fleet, Upgrade ships).

---

## 4. Trade & Market Screen

* **Top Tabs:** Domestic Market | Galactic Market | Trade Routes.
* **Left:** Active trade routes list.
* **Center:** Commodity prices table (sortable, real-time updates).
* **Right:** Buy/Sell panel:

  * Resource selector.
  * Amount.
  * Preview price + tariff + smuggling risk.
* **Bottom:** Diplomatic trade offers from other players.

---

## 5. Galactic Council (Multiplayer Politics)

* **Top:** Session countdown timer.
* **Left:** Player factions & influence totals.
* **Center:** Proposal being voted on.
* **Right:** Vote buttons (Yes, No, Abstain) + bribe/influence slider.
* **Bottom:** History of past resolutions + council standing.

---

## 6. Technology Web

* **Main:** Interactive tech web (nodes, links, zoom/pan).
* **Left:** Current research queue.
* **Right:** Tech detail panel:

  * Description.
  * Prerequisites.
  * Unlocks (units, improvements, policies).
* **Bottom:** Research speed modifiers summary.

---

## 7. Multiplayer Lobby & Meta Layer

* **Lobby Screen:**

  * Player list with factions/colors.
  * Game settings (map size, turn timer, victory conditions).
  * Chat window.
* **Post-Victory Mode:**

  * Leaderboard panel.
  * Legacy stats (cultural wonders, artifacts, fleet kills).
  * Continue empire option (sandbox mode).

---

## UX Principles

1. **Consistency:** Shared panel layout (Left = overview, Center = map/visuals, Right = actions).
2. **Scalability:** Panels collapse/expand for large monitors or compact laptops.
3. **Multiplayer-first:** Clear feedback on what other players are doing (trade, council, wars).
4. **Modular:** UI built as React components, easy to swap visuals without breaking logic.

---

✅ Next step: Convert these wireframes into **Figma prototypes** (with mock flows) or implement a **React + Tailwind component library** for Augment Code to scaffold.
