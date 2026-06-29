// Ship-wide cannon quality tiers. Ammo type is selected separately in combat.
export const BASE_CANNON_DAMAGE = 10;

export const cannons = [
  {
    id: "iron",
    tier: 1,
    name: "Iron Cannon",
    damageMultiplier: 1,
    unlockLevel: 1,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 700,
    goldUpgradeCost: 0,
    materialUpgradeCost: null
  },
  {
    id: "steel",
    tier: 2,
    name: "Steel Cannon",
    damageMultiplier: 1.2,
    unlockLevel: 5,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 2200,
    goldUpgradeCost: 12000,
    materialUpgradeCost: {
      gold: 2400,
      gunpowder: 16,
      cannonParts: 4,
      navigationCharts: 4
    }
  },
  {
    id: "silver",
    tier: 3,
    name: "Silver Cannon",
    damageMultiplier: 1.4,
    unlockLevel: 8,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 7000,
    goldUpgradeCost: 50000,
    materialUpgradeCost: {
      gold: 9000,
      gunpowder: 60,
      cannonParts: 15,
      navigationCharts: 15,
      compassFragments: 4
    }
  },
  {
    id: "golden",
    tier: 4,
    name: "Golden Cannon",
    damageMultiplier: 1.6,
    unlockLevel: 15,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 25000,
    goldUpgradeCost: 140000,
    materialUpgradeCost: {
      gold: 30000,
      gunpowder: 180,
      cannonParts: 45,
      navigationCharts: 45,
      compassFragments: 12,
      ancientRelics: 8
    }
  },
  {
    id: "diamond",
    tier: 5,
    name: "Diamond Cannon",
    damageMultiplier: 2,
    unlockLevel: 27,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 70000,
    goldUpgradeCost: 420000,
    materialUpgradeCost: {
      gold: 85000,
      gunpowder: 450,
      cannonParts: 110,
      navigationCharts: 110,
      compassFragments: 28,
      ancientRelics: 22,
      tradeSeals: 8
    }
  },
  {
    id: "leviathan",
    tier: 6,
    name: "Leviathan Cannon",
    damageMultiplier: 2.5,
    unlockLevel: 39,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 180000,
    goldUpgradeCost: 900000,
    materialUpgradeCost: {
      gold: 220000,
      rareMapPieces: 8,
      gunpowder: 900,
      cannonParts: 200,
      ancientRelics: 60,
      whaleOil: 60,
      tradeSeals: 18
    }
  }
];
