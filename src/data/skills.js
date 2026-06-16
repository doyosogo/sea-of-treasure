const xpPerLevel = Array.from({ length: 10 }, (_, index) => 500 * 2 ** index);

// Skill action definitions for active skill training.
export const skills = [
  {
    id: "navigation",
    name: "Navigation",
    description: "Produces navigation materials for future voyage upgrades.",
    actionName: "Chart Sea Route",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 50,
    actionTimeSeconds: 10,
    rewardType: "Navigation XP + Navigation Charts, rare Compass Fragments",
    unlockText: "Chart routes to gather navigation materials."
  },
  {
    id: "fishing",
    name: "Fishing",
    description: "Produces Fish and rare Whale Oil.",
    actionName: "Cast Nets",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 75,
    actionTimeSeconds: 15,
    rewardType: "Fishing XP + Fish, rare Whale Oil",
    unlockText: "Gather fish and rare whale oil for future crafting."
  },
  {
    id: "treasureHunting",
    name: "Treasure Hunting",
    description: "Produces relics and rare discoveries.",
    actionName: "Search Old Map",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 150,
    actionTimeSeconds: 30,
    rewardType: "Treasure XP + chance of gold burst",
    unlockText: "Advanced treasure digs produce relics and rare discoveries."
  },
  {
    id: "shipwright",
    name: "Shipwright",
    description: "Uses materials for upgrades.",
    actionName: "Repair Spare Parts",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 200,
    actionTimeSeconds: 25,
    rewardType: "Shipwright XP + gold",
    unlockText: "Repair work pays coin while improving Shipwright."
  },
  {
    id: "trading",
    name: "Trading",
    description: "Produces commercial materials.",
    actionName: "Run Small Trade Route",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 250,
    actionTimeSeconds: 35,
    rewardType: "Trading XP + gold, Trade Contracts, rare Trade Seals",
    unlockText: "Trade routes return gold, Trading experience, and commercial materials."
  },
  {
    id: "gunnery",
    name: "Gunnery",
    description: "Produces cannon upgrade materials.",
    actionName: "Target Practice",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 100,
    actionTimeSeconds: 20,
    rewardType: "Gunnery XP + Gunpowder, rare Cannon Parts",
    unlockText: "Practice gathers cannon materials for future upgrades."
  }
];
