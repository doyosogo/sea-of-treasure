// Ship-wide cannon quality tiers. Cannonballs are one shared resource.
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
    purchaseCost: 250,
    goldUpgradeCost: 0,
    materialUpgradeCost: null
  },
  {
    id: "steel",
    tier: 2,
    name: "Steel Cannon",
    damageMultiplier: 1.2,
    unlockLevel: 3,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 7500,
    goldUpgradeCost: 25000,
    materialUpgradeCost: {
      gold: 8000,
      gunpowder: 20,
      cannonParts: 5,
      navigationCharts: 5
    }
  },
  {
    id: "silver",
    tier: 3,
    name: "Silver Cannon",
    damageMultiplier: 1.4,
    unlockLevel: 6,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 35000,
    goldUpgradeCost: 150000,
    materialUpgradeCost: {
      gold: 40000,
      gunpowder: 80,
      cannonParts: 20,
      navigationCharts: 20,
      compassFragments: 5
    }
  },
  {
    id: "golden",
    tier: 4,
    name: "Golden Cannon",
    damageMultiplier: 1.6,
    unlockLevel: 9,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 150000,
    goldUpgradeCost: 750000,
    materialUpgradeCost: {
      gold: 180000,
      gunpowder: 250,
      cannonParts: 60,
      navigationCharts: 60,
      compassFragments: 15,
      ancientRelics: 10
    }
  },
  {
    id: "diamond",
    tier: 5,
    name: "Diamond Cannon",
    damageMultiplier: 2,
    unlockLevel: 12,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 650000,
    goldUpgradeCost: 3500000,
    materialUpgradeCost: {
      gold: 750000,
      gunpowder: 700,
      cannonParts: 150,
      navigationCharts: 150,
      compassFragments: 40,
      ancientRelics: 30,
      tradeSeals: 10
    }
  },
  {
    id: "leviathan",
    tier: 6,
    name: "Leviathan Cannon",
    damageMultiplier: 2.5,
    unlockLevel: 15,
    ballsPerBattle: 1,
    goldPer100Balls: 100,
    purchaseCost: 2500000,
    goldUpgradeCost: 25000000,
    materialUpgradeCost: {
      gold: 5000000,
      rareMapPieces: 10,
      gunpowder: 1500,
      cannonParts: 300,
      ancientRelics: 100,
      whaleOil: 100,
      tradeSeals: 25
    }
  }
];
