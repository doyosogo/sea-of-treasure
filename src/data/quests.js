export const dailyQuestPool = [
  {
    id: "sink_10_enemy_ships",
    type: "daily",
    title: "Skirmish at Sea",
    description: "Sink 10 enemy ships.",
    target: 10,
    metric: "shipsSunk",
    rewardGold: 750,
    rewardDoubloons: 1,
    rewardMaterials: {
      gunpowder: 20
    }
  },
  {
    id: "win_3_active_battles",
    type: "daily",
    title: "Battle Drills",
    description: "Win 3 active battles.",
    target: 3,
    metric: "activeBattlesWon",
    rewardGold: 1000,
    rewardDoubloons: 2,
    rewardMaterials: {
      cannonParts: 6
    }
  },
  {
    id: "complete_2_skill_actions",
    type: "daily",
    title: "Crew Training",
    description: "Complete 2 skill actions.",
    target: 2,
    metric: "skillActionsCompleted",
    rewardGold: 650,
    rewardDoubloons: 1,
    rewardMaterials: {
      navigationCharts: 12
    }
  },
  {
    id: "sell_20_trade_goods",
    type: "daily",
    title: "Merchant Run",
    description: "Sell 20 trade goods.",
    target: 20,
    metric: "goodsSold",
    rewardGold: 800,
    rewardDoubloons: 1,
    rewardMaterials: {
      tradeContracts: 4
    }
  },
  {
    id: "complete_1_treasure_dig",
    type: "daily",
    title: "Buried Fortune",
    description: "Complete 1 treasure dig.",
    target: 1,
    metric: "treasureDigsCompleted",
    rewardGold: 1200,
    rewardDoubloons: 2,
    rewardMaterials: {
      ancientRelics: 3
    }
  },
  {
    id: "earn_2000_gold",
    type: "daily",
    title: "Quick Profit",
    description: "Earn 2,000 gold.",
    target: 2000,
    metric: "goldEarned",
    rewardGold: 500,
    rewardDoubloons: 1,
    rewardMaterials: {
      gunpowder: 10
    }
  },
  {
    id: "catch_50_fish",
    type: "daily",
    title: "Fresh Catch",
    description: "Catch 50 fish.",
    target: 50,
    metric: "fishGained",
    rewardGold: 700,
    rewardDoubloons: 1,
    rewardMaterials: {
      compassFragments: 4
    }
  },
  {
    id: "buy_100_cannonballs",
    type: "daily",
    title: "Supply Restock",
    description: "Buy 100 ammo.",
    target: 100,
    metric: "cannonballsBought",
    rewardGold: 500,
    rewardDoubloons: 1,
    rewardMaterials: {
      cannonParts: 3
    }
  }
];

export const weeklyQuestPool = [
  {
    id: "sink_250_enemy_ships",
    type: "weekly",
    title: "Sea Clearance",
    description: "Sink 250 enemy ships.",
    target: 250,
    metric: "shipsSunk",
    rewardGold: 10000,
    rewardDoubloons: 10,
    rewardMaterials: {
      gunpowder: 80,
      cannonParts: 20
    }
  },
  {
    id: "win_50_active_battles",
    type: "weekly",
    title: "Fleet Victory",
    description: "Win 50 active battles.",
    target: 50,
    metric: "activeBattlesWon",
    rewardGold: 15000,
    rewardDoubloons: 12,
    rewardMaterials: {
      ancientRelics: 8
    }
  },
  {
    id: "complete_20_skill_actions",
    type: "weekly",
    title: "Academy Graduate",
    description: "Complete 20 skill actions.",
    target: 20,
    metric: "skillActionsCompleted",
    rewardGold: 8000,
    rewardDoubloons: 10,
    rewardMaterials: {
      navigationCharts: 60,
      compassFragments: 12
    }
  },
  {
    id: "complete_5_treasure_digs",
    type: "weekly",
    title: "Vault Hunter",
    description: "Complete 5 treasure digs.",
    target: 5,
    metric: "treasureDigsCompleted",
    rewardGold: 12000,
    rewardDoubloons: 15,
    rewardMaterials: {
      ancientRelics: 15
    }
  },
  {
    id: "earn_100000_gold",
    type: "weekly",
    title: "Rich Current",
    description: "Earn 100,000 gold.",
    target: 100000,
    metric: "goldEarned",
    rewardGold: 15000,
    rewardDoubloons: 10,
    rewardMaterials: {
      tradeContracts: 20,
      tradeSeals: 4
    }
  },
  {
    id: "craft_5_ship_improvements",
    type: "weekly",
    title: "Masterwork Yard",
    description: "Craft 5 ship improvements.",
    target: 5,
    metric: "upgradesCrafted",
    rewardGold: 10000,
    rewardDoubloons: 12,
    rewardMaterials: {
      gunpowder: 60,
      cannonParts: 20
    }
  },
  {
    id: "gain_3_skill_levels",
    type: "weekly",
    title: "Rapid Progress",
    description: "Gain 3 skill levels.",
    target: 3,
    metric: "skillLevelsGained",
    rewardGold: 10000,
    rewardDoubloons: 15,
    rewardTalentPoints: 1
  },
  {
    id: "claim_5_achievements",
    type: "weekly",
    title: "Legacy Keeper",
    description: "Claim 5 achievements.",
    target: 5,
    metric: "achievementsClaimed",
    rewardGold: 15000,
    rewardDoubloons: 20,
    rewardMaterials: {
      ancientRelics: 20,
      tradeSeals: 5
    }
  }
];
