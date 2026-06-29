# Balance Audit Report

This report is based on the current data and formulas in:

- `src/data/ships.js`
- `src/data/cannons.js`
- `src/data/ammunition.js`
- `src/data/regions.js`
- `src/data/levels.js`
- `src/data/balance.js`
- `src/utils/gameEngine.js`

No gameplay values were changed while producing this report.

## Assumptions

- No talents, crew, crafting, or world events.
- Ship income uses the highest cannon tier unlocked at that ship level, with the ship fully filled to capacity.
- Ship income uses `Iron Cannonballs` as the baseline ammo for the ship table.
- Region and enemy bands were mapped like this:
  - Levels 1-4: Coastal Waters, Smuggler Cutter
  - Levels 5-9: Merchant Routes, Raider Brig
  - Levels 10-19: Pirate Frontier, Naval Frigate
  - Levels 20-34: Royal Seas, Cursed Warship
  - Levels 35-49: Cursed Ocean, Cursed Warship
  - Level 50: Leviathan Depths, Cursed Warship
- The ammo economy section uses representative early, mid, and late stages:
  - Early: Dinghy, Iron ammo, Coastal Waters
  - Mid: Galleon, Steel ammo, Royal Seas
  - Late: Eternal Kraken, Explosive ammo, Leviathan Depths
- Time estimates are AFK idle hours, then converted to calendar days at 2h/day and 6h/day where requested.

## Ship Economy

The gold/hour estimates below are baseline idle combat values under the assumptions above.

| Ship | Unlock Level | Purchase Cost | Gold / Hour | AFK Hours to Buy | Days @ 2h/day | Days @ 6h/day | Read |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Dinghy | 1 | 0 | 4,545 | 0.0 | 0.0 | 0.0 | Too cheap |
| Sloop | 3 | 8,000 | 10,908 | 0.7 | 0.4 | 0.1 | Too cheap |
| Brigantine | 5 | 35,000 | 21,598 | 1.6 | 0.8 | 0.3 | Too cheap |
| Schooner | 8 | 150,000 | 43,196 | 3.5 | 1.7 | 0.6 | Fair |
| Barque | 11 | 500,000 | 76,356 | 5.2 | 2.6 | 0.9 | Fair |
| Corvette | 15 | 1,500,000 | 218,160 | 6.9 | 3.4 | 1.1 | Fair |
| Frigate | 19 | 4,000,000 | 272,700 | 11.0 | 5.5 | 1.8 | Expensive |
| Man-o'-War | 23 | 10,000,000 | 636,300 | 13.1 | 6.5 | 2.2 | Expensive |
| Ship of the Line | 27 | 25,000,000 | 1,049,895 | 19.8 | 9.9 | 3.3 | Expensive |
| Galleon | 31 | 65,000,000 | 2,061,612 | 31.5 | 15.8 | 5.3 | Too expensive |
| Armada Flagship | 35 | 160,000,000 | 3,546,312 | 30.1 | 15.0 | 5.0 | Too expensive |
| Dreadnought | 39 | 400,000,000 | 5,843,355 | 45.6 | 22.8 | 7.6 | Too expensive |
| Leviathan | 43 | 950,000,000 | 9,470,265 | 66.9 | 33.4 | 11.1 | Too expensive |
| Sea Titan | 47 | 2,200,000,000 | 15,313,620 | 95.8 | 47.9 | 16.0 | Too expensive |
| Eternal Kraken | 50 | 5,000,000,000 | 27,270,000 | 131.0 | 65.5 | 21.8 | Too expensive |

### Ship Economy Notes

- The first three ship upgrades are effectively immediate or near-immediate.
- Schooner through Corvette feel healthy and readable.
- Frigate starts the first real grind.
- Galleon and everything after it becomes a major wall if the player is buying ships one by one through AFK income.
- The late ships are not impossible, but they are far beyond the cost of a casual session.

## Cannon Economy

The loadout cost below is the cost to fill the ship's full cannon capacity with the best cannon tier available at that level.

| Ship | Best Cannon Tier | Full Loadout Cost | AFK Hours to Buy Loadout | Read |
| --- | --- | ---: | ---: | --- |
| Dinghy | Iron Cannon | 1,000 | 0.2 | Too cheap |
| Sloop | Steel Cannon | 45,000 | 4.1 | Fair |
| Brigantine | Steel Cannon | 60,000 | 2.8 | Fair |
| Schooner | Silver Cannon | 350,000 | 8.1 | Expensive |
| Barque | Golden Cannon | 1,800,000 | 23.6 | Expensive |
| Corvette | Leviathan Cannon | 35,000,000 | 160.4 | Too expensive |
| Frigate | Leviathan Cannon | 42,500,000 | 155.8 | Too expensive |
| Man-o'-War | Leviathan Cannon | 52,500,000 | 82.5 | Too expensive |
| Ship of the Line | Leviathan Cannon | 62,500,000 | 59.5 | Too expensive |
| Galleon | Leviathan Cannon | 75,000,000 | 36.4 | Too expensive |
| Armada Flagship | Leviathan Cannon | 90,000,000 | 25.4 | Too expensive |
| Dreadnought | Leviathan Cannon | 105,000,000 | 18.0 | Expensive |
| Leviathan | Leviathan Cannon | 120,000,000 | 12.7 | Expensive |
| Sea Titan | Leviathan Cannon | 135,000,000 | 8.8 | Fair |
| Eternal Kraken | Leviathan Cannon | 150,000,000 | 5.5 | Fair |

### Cannon Economy Notes

