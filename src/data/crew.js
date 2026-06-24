// Crew roles for long-term passive progression.
export const crewMembers = [
  {
    id: "navigator",
    name: "Navigator",
    role: "Navigator",
    description: "Charts the course and improves combat experience gains.",
    maxLevel: 10,
    upgradeCostBase: 1500,
    bonusType: "combatXpMultiplier",
    bonusPerLevel: 0.01
  },
  {
    id: "gunner",
    name: "Gunner",
    role: "Gunner",
    description: "Keeps the guns firing and improves volley damage.",
    maxLevel: 10,
    upgradeCostBase: 1800,
    bonusType: "volleyDamageMultiplier",
    bonusPerLevel: 0.01
  },
  {
    id: "carpenter",
    name: "Carpenter",
    role: "Carpenter",
    description: "Repairs the hull faster and reduces repair costs.",
    maxLevel: 10,
    upgradeCostBase: 1200,
    bonusType: "repairCostMultiplier",
    bonusPerLevel: -0.01
  },
  {
    id: "quartermaster",
    name: "Quartermaster",
    role: "Quartermaster",
    description: "Manages plunder and increases combat gold.",
    maxLevel: 10,
    upgradeCostBase: 2000,
    bonusType: "combatGoldMultiplier",
    bonusPerLevel: 0.01
  },
  {
    id: "merchant",
    name: "Merchant",
    role: "Merchant",
    description: "Negotiates better deals on all trade sales.",
    maxLevel: 10,
    upgradeCostBase: 2500,
    bonusType: "tradeSellMultiplier",
    bonusPerLevel: 0.01
  },
  {
    id: "treasureHunter",
    name: "Treasure Hunter",
    role: "Treasure Hunter",
    description: "Sniffs out hidden maps and rare discoveries.",
    maxLevel: 10,
    upgradeCostBase: 3000,
    bonusType: "treasureChanceMultiplier",
    bonusPerLevel: 0.01
  }
];

export const crew = crewMembers;
