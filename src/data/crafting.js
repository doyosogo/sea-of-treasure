export const craftableUpgrades = [
  {
    id: "reinforcedHull",
    name: "Reinforced Hull",
    maxLevel: 10,
    effect: "+2% max hull per level.",
    goldCostPerLevel: 500,
    fishCostPerLevel: 20,
    whaleOilCostPerLevel: 2,
    shipwrightXpPerLevel: 120
  },
  {
    id: "speedSails",
    name: "Speed Sails",
    maxLevel: 10,
    effect: "+2% ships sunk per hour per level.",
    goldCostPerLevel: 750,
    fishCostPerLevel: 30,
    whaleOilCostPerLevel: 3,
    shipwrightXpPerLevel: 150
  },
  {
    id: "cannonBraces",
    name: "Cannon Braces",
    maxLevel: 10,
    effect: "-2% cannonball usage pressure per level.",
    goldCostPerLevel: 1000,
    fishCostPerLevel: 40,
    whaleOilCostPerLevel: 4,
    shipwrightXpPerLevel: 180
  }
];