- The first meaningful loadout spike happens at Schooner, then again at Barque.
- The biggest wall is the first Leviathan Cannon window, especially Corvette through Galleon.
- Once the late-game ship income catches up, the loadout cost becomes manageable again.
- Cannon progression feels spiky rather than smooth, but it is still readable and not a softlock.

## Ammo Economy

| Ammo | Cost per 100 |
| --- | ---: |
| Iron Cannonballs | 100 |
| Steel Cannonballs | 220 |
| Explosive Cannonballs | 450 |

| Stage | Ship | Ammo | Gross Gold / Hour | Ammo Cost / Hour | Repair Cost / Hour | Net After Ammo + Repairs | Result |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Early | Dinghy | Iron | 4,545 | 1,440 | 1,782 | 1,323 | Profitable |
| Mid | Galleon | Steel | 2,061,612 | 23,760 | 62,370 | 1,975,482 | Profitable |
| Late | Eternal Kraken | Explosive | 38,178,000 | 97,200 | 164,657 | 37,916,143 | Profitable |

### Ammo Economy Notes

- Active combat is profitable in all three sample stages after ammo and repair costs.
- Early combat has the thinnest margin, so mistakes matter.
- Mid and late combat produce very large positive margins, so ammo does not currently block active play.
- Iron is the cheapest ammo to run, but the stronger ammo tiers still pay for themselves through faster combat.

## Progression

| Milestone | Total XP Required | Estimated AFK Time | Notes |
| --- | ---: | ---: | --- |
| Level 10 | 18,841 | 0.7h | Effectively instant |
| Level 25 | 2,774,534 | 9.8h | A short midgame climb |
| Level 50 | 10,440,482,124 | 1,881.6h | About 78.4 continuous days |

### Progression Notes

- Under the iron-baseline model, the current XP curve reaches level 50 in about 1,882 idle hours.
- That is faster than a 3-4 month continuous-idle target, but only by a modest margin.
- Converted to calendar time, the same number becomes about 940.8 days at 2h/day or 313.6 days at 6h/day, so the target is not well-defined unless you specify whether you mean continuous idle hours or daily play windows.

## Recommendations

- The ship curve is front-loaded too gently and back-loaded too hard. The first three upgrades are almost free, while Galleon and everything after it becomes a steep wall.
- The cannon curve has the same problem. The Corvette through Galleon window is the roughest part of the economy.
- Late-game ship prices and late-game cannon loadouts do not align cleanly. A player who reaches the late game can afford to progress, but the journey there is uneven.
- If the release target is truly 3-4 months of continuous idle time, the current XP curve is slightly too fast. Add roughly 15% more late-game XP demand to reach the low end of that target, or closer to 50% if you want the high end.
- If the release target means a few hours of AFK per day, the current curve is far too slow and needs a much larger rework.
- The early game is not the problem. The tuning problem sits in the mid-to-late ship ladder and the Leviathan Cannon unlock window.
- Softlock risk is low. The bigger risk is a grind wall that feels abrupt rather than rewarding.

## Verdict

The economy is functional, but it is not release-candidate clean yet. The progression model is understandable and the active combat economy is profitable, but ship pricing, cannon pricing, and the level 35-50 pacing all need one more balancing pass before launch.

## Release Candidate Balance

This section compares the original audit against the release-candidate rebalance.

### Ship Progression

| Ship | Before AFK Hours to Buy | After AFK Hours to Buy | Change |
| --- | ---: | ---: | --- |
| Sloop | 0.7 | 1.0 | Smoother, slightly slower |
| Brigantine | 1.6 | 1.3 | Still early, but no cliff |
| Schooner | 3.5 | 1.6 | Earlier than before |
| Barque | 5.2 | 2.1 | Much cheaper |
| Corvette | 6.9 | 4.5 | Large improvement |
| Frigate | 11.0 | 5.0 | Large improvement |
| Man-o'-War | 13.1 | 6.4 | Large improvement |
| Ship of the Line | 19.8 | 7.6 | Large improvement |
| Galleon | 31.5 | 10.3 | Large improvement |
| Armada Flagship | 30.1 | 13.0 | Large improvement |
| Dreadnought | 45.6 | 13.5 | Large improvement |
| Leviathan | 66.9 | 19.0 | Large improvement |
| Sea Titan | 95.8 | 26.8 | Large improvement |
| Eternal Kraken | 131.0 | 34.5 | Large improvement |

### Cannon Progression

| Tier | Before Unlock | After Unlock | Before Purchase Cost | After Purchase Cost |
| --- | ---: | ---: | ---: | ---: |
| Iron | 1 | 1 | 250 | 700 |
| Steel | 3 | 5 | 7,500 | 2,200 |
| Silver | 6 | 8 | 35,000 | 8,000 |
| Golden | 9 | 15 | 150,000 | 25,000 |
| Diamond | 12 | 27 | 650,000 | 70,000 |
| Leviathan | 15 | 39 | 2,500,000 | 180,000 |

### Release Candidate Read

- The most important fix landed: Leviathan cannons are no longer available halfway through the ship ladder.
- Ship prices are now far less cliffy in the late game.
- The remaining issue is that the cannon loadout curve is still a little uneven in the midgame, especially around Schooner through Corvette.
- The economy is closer to release candidate quality, but I would still call it "mostly ready, needs one more tuning pass" rather than fully locked.

### Remaining Concerns

- Brigantine and Schooner are still a little too close together in practice.
- Cannon pricing around the Silver and Golden tiers is still the least elegant part of the model.
- The late game no longer has the giant wall it had before, but the climb is still abrupt in a few places.
- XP remains intentionally unchanged, so level 50 is still a long-term goal rather than a quick unlock.
