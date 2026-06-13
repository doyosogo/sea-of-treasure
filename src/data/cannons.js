// Cannon tier definitions for combat, ammunition costs, and upgrades.
export const cannons = [
  {
    tier: 1,
    name: "Iron Ball",
    damage: 10,
    unlockLevel: 1,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    upgradeCostPerCannon: 0
  },
  {
    tier: 2,
    name: "Steel Shot",
    damage: 25,
    unlockLevel: 2,
    ballsPerBattle: 2,
    goldPer100Balls: 250,
    upgradeCostPerCannon: 7500
  },
  {
    tier: 3,
    name: "Chain Shot",
    damage: 55,
    unlockLevel: 4,
    ballsPerBattle: 3,
    goldPer100Balls: 600,
    upgradeCostPerCannon: 35000
  },
  {
    tier: 4,
    name: "Explosive Shell",
    damage: 120,
    unlockLevel: 7,
    ballsPerBattle: 4,
    goldPer100Balls: 1500,
    upgradeCostPerCannon: 150000
  },
  {
    tier: 5,
    name: "Hellfire Round",
    damage: 260,
    unlockLevel: 11,
    ballsPerBattle: 5,
    goldPer100Balls: 4000,
    upgradeCostPerCannon: 650000
  }
];
