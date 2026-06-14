const xpPerLevel = Array.from({ length: 10 }, (_, index) => 500 * 2 ** index);

// Skill action definitions for active skill training.
export const skills = [
  {
    id: "navigation",
    name: "Navigation",
    description: "Read currents, stars, and wind to chart safer sea routes.",
    actionName: "Chart Sea Route",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 50,
    actionTimeSeconds: 10,
    rewardType: "Navigation XP",
    unlockText: "Chart routes to improve future voyage systems."
  },
  {
    id: "fishing",
    name: "Fishing",
    description: "Cast nets from the stern and sell the best of the catch.",
    actionName: "Cast Nets",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 75,
    actionTimeSeconds: 15,
    rewardType: "Fishing XP + small gold",
    unlockText: "Bring in a modest catch while training Fishing."
  },
  {
    id: "treasureHunting",
    name: "Treasure Hunting",
    description: "Study worn maps and chase rumors of buried coin.",
    actionName: "Search Old Map",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 150,
    actionTimeSeconds: 30,
    rewardType: "Treasure XP + chance of gold burst",
    unlockText: "Searches can reveal extra gold with a lucky find."
  },
  {
    id: "shipwright",
    name: "Shipwright",
    description: "Patch, plane, and refit spare parts into something useful.",
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
    description: "Move small cargo between safe harbours for profit.",
    actionName: "Run Small Trade Route",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 250,
    actionTimeSeconds: 35,
    rewardType: "Trading XP + gold",
    unlockText: "Trade routes return gold and Trading experience."
  },
  {
    id: "gunnery",
    name: "Gunnery",
    description: "Drill the crew on aim, timing, and calm reloads.",
    actionName: "Target Practice",
    maxLevel: 10,
    xpPerLevel,
    goldCostPerAction: 100,
    actionTimeSeconds: 20,
    rewardType: "Gunnery XP",
    unlockText: "Practice improves Gunnery for later combat systems."
  }
];
