# Captain Progression Regression Audit

This report verifies the captain progression system added in Prompt 61.

No gameplay values were changed for this audit.

## Captain Rank Verification

| Player Level | Rank |
| --- | --- |
| 1 | Cabin Boy |
| 5 | Sailor |
| 10 | Boatswain |
| 15 | Lieutenant |
| 20 | Commander |
| 25 | Captain |
| 30 | Commodore |
| 35 | Rear Admiral |
| 40 | Vice Admiral |
| 45 | Admiral |
| 50 | Grand Admiral |

Verification result: correct.

## Permanent Cannon Slot Bonuses

| Player Level | Permanent Cannon Slot Bonus |
| --- | ---: |
| 1 | +0 |
| 5 | +1 |
| 10 | +2 |
| 15 | +3 |
| 20 | +4 |
| 25 | +5 |
| 30 | +6 |
| 35 | +7 |
| 40 | +8 |
| 45 | +9 |
| 50 | +10 |

Verification result: correct.

## Capacity Calculations

Representative ship capacity totals use:

- base cannon slots from the ship definition
- captain bonus slots from captain progression
- total capacity = base slots + captain bonus slots

| Ship | Base Cannon Slots | Captain Bonus at Lv. 1 | Total at Lv. 1 | Captain Bonus at Lv. 25 | Total at Lv. 25 | Captain Bonus at Lv. 50 | Total at Lv. 50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dinghy | 4 | 0 | 4 | 5 | 9 | 10 | 14 |
| Corvette | 14 | 0 | 14 | 5 | 19 | 10 | 24 |
| Frigate | 17 | 0 | 17 | 5 | 22 | 10 | 27 |
| Galleon | 30 | 0 | 30 | 5 | 35 | 10 | 40 |
| Dreadnought | 42 | 0 | 42 | 5 | 47 | 10 | 52 |
| Eternal Kraken | 60 | 0 | 60 | 5 | 65 | 10 | 70 |

Verification result: correct.

## Combat And Loadout Integration

The same total cannon capacity is used by the shared capacity helper and the systems that depend on it:

- My Ship
- Shop
- Battle loadout display
- active combat loadout checks
- idle combat loadout checks
- offline combat loadout checks
- cannon equip / unequip validation

Implementation check:

- `getCannonCapacity(gameState)` now returns ship base capacity plus captain bonus slots.
- `getEquippedCapacityRemaining(state)` uses that shared helper.
- Loadout screens read the same helper instead of separate capacity formulas.
- Battle, idle, and offline combat all operate on the equipped loadout that is constrained by that shared capacity.

Verification result: correct.

## Stored XP Verification

Observed behavior:

- Player level cannot exceed 50.
- XP still accumulates after level 50.
- Extra XP is stored in `storedExperience`.
- Profile displays `Stored XP`.
- Old saves normalize safely:
  - missing captain fields are derived from current level
  - captain promotion history is reconstructed safely
  - stored XP defaults to a safe non-negative value

Implementation check:

- `applyXp()` now adds excess XP to `storedExperience` when the player is at max level.
- `normalizeRuntimeState()` and the alternate save load path both normalize `captainProgression` and `storedExperience`.
- Profile reads and displays `storedExperience`.

Verification result: correct.

## Economy Impact Of Captain Slots

The +10 permanent cannon slots at level 50 change late-game pacing in three useful ways:

- Ammo consumption rises because larger loadouts can fire more cannons per volley.
- Total damage rises because more equipped cannons translate directly into higher volley damage.
- Cannon purchasing goals become longer-lived because each ship can meaningfully scale with more mounted cannons before the next ship upgrade.

Net effect:

- early and midgame progression feels less cramped
- late-game ships feel like a real expansion instead of only a hull upgrade
- the captain ladder gives a permanent reason to keep leveling after ship unlocks slow down

## Audit Conclusion

Captain progression is working correctly in the current codebase.

No regression was found in the rank ladder, slot bonuses, capacity calculation, or stored XP handling.

## Validation

- `npm run build` passed.
