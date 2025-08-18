# Space 4X Game – Gameplay Balancing Spreadsheet

This balancing spreadsheet defines **yields, costs, scaling rules, and victory thresholds** to make gameplay fair, deep, and replayable. It is designed for iteration during playtesting and integrates directly with the ERD systems.

---

## Core Yields & Resources

| Yield/Resource          | Source                                      | Typical Value/Turn | Notes                                  |
| ----------------------- | ------------------------------------------- | ------------------ | -------------------------------------- |
| **Credits**             | Trade routes, colonies                      | 10–50              | Universal currency, used for purchases |
| **Science**             | Colonies, research stations                 | 5–25               | Spent on tech tree advancement         |
| **Industry**            | Colonies (factories, shipyards)             | 8–40               | Spent on ships, buildings, wonders     |
| **Culture**             | Colonies, artifacts, councils               | 2–15               | Unlocks policies, affects legacy score |
| **Influence**           | Council votes, diplomacy                    | 1–10               | Bids for galactic council dominance    |
| **Strategic Resources** | Specific planets (e.g., antimatter, alloys) | 1–5                | Needed for advanced ships/tech         |

---

## Planet Improvement Costs

| Improvement     | Base Cost                | Scaling    | Yield Bonus             |
| --------------- | ------------------------ | ---------- | ----------------------- |
| Farm Domes      | 100 credits, 10 industry | +10%/level | +20 population capacity |
| Research Lab    | 200 credits, 20 industry | +15%/level | +15 science/turn        |
| Shipyard        | 300 credits, 30 industry | +20%/level | +20% ship build speed   |
| Cultural Center | 250 credits, 25 industry | +10%/level | +10 culture/turn        |
| Space Elevator  | 500 credits, 50 industry | +25%/level | +50 industry/turn       |

---

## Trade System Balancing

| Trade Element      | Rule                                    | Value           |
| ------------------ | --------------------------------------- | --------------- |
| **Market Spread**  | Commodity price variance                | ±15% dynamic    |
| **Route Income**   | Distance × stability factor             | 2–10 credits/LY |
| **Tariffs**        | % cut taken by dominant council faction | 5–20%           |
| **Smuggling Risk** | Chance to lose cargo if at war          | 5–25%           |

---

## Fleet Unit Balancing

| Ship Type  | Cost (Industry) | Attack | Defense | Speed | Special                    |
| ---------- | --------------- | ------ | ------- | ----- | -------------------------- |
| Scout      | 50              | 5      | 3       | 10    | Can scan systems           |
| Corvette   | 120             | 10     | 6       | 8     | Fast, light                |
| Destroyer  | 250             | 20     | 15      | 6     | Anti-scout & anti-corvette |
| Cruiser    | 500             | 40     | 30      | 5     | Backbone of fleets         |
| Battleship | 1000            | 80     | 60      | 4     | High upkeep                |
| Carrier    | 1200            | 20     | 50      | 3     | Launches fighters          |
| Titan      | 3000            | 200    | 150     | 2     | Empire-defining unit       |

---

## Victory Conditions (Default Thresholds)

| Condition           | Requirement                        | Example Value   |
| ------------------- | ---------------------------------- | --------------- |
| **Domination**      | Control % of habitable planets     | 60%             |
| **Scientific**      | Complete final tech in tree        | “Transcendence” |
| **Economic**        | Accumulate wealth                  | 100,000 credits |
| **Cultural/Legacy** | Accumulate culture points          | 50,000 culture  |
| **Council Victory** | Win X consecutive council sessions | 5 sessions      |

---

## Late Game Scaling Rules

* **Turn 250+ modifiers:**

  * +25% colony maintenance cost
  * +50% research costs (to slow runaway tech)
  * +10% higher trade yields (to reward diplomacy)
* **Post-Victory Play:**

  * Empire Legacy continues tracking
  * Artifacts unlock prestige paths (cosmetic + leaderboard)

---

✅ This spreadsheet is designed for iteration. Values should be tuned through alpha playtests.

Would you like me to now create a **Google Sheets / Excel template** preloaded with these tables so your playtesters can tweak values live and feed them back into the balancing model?
