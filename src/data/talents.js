// Talent tree definitions for permanent account bonuses.
export const talentTrees = [
  { id: "firepower", name: "Firepower" },
  { id: "seamanship", name: "Seamanship" },
  { id: "fortune", name: "Fortune" }
];

export const talents = [
  {
    id: "hairTrigger",
    tree: "firepower",
    name: "Hair Trigger",
    tier: 1,
    maxPoints: 10,
    description: "-1.5% reload time per point.",
    bonusType: "reloadMultiplier",
    bonusPerPoint: -0.015,
    requires: []
  },
  {
    id: "powderKegs",
    tree: "firepower",
    name: "Powder Kegs",
    tier: 1,
    maxPoints: 10,
    description: "+2% cannon damage per point.",
    bonusType: "cannonDamageMultiplier",
    bonusPerPoint: 0.02,
    requires: []
  },
  {
    id: "deadEye",
    tree: "firepower",
    name: "Dead Eye",
    tier: 2,
    maxPoints: 10,
    description: "+1% crit chance per point.",
    bonusType: "critChance",
    bonusPerPoint: 0.01,
    requires: [{ id: "hairTrigger", points: 4 }]
  },
  {
    id: "powderMiser",
    tree: "firepower",
    name: "Powder Miser",
    tier: 2,
    maxPoints: 10,
    description: "Reduces cannonball use slightly.",
    bonusType: "cannonballReduction",
    bonusPerPoint: 1,
    requires: [{ id: "powderKegs", points: 4 }]
  },
  {
    id: "killingBlow",
    tree: "firepower",
    name: "Killing Blow",
    tier: 3,
    maxPoints: 10,
    description: "Increases crit multiplier.",
    bonusType: "critMultiplier",
    bonusPerPoint: 0.05,
    requires: [{ id: "deadEye", points: 8 }]
  },
  {
    id: "broadsideMaster",
    tree: "firepower",
    name: "Broadside Master",
    tier: 3,
    maxPoints: 10,
    description: "+1 effective cannon per point.",
    bonusType: "effectiveCannons",
    bonusPerPoint: 1,
    requires: [
      { id: "deadEye", points: 5 },
      { id: "powderMiser", points: 5 }
    ]
  },
  {
    id: "ironHull",
    tree: "seamanship",
    name: "Iron Hull",
    tier: 1,
    maxPoints: 10,
    description: "+5% max hull per point.",
    bonusType: "maxHullMultiplier",
    bonusPerPoint: 0.05,
    requires: []
  },
  {
    id: "shipsSurgeon",
    tree: "seamanship",
    name: "Ship's Surgeon",
    tier: 1,
    maxPoints: 10,
    description: "+3% passive repair per point.",
    bonusType: "passiveRepair",
    bonusPerPoint: 0.03,
    requires: []
  },
  {
    id: "nightWatch",
    tree: "seamanship",
    name: "Night Watch",
    tier: 2,
    maxPoints: 10,
    description: "+1 hour offline cap per point.",
    bonusType: "offlineCapBonusHours",
    bonusPerPoint: 1,
    requires: [{ id: "shipsSurgeon", points: 4 }]
  },
  {
    id: "skeletonCrew",
    tree: "seamanship",
    name: "Skeleton Crew",
    tier: 3,
    maxPoints: 10,
    description: "Future auto-restock bonus.",
    bonusType: "futureAutoRestock",
    bonusPerPoint: 1,
    requires: [{ id: "nightWatch", points: 8 }]
  },
  {
    id: "ghostShip",
    tree: "seamanship",
    name: "Ghost Ship",
    tier: 3,
    maxPoints: 10,
    description: "-1.5% incoming damage per point.",
    bonusType: "incomingDamageReduction",
    bonusPerPoint: 0.015,
    requires: [{ id: "nightWatch", points: 5 }]
  },
  {
    id: "plunderersEye",
    tree: "fortune",
    name: "Plunderer's Eye",
    tier: 1,
    maxPoints: 10,
    description: "+3% gold per ship per point.",
    bonusType: "goldMultiplier",
    bonusPerPoint: 0.03,
    requires: []
  },
  {
    id: "saltAndKnowledge",
    tree: "fortune",
    name: "Salt & Knowledge",
    tier: 1,
    maxPoints: 10,
    description: "+2% XP from all sources per point.",
    bonusType: "xpMultiplier",
    bonusPerPoint: 0.02,
    requires: []
  },
  {
    id: "chestSeeker",
    tree: "fortune",
    name: "Chest Seeker",
    tier: 2,
    maxPoints: 10,
    description: "+2% treasure chance per point.",
    bonusType: "treasureChance",
    bonusPerPoint: 0.02,
    requires: [{ id: "plunderersEye", points: 4 }]
  },
  {
    id: "merchantsTouch",
    tree: "fortune",
    name: "Merchant's Touch",
    tier: 2,
    maxPoints: 10,
    description: "+2% sell price per point.",
    bonusType: "sellPriceMultiplier",
    bonusPerPoint: 0.02,
    requires: [{ id: "saltAndKnowledge", points: 4 }]
  },
  {
    id: "tradeWind",
    tree: "fortune",
    name: "Trade Wind",
    tier: 3,
    maxPoints: 10,
    description: "+50 gold/hour passive income per point.",
    bonusType: "passiveGoldPerHour",
    bonusPerPoint: 50,
    requires: [{ id: "merchantsTouch", points: 8 }]
  },
  {
    id: "legendsShare",
    tree: "fortune",
    name: "Legend's Share",
    tier: 3,
    maxPoints: 10,
    description: "Future milestone reward bonus.",
    bonusType: "futureMilestoneBonus",
    bonusPerPoint: 1,
    requires: [
      { id: "chestSeeker", points: 5 },
      { id: "merchantsTouch", points: 5 }
    ]
  }
];
