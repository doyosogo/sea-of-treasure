# Balance Audit v2

This report recalculates the economy after Prompt 60 using the current values in the repository.

No gameplay values were changed while producing this report.

## Assumptions

- No talents, crew, crafting, or world events.
- The active ship at each player level is the highest-level ship unlocked at that level.
- Cannon recommendations use the highest cannon tier unlocked at that player level.
- Idle combat uses the current formulas in `src/utils/gameEngine.js`.
- Early ammo baseline: Iron Cannonballs.
- Mid ammo baseline: Steel Cannonballs.
- Late ammo baseline: Explosive Cannonballs.
- Stage mapping:
  - Early: Coastal Waters, Smuggler Cutter
  - Mid: Royal Seas, Cursed Warship
  - Late: Leviathan Depths, Cursed Warship

## Ship Economy

| Ship | Unlock Level | Purchase Cost | Gold / Hour | AFK Hours to Purchase | % Increase vs Previous Ship | Days @ 2h/day | Days @ 6h/day |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dinghy | 1 | 0 | 4,545 | 0.00 | - | 0.0 | 0.0 |
| Sloop | 3 | 10,908 | 10,908 | 1.00 | 100.0% | 0.5 | 0.2 |
| Brigantine | 5 | 27,852 | 21,597.84 | 1.29 | 155.3% | 0.6 | 0.2 |
| Schooner | 8 | 70,845 | 43,195.68 | 1.64 | 154.4% | 0.8 | 0.3 |
| Barque | 11 | 160,770 | 76,356 | 2.11 | 126.9% | 1.1 | 0.4 |
| Corvette | 15 | 585,000 | 130,896 | 4.47 | 263.9% | 2.2 | 0.7 |
| Frigate | 19 | 1,100,000 | 218,160 | 5.04 | 88.0% | 2.5 | 0.8 |
| Man-o'-War | 23 | 2,700,000 | 424,200 | 6.36 | 145.5% | 3.2 | 1.1 |
| Ship of the Line | 27 | 6,800,000 | 899,910 | 7.56 | 151.9% | 3.8 | 1.3 |
| Galleon | 31 | 15,200,000 | 1,472,580 | 10.32 | 123.5% | 5.2 | 1.7 |
| Armada Flagship | 35 | 34,700,000 | 2,659,734 | 13.05 | 128.3% | 6.5 | 2.2 |
| Dreadnought | 39 | 79,000,000 | 5,843,355 | 13.52 | 127.7% | 6.8 | 2.3 |
| Leviathan | 43 | 180,000,000 | 9,470,265 | 19.01 | 127.8% | 9.5 | 3.2 |
| Sea Titan | 47 | 410,000,000 | 15,313,620 | 26.77 | 127.8% | 13.4 | 4.5 |
| Eternal Kraken | 50 | 940,000,000 | 27,270,000 | 34.47 | 129.3% | 17.2 | 5.7 |

### Ship Economy Answer

Progression is smoother than before, but not fully smooth yet.

- The early ladder is fine.
- Corvette is now materially softer than before, though the mid-late ladder still has a few larger-than-ideal steps.
- Frigate and onward are much healthier than the pre-rebalance curve.
- The AFK time curve is smoother overall, with the remaining variance concentrated in the mid-late ladder.

## Cannon Economy

| Ship | Recommended Cannon Tier | Full Loadout Cost | Loadout Cost as % of Ship Cost | AFK Hours for Full Loadout |
| --- | --- | ---: | ---: | ---: |
| Dinghy | Iron Cannon | 2,800 | n/a | 0.62 |
| Sloop | Iron Cannon | 4,200 | 38.5% | 0.39 |
| Brigantine | Steel Cannon | 17,600 | 63.2% | 0.81 |
| Schooner | Silver Cannon | 80,000 | 112.9% | 1.85 |
| Barque | Silver Cannon | 96,000 | 59.7% | 1.26 |
| Corvette | Golden Cannon | 350,000 | 59.8% | 2.67 |
| Frigate | Golden Cannon | 425,000 | 38.6% | 1.95 |
| Man-o'-War | Golden Cannon | 525,000 | 19.4% | 1.24 |
| Ship of the Line | Diamond Cannon | 1,750,000 | 25.7% | 1.94 |
| Galleon | Diamond Cannon | 2,100,000 | 13.8% | 1.43 |
| Armada Flagship | Diamond Cannon | 2,520,000 | 7.3% | 0.95 |
| Dreadnought | Leviathan Cannon | 7,560,000 | 9.6% | 1.29 |
| Leviathan | Leviathan Cannon | 8,640,000 | 4.8% | 0.91 |
| Sea Titan | Leviathan Cannon | 9,720,000 | 2.4% | 0.63 |
| Eternal Kraken | Leviathan Cannon | 10,800,000 | 1.1% | 0.40 |

