// Cannon tier definitions for combat, ammunition costs, and upgrades.
export const cannons = [
  {
    tier: 1,
    name: "Iron Cannon",
    damage: 10,
    unlockLevel: 1,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    upgradeCostPerCannon: 0
  },
  {
    tier: 2,
    name: "Steel Cannon",
    damage: 25,
    unlockLevel: 2,
    ballsPerBattle: 2,
    goldPer100Balls: 250,
    upgradeCostPerCannon: 7500
  },
  {
    tier: 3,
    name: "Silver Cannon",
    damage: 55,
    unlockLevel: 4,
    ballsPerBattle: 3,
    goldPer100Balls: 600,
    upgradeCostPerCannon: 35000
  },
  {
    tier: 4,
    name: "Golden Cannon",
    damage: 120,
    unlockLevel: 7,
    ballsPerBattle: 4,
    goldPer100Balls: 1500,
    upgradeCostPerCannon: 150000
  },
  {
    tier: 5,
    name: "Diamond Cannon",
    damage: 260,
    unlockLevel: 11,
    ballsPerBattle: 5,
    goldPer100Balls: 4000,
    upgradeCostPerCannon: 650000
  }
];
