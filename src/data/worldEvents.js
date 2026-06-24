export const worldEvents = [
  {
    id: "merchantConvoy",
    name: "Merchant Convoy",
    type: "economy",
    description: "Trade winds bring a line of wealthy merchants into the harbour.",
    durationMs: 30 * 60 * 1000,
    rarity: 2,
    effects: {
      tradeSellValueMultiplier: 1.2
    }
  },
  {
    id: "pirateInvasion",
    name: "Pirate Invasion",
    type: "combat",
    description: "Raiders flood the seas and turn every victory into a richer prize.",
    durationMs: 45 * 60 * 1000,
    rarity: 3,
    effects: {
      combatGoldMultiplier: 1.25
    }
  },
  {
    id: "treasureFleet",
    name: "Treasure Fleet",
    type: "treasure",
    description: "A treasure convoy leaves behind charts, maps, and scattered relics.",
    durationMs: 30 * 60 * 1000,
    rarity: 3,
    effects: {
      treasureMapDropMultiplier: 1.25
    }
  },
  {
    id: "calmSeas",
    name: "Calm Seas",
    type: "idle",
    description: "The water settles and the crew faces lighter resistance.",
    durationMs: 60 * 60 * 1000,
    rarity: 1,
    effects: {
      hullDamageTakenMultiplier: 0.8
    }
  },
  {
    id: "cursedFog",
    name: "Cursed Fog",
    type: "high-risk",
    description: "A black fog rises, empowering bosses while feeding the bravest captains.",
    durationMs: 30 * 60 * 1000,
    rarity: 5,
    effects: {
      bossRewardMultiplier: 1.5,
      bossDamageMultiplier: 1.25
    }
  }
];