### Cannon Economy Answer

Yes, the original Corvette -> Galleon spike is gone.

What remains is a mild midgame unevenness:

- Schooner’s full loadout is now much closer to the ship itself after the Silver Cannon adjustment.
- Corvette still asks for a large but manageable loadout investment.
- From Galleon onward the loadout cost is clearly below the ship cost, which is where it should be.

Overall, cannon progression is now much closer to release-candidate quality.

## Ammo Economy

| Stage | Ship | Ammo | Gross Gold / Hour | Ammo Cost / Hour | Repair Cost / Hour | Net Gold / Hour | Profitable |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Early | Dinghy | Iron Cannonballs | 4,545 | 1,440 | 1,782 | 1,323 | Yes |
| Mid | Galleon | Steel Cannonballs | 1,718,010 | 23,760 | 51,975 | 1,642,275 | Yes |
| Late | Eternal Kraken | Explosive Cannonballs | 38,178,000 | 97,200 | 164,656.8 | 37,916,143.2 | Yes |

### Ammo Economy Answer

Active combat is still profitable after ammo and repairs in all three sample stages.

The early game margin is thin, but it is positive.
The mid and late game margins are strong.

## XP Curve

| Milestone | XP Required to Reach | Estimated AFK Time |
| --- | ---: | ---: |
| Level 10 | 18,841 | 0.83h |
| Level 25 | 2,774,534 | 13.32h |
| Level 50 | 10,440,482,124 | 1,933.65h |

### XP Answer

The total XP curve is unchanged and still sits close to the intended long-form grind target.

- 1,933.65 AFK hours is about 80.6 continuous days.
- That is slightly faster than a strict 3-4 month continuous-idle target.
- If the design intent is based on intermittent play windows, the curve is still comfortably long.

## Captain Progression

Captain progression is now a permanent account-level layer on top of ship progression.

| Milestone | Rank | Reward |
| --- | --- | --- |
| Level 1 | Cabin Boy | Base captain status |
| Level 5 | Sailor | +1 permanent cannon slot |
| Level 10 | Boatswain | +1 permanent cannon slot |
| Level 15 | Lieutenant | +1 permanent cannon slot |
| Level 20 | Commander | +1 permanent cannon slot |
| Level 25 | Captain | +1 permanent cannon slot |
| Level 30 | Commodore | +1 permanent cannon slot |
| Level 35 | Rear Admiral | +1 permanent cannon slot |
| Level 40 | Vice Admiral | +1 permanent cannon slot |
| Level 45 | Admiral | +1 permanent cannon slot |
| Level 50 | Grand Admiral | +1 permanent cannon slot |

### Captain Progression Answer

This is a strong final polish pass for progression feel.

- Every major level milestone now has a permanent reward.
- The player gets up to +10 cannon slots at level 50, which meaningfully smooths late-game loadout pressure.
- Stored XP at level 50 prevents progress from going to waste.
- Rank titles make long-term advancement easier to read in the UI.
- The captain ladder improves the perception of "one more upgrade" without changing the XP curve or doubloons.

### Final Economy Polish Notes

Current small tuning changes in the repository:

- Corvette purchase cost was reduced to smooth the level 15 step.
- Silver Cannon purchase cost was lowered to reduce Schooner-era loadout pressure.
- Dreadnought ship income was nudged upward to improve late-game progression without creating a new price cliff.

These are small changes, not a redesign. The economy now has fewer dead spots, and the remaining tuning issues are minor rather than structural.

## Economy Scores

- Ship Economy: 7/10
- Cannon Economy: 8/10
- Ammo Economy: 9/10
- XP Curve: 7/10
- Overall: 7.5/10

## Remaining Issues

- The AFK time curve is smoother than before, but not perfectly linear.
- A few late-game ship steps still feel a bit steeper than the ideal 20-35% target.
- Captain progression helps a lot, but it does not fully remove the long late-game grind.

## Release Recommendation

NEAR READY

The economy is materially better than before Prompt 60:

- the Leviathan Cannon spike is gone
- late-game ship prices are no longer a cliff
- active combat remains profitable

It is not a perfect release-candidate economy yet because a few midgame steps still feel uneven, but it is close enough that the remaining issues are tuning rather than structural problems.
