import { useEffect, useReducer } from "react";
import { achievements } from "../data/achievements.js";
import { enemies } from "../data/enemies.js";
import { skills as skillDefinitions } from "../data/skills.js";
import { talents as talentDefinitions } from "../data/talents.js";
import { craftableUpgrades } from "../data/crafting.js";
import { crewMembers } from "../data/crew.js";
import { dailyQuestPool, weeklyQuestPool } from "../data/quests.js";
import { regions } from "../data/regions.js";
import { rareTreasures, treasureSites } from "../data/treasures.js";
import { worldEvents } from "../data/worldEvents.js";
import { tradeGoods } from "../data/tradeGoods.js";
import { ships } from "../data/ships.js";
import {
  calcCannonUpgradeCost,
  calcOfflineProgress,
  canSpendTalentPoint,
  getCannonById,
  getCannonInventory,
  getCannonKeyByTier,
  getCannonCapacity,
  getCrewBonuses,
  getCrewUpgradeCost,
  generateBoss,
  generateEnemy,
  generateMarketPrices,
  getCargoCapacity,
  getCraftingCost,
  getEffectiveBallsPerBattle,
  getEffectiveShipsPerHour,
  getFishSellValue,
  getCannonMaterialUpgradeCost,
  getIdleCombatEstimate,
  getMaxHull,
  getPlayerCombatStats,
  getHighestOwnedCannonTier,
  getEquippedCannons,
  hasCannonMaterialUpgradeResources,
  isAchievementUnlocked,
  getCurrentCannon,
  getCurrentShip,
  getNextCannon,
  getMarketCooldownRemaining,
  getBossById,
  getRegionById,
  getWorldEventBonuses,
  getRepairCostPerMissingHull,
  getTalentBonuses,
  getTradeGoodBuyPrice,
  getTradeGoodSellPrice,
  getUsedCargo,
  getWhaleOilSellValue,
  getTotalEquippedCannons,
  getXpRequired,
  rollCannonballRecovery,
  rollDoubloonsFromCombat,
  rollDoubloonsFromTreasure,
  rollEnemyMapDrops,
  rollTreasureMapDrops
} from "../utils/gameEngine.js";

const STORAGE_KEY = "sot_save";
const MAX_PLAYER_LEVEL = 15;
const BASE_SKILL_XP_REWARD = 100;
const MARKET_REFRESH_COOLDOWN_MS = 10800000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function createInitialSkills() {
  return Object.fromEntries(skillDefinitions.map((skill) => [
    skill.id,
    {
      level: 1,
      xp: 0,
      active: false,
      startedAt: null,
      finishesAt: null
    }
  ]));
}

function createInitialTalents() {
  return Object.fromEntries(talentDefinitions.map((talent) => [talent.id, 0]));
}

function createInitialCargo() {
  return Object.fromEntries(tradeGoods.map((good) => [good.id, 0]));
}

function createInitialResources() {
  return {
    fish: 0,
    whaleOil: 0
  };
}

function createInitialMaterials() {
  return {
    navigationCharts: 0,
    compassFragments: 0,
    gunpowder: 0,
    cannonParts: 0,
    ancientRelics: 0,
    tradeContracts: 0,
    tradeSeals: 0
  };
}

function createInitialCraftedUpgrades() {
  return {
    reinforcedHull: 0,
    speedSails: 0,
    cannonBraces: 0
  };
}

function createInitialCrew() {
  return Object.fromEntries(crewMembers.map((crewMember) => [
    crewMember.id,
    {
      level: 1
    }
  ]));
}

function createInitialCannonInventory(defaultTierId = "iron", capacity = getShipCannonCapacity(1)) {
  return Object.fromEntries(["iron", "steel", "silver", "golden", "diamond", "leviathan"].map((cannonId) => [
    cannonId,
    cannonId === defaultTierId ? capacity : 0
  ]));
}

function createInitialEquippedCannons(defaultTierId = "iron", capacity = getShipCannonCapacity(1)) {
  return Object.fromEntries(["iron", "steel", "silver", "golden", "diamond", "leviathan"].map((cannonId) => [
    cannonId,
    cannonId === defaultTierId ? capacity : 0
  ]));
}

function getShipCannonCapacity(shipLevel) {
  return ships.find((ship) => ship.level === shipLevel)?.cannonCapacity ?? 4;
}

function createInitialLifetimeStats() {
  return {
    totalGoldEarned: 0,
    totalShipsSunk: 0,
    totalBossesDefeated: 0,
    defeatedLeviathan: false,
    worldEventsSeen: 0,
    cursedFogEventsSeen: 0,
    treasureDigsCompleted: 0,
    rareTreasuresFound: 0,
    upgradesCrafted: 0,
    totalDoubloonsEarned: 0
  };
}

function createQuestInstance(template, cycleSeed, index) {
  return {
    ...template,
    id: `${template.id}-${cycleSeed}-${index}`,
    rewardMaterials: template.rewardMaterials ? { ...template.rewardMaterials } : undefined,
    rewardTalentPoints: template.rewardTalentPoints ?? 0,
    rewardDoubloons: template.rewardDoubloons ?? 0,
    progress: 0,
    claimed: false
  };
}

function mulberry32(seed) {
  let t = seed >>> 0;

  return function random() {
    t += 0x6D2B79F5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items, seed) {
  const shuffled = [...items];
  const random = mulberry32(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function generateQuestSet(type, now) {
  const pool = type === "weekly" ? weeklyQuestPool : dailyQuestPool;
  const cycleSeed = Math.floor(now / (type === "weekly" ? WEEK_MS : DAY_MS));
  const shuffledPool = shuffleWithSeed(pool, cycleSeed);

  return shuffledPool.slice(0, 3).map((quest, index) => createQuestInstance(quest, cycleSeed, index));
}

function normalizeQuestInstance(quest) {
  if (!quest || typeof quest !== "object") {
    return null;
  }

  return {
    ...quest,
    rewardMaterials: quest.rewardMaterials ? { ...quest.rewardMaterials } : undefined,
    rewardTalentPoints: Math.max(0, quest.rewardTalentPoints ?? 0),
    rewardDoubloons: Math.max(0, quest.rewardDoubloons ?? 0),
    progress: Math.max(0, quest.progress ?? 0),
    claimed: Boolean(quest.claimed)
  };
}

function normalizeQuestSet(savedSet, type, now) {
  if (!savedSet || typeof savedSet !== "object") {
    return null;
  }

  const sourceList = Array.isArray(savedSet[type]) ? savedSet[type].map(normalizeQuestInstance).filter(Boolean) : [];
  const resetKey = type === "daily" ? "lastDailyReset" : "lastWeeklyReset";
  const resetMs = type === "weekly" ? WEEK_MS : DAY_MS;
  const lastReset = savedSet[resetKey] ?? null;
  const needsReset = !lastReset || now - lastReset >= resetMs;

  return {
    quests: sourceList.length > 0 && !needsReset ? sourceList : generateQuestSet(type, now),
    lastReset: needsReset ? now : lastReset
  };
}

function createInitialQuestState(now = Date.now()) {
  return {
    daily: generateQuestSet("daily", now),
    weekly: generateQuestSet("weekly", now),
    lastDailyReset: now,
    lastWeeklyReset: now
  };
}

function normalizeActiveRegionId(savedRegionId, playerLevel = 1) {
  const defaultRegion = regions[0]?.id ?? "coastalWaters";
  const validRegion = regions.find((region) => region.id === savedRegionId);

  if (validRegion && playerLevel >= validRegion.requiredLevel) {
    return validRegion.id;
  }

  const unlockedRegions = regions.filter((region) => playerLevel >= region.requiredLevel);
  return unlockedRegions.at(-1)?.id ?? defaultRegion;
}

function normalizeQuestState(savedQuests, now = Date.now()) {
  const dailyState = normalizeQuestSet(savedQuests, "daily", now);
  const weeklyState = normalizeQuestSet(savedQuests, "weekly", now);

  if (!dailyState && !weeklyState) {
    return createInitialQuestState(now);
  }

  return {
    daily: dailyState?.quests ?? generateQuestSet("daily", now),
    weekly: weeklyState?.quests ?? generateQuestSet("weekly", now),
    lastDailyReset: dailyState?.lastReset ?? now,
    lastWeeklyReset: weeklyState?.lastReset ?? now
  };
}

function refreshQuestStateForTime(state, now = Date.now()) {
  const quests = state.quests ?? createInitialQuestState(now);
  const nextState = { ...state };
  let updated = false;
  let nextQuests = quests;
  const dailyValid = Array.isArray(quests.daily) && quests.daily.length > 0;
  const weeklyValid = Array.isArray(quests.weekly) && quests.weekly.length > 0;

  if (!dailyValid || !quests.lastDailyReset || now - quests.lastDailyReset >= DAY_MS) {
    nextQuests = {
      ...nextQuests,
      daily: generateQuestSet("daily", now),
      lastDailyReset: now
    };
    updated = true;
  }

  if (!weeklyValid || !quests.lastWeeklyReset || now - quests.lastWeeklyReset >= WEEK_MS) {
    nextQuests = {
      ...nextQuests,
      weekly: generateQuestSet("weekly", now),
      lastWeeklyReset: now
    };
    updated = true;
  }

  if (!updated) {
    return state;
  }

  return {
    ...nextState,
    quests: nextQuests
  };
}

function updateQuestProgress(state, metric, amount = 0) {
  const progressAmount = Math.max(0, amount ?? 0);

  if (progressAmount <= 0 || !state.quests) {
    return state;
  }

  const updateList = (list) => list.map((quest) => {
    if (quest.claimed || quest.metric !== metric) {
      return quest;
    }

    return {
      ...quest,
      progress: Math.min(quest.target, (quest.progress ?? 0) + progressAmount)
    };
  });

  return {
    ...state,
    quests: {
      ...state.quests,
      daily: updateList(state.quests.daily ?? []),
      weekly: updateList(state.quests.weekly ?? [])
    }
  };
}

function updateQuestProgressMany(state, progressMap = {}) {
  return Object.entries(progressMap).reduce((updatedState, [metric, amount]) => (
    updateQuestProgress(updatedState, metric, amount)
  ), state);
}

function findQuestById(questsState, questId) {
  if (!questsState || !questId) {
    return null;
  }

  return [...(questsState.daily ?? []), ...(questsState.weekly ?? [])].find((quest) => quest.id === questId) ?? null;
}

function claimQuestById(state, questId) {
  if (!state.quests) {
    return null;
  }

  const dailyIndex = (state.quests.daily ?? []).findIndex((quest) => quest.id === questId);
  const weeklyIndex = (state.quests.weekly ?? []).findIndex((quest) => quest.id === questId);

  if (dailyIndex < 0 && weeklyIndex < 0) {
    return null;
  }

  const listKey = dailyIndex >= 0 ? "daily" : "weekly";
  const questIndex = dailyIndex >= 0 ? dailyIndex : weeklyIndex;
  const quest = state.quests[listKey][questIndex];

  if (!quest || quest.claimed || (quest.progress ?? 0) < quest.target) {
    return null;
  }

  const updatedQuest = {
    ...quest,
    claimed: true
  };

  return {
    ...state,
    quests: {
      ...state.quests,
      [listKey]: state.quests[listKey].map((questEntry, index) => (
        index === questIndex ? updatedQuest : questEntry
      ))
    }
  };
}

function createWorldEventState(event, now = Date.now()) {
  return {
    id: event.id,
    name: event.name,
    type: event.type,
    description: event.description,
    durationMs: event.durationMs,
    effects: event.effects,
    rarity: event.rarity,
    startedAt: now,
    endsAt: now + event.durationMs
  };
}

function getWorldEventDefinition(eventId) {
  return worldEvents.find((event) => event.id === eventId) ?? null;
}

function weightedRandomWorldEvent() {
  const pool = [...worldEvents];
  const totalWeight = pool.reduce((total, event) => total + (6 - (event.rarity ?? 3)), 0);
  let roll = Math.random() * totalWeight;

  for (const event of pool) {
    roll -= (6 - (event.rarity ?? 3));
    if (roll <= 0) {
      return event;
    }
  }

  return pool[0] ?? null;
}

function refreshWorldEventStateForTime(state, now = Date.now()) {
  const event = state.activeWorldEvent;
  let nextState = state;
  let updated = false;

  if (event?.endsAt && now >= event.endsAt) {
    const endedEventName = event.name ?? getWorldEventDefinition(event.id)?.name ?? "World Event";
    nextState = {
      ...state,
      activeWorldEvent: null,
      lastWorldEventGeneratedAt: now
    };
    nextState = addActivityLogEntry(nextState, `World Event Ended: ${endedEventName}.`);
    updated = true;
  }

  const postEndState = nextState.activeWorldEvent ? nextState : nextState;
  const canAttemptGeneration = !postEndState.activeWorldEvent && now - (postEndState.lastWorldEventGeneratedAt ?? 0) >= 30 * 60 * 1000;

  if (!canAttemptGeneration) {
    return updated ? nextState : state;
  }

  if (Math.random() < 0.35) {
    const nextEvent = weightedRandomWorldEvent();

    if (!nextEvent) {
      return {
        ...postEndState,
        lastWorldEventGeneratedAt: now
      };
    }

    const worldEventState = createWorldEventState(nextEvent, now);
    const eventStartState = {
      ...postEndState,
      activeWorldEvent: worldEventState,
      lastWorldEventGeneratedAt: now,
      lifetimeStats: {
        ...postEndState.lifetimeStats,
        worldEventsSeen: (postEndState.lifetimeStats?.worldEventsSeen ?? 0) + 1,
        cursedFogEventsSeen: (postEndState.lifetimeStats?.cursedFogEventsSeen ?? 0) + (nextEvent.id === "cursedFog" ? 1 : 0)
      }
    };

    return addActivityLogEntry(eventStartState, `World Event Started: ${nextEvent.name}.`);
  }

  return {
    ...postEndState,
    lastWorldEventGeneratedAt: now
  };
}

const initialState = {
  playerLevel: 1,
  playerXP: 0,
  gold: 0,
  currentShipId: 1,
  ownedShips: [1],
  selectedEnemyId: "smugglerCutter",
  lastBattleEnemyId: null,
  currentBattle: null,
  activeRegionId: "coastalWaters",
  hull: {
    current: 140,
    max: 140
  },
  cannonTier: 1,
  cannonInventory: createInitialCannonInventory(),
  equippedCannons: createInitialEquippedCannons(),
  cannonballs: 100,
  totalShipsSunk: 0,
  doubloons: 0,
  talentPoints: 0,
  talents: createInitialTalents(),
  skills: createInitialSkills(),
  cargo: createInitialCargo(),
  resources: createInitialResources(),
  materials: createInitialMaterials(),
  rareMapPieces: 0,
  craftedUpgrades: createInitialCraftedUpgrades(),
  crew: createInitialCrew(),
  quests: createInitialQuestState(),
  lifetimeStats: createInitialLifetimeStats(),
  claimedAchievements: [],
  marketPrices: generateMarketPrices(),
  marketLastRefreshed: Date.now(),
  marketCycleStartedAt: Date.now(),
  marketTradeLimit: 102,
  marketTradeUsed: 0,
  marketRefreshCooldownMs: MARKET_REFRESH_COOLDOWN_MS,
  treasureMaps: 3,
  activeTreasureDig: null,
  treasureInventory: [],
  activeWorldEvent: null,
  lastWorldEventGeneratedAt: Date.now(),
  worldEventsSeen: 0,
  activityLog: [],
  pendingOfflineRewards: null,
  offlineSummaryVisible: false,
  isIdling: false,
  idleProgressSeconds: 0,
  lastSeen: Date.now()
};

function clampHull(state, preferredCurrent = state.hull?.current) {
  const maxHull = getMaxHull(state);
  const currentHull = Math.min(maxHull, Math.max(0, preferredCurrent ?? maxHull));

  return {
    ...state,
    hull: {
      current: currentHull,
      max: maxHull
    }
  };
}

function sumCraftedUpgradeLevels(upgrades = {}) {
  return Object.values(upgrades).reduce((total, level) => total + (level ?? 0), 0);
}

function getCannonIds() {
  return ["iron", "steel", "silver", "golden", "diamond", "leviathan"];
}

function getTotalEquippedCannonsFromState(state) {
  return getCannonIds().reduce((total, cannonId) => total + (state.equippedCannons?.[cannonId] ?? 0), 0);
}

function getLowestEquippedCannonId(state) {
  return getCannonIds().find((cannonId) => (state.equippedCannons?.[cannonId] ?? 0) > 0) ?? null;
}

function getHighestEquippedCannonId(state) {
  const ids = getCannonIds();

  for (let index = ids.length - 1; index >= 0; index -= 1) {
    if ((state.equippedCannons?.[ids[index]] ?? 0) > 0) {
      return ids[index];
    }
  }

  return null;
}

function getHighestOwnedCannonId(state) {
  const ids = getCannonIds();

  for (let index = ids.length - 1; index >= 0; index -= 1) {
    if ((state.cannonInventory?.[ids[index]] ?? 0) > 0 || (state.equippedCannons?.[ids[index]] ?? 0) > 0) {
      return ids[index];
    }
  }

  return "iron";
}

function getEquippedCapacityRemaining(state) {
  return Math.max(0, getCannonCapacity(state) - getTotalEquippedCannonsFromState(state));
}

function setCannonOwnership(state, cannonId, amount) {
  return {
    ...state,
    cannonInventory: {
      ...state.cannonInventory,
      [cannonId]: Math.max(0, (state.cannonInventory?.[cannonId] ?? 0) + amount)
    }
  };
}

function normalizeLifetimeStats(savedStats = {}, restoredState = initialState) {
  const craftedUpgrades = normalizeCraftedUpgrades(restoredState.craftedUpgrades);

  return {
    totalGoldEarned: Math.max(0, savedStats.totalGoldEarned ?? 0),
    totalShipsSunk: Math.max(0, savedStats.totalShipsSunk ?? restoredState.totalShipsSunk ?? 0),
    totalBossesDefeated: Math.max(0, savedStats.totalBossesDefeated ?? 0),
    defeatedLeviathan: Boolean(savedStats.defeatedLeviathan ?? false),
    worldEventsSeen: Math.max(0, savedStats.worldEventsSeen ?? 0),
    cursedFogEventsSeen: Math.max(0, savedStats.cursedFogEventsSeen ?? 0),
    treasureDigsCompleted: Math.max(0, savedStats.treasureDigsCompleted ?? 0),
    rareTreasuresFound: Math.max(
      0,
      savedStats.rareTreasuresFound ?? restoredState.treasureInventory?.length ?? 0
    ),
    upgradesCrafted: Math.max(0, savedStats.upgradesCrafted ?? sumCraftedUpgradeLevels(craftedUpgrades)),
    totalDoubloonsEarned: Math.max(0, savedStats.totalDoubloonsEarned ?? 0)
  };
}

function normalizeCraftedUpgrades(savedUpgrades = {}) {
  return Object.fromEntries(craftableUpgrades.map((upgrade) => [
    upgrade.id,
    Math.min(upgrade.maxLevel, Math.max(0, savedUpgrades[upgrade.id] ?? 0))
  ]));
}

function normalizeCannonInventory(savedInventory = {}, fallbackTier = "iron", capacity = getShipCannonCapacity(1)) {
  const cannonIds = ["iron", "steel", "silver", "golden", "diamond", "leviathan"];
  const normalized = Object.fromEntries(cannonIds.map((cannonId) => [
    cannonId,
    Math.max(0, savedInventory[cannonId] ?? 0)
  ]));

  const hasAnyCannons = cannonIds.some((cannonId) => normalized[cannonId] > 0);

  if (!hasAnyCannons) {
    normalized[fallbackTier] = capacity;
  }

  return normalized;
}

function normalizeEquippedCannons(savedEquipped = {}, inventory = {}, fallbackTier = "iron", capacity = getShipCannonCapacity(1)) {
  const cannonIds = ["iron", "steel", "silver", "golden", "diamond", "leviathan"];
  const normalized = Object.fromEntries(cannonIds.map((cannonId) => [
    cannonId,
    Math.max(0, Math.min(savedEquipped[cannonId] ?? 0, inventory[cannonId] ?? 0))
  ]));

  const equippedTotal = cannonIds.reduce((total, cannonId) => total + normalized[cannonId], 0);

  if (equippedTotal <= 0) {
    const preferredTier = inventory[fallbackTier] > 0
      ? fallbackTier
      : [...cannonIds].reverse().find((cannonId) => (inventory[cannonId] ?? 0) > 0) ?? fallbackTier;
    normalized[preferredTier] = Math.min(capacity, inventory[preferredTier] ?? capacity);
  }

  const finalTotal = cannonIds.reduce((total, cannonId) => total + normalized[cannonId], 0);

  if (finalTotal > capacity) {
    let remaining = finalTotal - capacity;

    for (let index = 0; index < cannonIds.length && remaining > 0; index += 1) {
      const cannonId = cannonIds[index];
      const reduction = Math.min(normalized[cannonId], remaining);
      normalized[cannonId] -= reduction;
      remaining -= reduction;
    }
  }

  if (cannonIds.every((cannonId) => normalized[cannonId] === 0)) {
    const preferredTier = [...cannonIds].reverse().find((cannonId) => (inventory[cannonId] ?? 0) > 0) ?? fallbackTier;
    normalized[preferredTier] = Math.min(1, inventory[preferredTier] ?? 1);
  }

  return normalized;
}

function normalizeResources(savedResources = {}) {
  return {
    fish: Math.max(0, savedResources.fish ?? 0),
    whaleOil: Math.max(0, savedResources.whaleOil ?? 0)
  };
}

function normalizeMaterials(savedMaterials = {}) {
  const defaultMaterials = createInitialMaterials();

  return Object.fromEntries(Object.keys(defaultMaterials).map((materialId) => [
    materialId,
    Math.max(0, savedMaterials[materialId] ?? 0)
  ]));
}

function normalizeCrew(savedCrew = {}) {
  const defaultCrew = createInitialCrew();

  return Object.fromEntries(crewMembers.map((crewMember) => [
    crewMember.id,
    {
      ...defaultCrew[crewMember.id],
      ...savedCrew[crewMember.id],
      level: Math.min(crewMember.maxLevel, Math.max(1, savedCrew[crewMember.id]?.level ?? 1))
    }
  ]));
}

function normalizeCargo(savedCargo = {}) {
  return Object.fromEntries(tradeGoods.map((good) => [
    good.id,
    Math.max(0, savedCargo[good.id] ?? 0)
  ]));
}

function normalizeMarketPrices(savedMarketPrices) {
  const fallbackPrices = generateMarketPrices();

  return Object.fromEntries(tradeGoods.map((good) => {
    const savedPrice = savedMarketPrices?.[good.id];

    return [
      good.id,
      {
        buyModifier: savedPrice?.buyModifier ?? fallbackPrices[good.id].buyModifier,
        sellModifier: savedPrice?.sellModifier ?? fallbackPrices[good.id].sellModifier
      }
    ];
  }));
}

function normalizeTreasureInventory(savedInventory) {
  return Array.isArray(savedInventory) ? savedInventory : [];
}

function normalizeTalents(savedTalents = {}) {
  return Object.fromEntries(talentDefinitions.map((talent) => [
    talent.id,
    Math.min(talent.maxPoints, Math.max(0, savedTalents[talent.id] ?? 0))
  ]));
}

function normalizeSkills(savedSkills = {}) {
  const defaultSkills = createInitialSkills();

  return Object.fromEntries(skillDefinitions.map((skill) => {
    const savedSkill = savedSkills[skill.id] ?? {};

    return [
      skill.id,
      {
        ...defaultSkills[skill.id],
        ...savedSkill,
        level: Math.min(skill.maxLevel, Math.max(1, savedSkill.level ?? 1)),
        xp: Math.max(0, savedSkill.xp ?? 0),
        active: Boolean(savedSkill.active),
        startedAt: savedSkill.startedAt ?? null,
        finishesAt: savedSkill.finishesAt ?? null
      }
    ];
  }));
}

function loadSavedState() {
  const now = Date.now();

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      return {
        ...initialState,
        marketPrices: generateMarketPrices(),
        marketLastRefreshed: now,
        marketCycleStartedAt: now,
        marketTradeLimit: getCargoCapacity(initialState),
        marketTradeUsed: 0,
        lastSeen: now
      };
    }

    const parsedState = JSON.parse(savedState);
    const restoredState = {
      ...initialState,
      ...parsedState,
      cannonTier: Math.min(6, Math.max(1, parsedState.cannonTier ?? 1)),
      activityLog: Array.isArray(parsedState.activityLog) ? parsedState.activityLog : [],
      talents: normalizeTalents(parsedState.talents),
      skills: normalizeSkills(parsedState.skills),
      cargo: normalizeCargo(parsedState.cargo),
      resources: normalizeResources(parsedState.resources),
      materials: normalizeMaterials(parsedState.materials),
      crew: normalizeCrew(parsedState.crew),
      rareMapPieces: Math.max(0, parsedState.rareMapPieces ?? 0),
      doubloons: Math.max(0, parsedState.doubloons ?? 0),
      craftedUpgrades: normalizeCraftedUpgrades(parsedState.craftedUpgrades),
      quests: normalizeQuestState(parsedState.quests, now),
      marketPrices: normalizeMarketPrices(parsedState.marketPrices),
      marketLastRefreshed: parsedState.marketLastRefreshed ?? now,
      marketRefreshCooldownMs: parsedState.marketRefreshCooldownMs ?? MARKET_REFRESH_COOLDOWN_MS,
      treasureMaps: parsedState.treasureMaps ?? 3,
      activeTreasureDig: parsedState.activeTreasureDig ?? null,
      treasureInventory: normalizeTreasureInventory(parsedState.treasureInventory),
      activeWorldEvent: parsedState.activeWorldEvent ?? null,
      lastWorldEventGeneratedAt: parsedState.lastWorldEventGeneratedAt ?? now,
      worldEventsSeen: parsedState.worldEventsSeen ?? 0,
      activeRegionId: normalizeActiveRegionId(parsedState.activeRegionId ?? "coastalWaters", parsedState.playerLevel ?? 1),
      selectedEnemyId: parsedState.selectedEnemyId ?? "smugglerCutter",
      lastBattleEnemyId: parsedState.lastBattleEnemyId ?? null,
      currentBattle: parsedState.currentBattle ?? null,
      claimedAchievements: Array.isArray(parsedState.claimedAchievements) ? parsedState.claimedAchievements : [],
      isIdling: false,
      idleProgressSeconds: parsedState.idleProgressSeconds ?? 0,
      pendingOfflineRewards: null,
      offlineSummaryVisible: false
    };
    const currentShip = getCurrentShip(restoredState);
    const shipCapacity = currentShip.cannonCapacity ?? getShipCannonCapacity(currentShip.level);
    const fallbackTierId = getCannonKeyByTier(parsedState.cannonTier ?? 1);
    const normalizedInventory = normalizeCannonInventory(parsedState.cannonInventory, fallbackTierId, shipCapacity);
    const normalizedEquippedCannons = normalizeEquippedCannons(parsedState.equippedCannons, normalizedInventory, fallbackTierId, shipCapacity);
    const normalizedState = clampHull({
      ...restoredState,
      cannonInventory: normalizedInventory,
      equippedCannons: normalizedEquippedCannons,
      cannonTier: getHighestOwnedCannonTier({
        ...restoredState,
        cannonInventory: normalizedInventory,
        equippedCannons: normalizedEquippedCannons
      }).tier,
      lifetimeStats: normalizeLifetimeStats(parsedState.lifetimeStats, restoredState),
      marketCycleStartedAt: parsedState.marketCycleStartedAt ?? now,
      marketTradeLimit: parsedState.marketTradeLimit ?? getCargoCapacity(restoredState),
      marketTradeUsed: parsedState.marketTradeUsed ?? 0,
      activeWorldEvent: parsedState.activeWorldEvent ?? null,
      lastWorldEventGeneratedAt: parsedState.lastWorldEventGeneratedAt ?? now,
      worldEventsSeen: parsedState.worldEventsSeen ?? 0
    }, parsedState.hull?.current);
    const worldEventState = refreshWorldEventStateForTime(normalizedState, now);

    if (parsedState.pendingOfflineRewards && parsedState.offlineSummaryVisible) {
      return {
        ...worldEventState,
        pendingOfflineRewards: parsedState.pendingOfflineRewards,
        offlineSummaryVisible: true,
        lastSeen: now
      };
    }

    const offlineRewards = calcOfflineProgress(worldEventState.lastSeen, now, worldEventState);

    if (!offlineRewards) {
      return {
        ...worldEventState,
        lastSeen: now
      };
    }

    return {
      ...worldEventState,
      pendingOfflineRewards: offlineRewards,
      offlineSummaryVisible: true,
      lastSeen: now
    };
  } catch {
    return {
      ...initialState,
      marketPrices: generateMarketPrices(),
      marketLastRefreshed: now,
      marketCycleStartedAt: now,
      marketTradeLimit: getCargoCapacity(initialState),
      marketTradeUsed: 0,
      lastSeen: now
    };
  }
}

function applyXp(state, amount) {
  if (state.playerLevel >= MAX_PLAYER_LEVEL) {
    return {
      ...state,
      playerLevel: MAX_PLAYER_LEVEL,
      playerXP: 0
    };
  }

  let playerLevel = state.playerLevel;
  let playerXP = state.playerXP + amount;
  let talentPoints = state.talentPoints;

  while (playerLevel < MAX_PLAYER_LEVEL && playerXP >= getXpRequired(playerLevel)) {
    playerXP -= getXpRequired(playerLevel);
    playerLevel += 1;
    talentPoints += 4;
  }

  if (playerLevel >= MAX_PLAYER_LEVEL) {
    playerXP = 0;
  }

  return {
    ...state,
    playerLevel,
    playerXP,
    talentPoints
  };
}

function addActivityLogEntry(state, message, type = "info") {
  if (!Array.isArray(state.activityLog) || !message) {
    return state;
  }

  return {
    ...state,
    lastSeen: Date.now(),
    activityLog: [{ message, type }, ...state.activityLog].slice(0, 8)
  };
}

function addLifetimeGold(state, amount) {
  const goldEarned = Math.max(0, amount ?? 0);

  if (goldEarned <= 0) {
    return state;
  }

  return {
    ...state,
    lifetimeStats: {
      ...state.lifetimeStats,
      totalGoldEarned: (state.lifetimeStats?.totalGoldEarned ?? 0) + goldEarned
    }
  };
}

function addLifetimeDoubloons(state, amount) {
  const doubloonsEarned = Math.max(0, amount ?? 0);

  if (doubloonsEarned <= 0) {
    return state;
  }

  return {
    ...state,
    lifetimeStats: {
      ...state.lifetimeStats,
      totalDoubloonsEarned: (state.lifetimeStats?.totalDoubloonsEarned ?? 0) + doubloonsEarned
    }
  };
}

function addDoubloons(state, amount) {
  const doubloonsEarned = Math.max(0, amount ?? 0);

  if (doubloonsEarned <= 0) {
    return state;
  }

  return addLifetimeDoubloons({
    ...state,
    doubloons: (state.doubloons ?? 0) + doubloonsEarned
  }, doubloonsEarned);
}

function addLifetimeShipsSunk(state, shipsSunk) {
  const sunk = Math.max(0, shipsSunk ?? 0);

  if (sunk <= 0) {
    return state;
  }

  return {
    ...state,
    lifetimeStats: {
      ...state.lifetimeStats,
      totalShipsSunk: (state.lifetimeStats?.totalShipsSunk ?? 0) + sunk
    }
  };
}

function addLifetimeBossDefeat(state, bossId) {
  if (!bossId) {
    return state;
  }

  return {
    ...state,
    lifetimeStats: {
      ...state.lifetimeStats,
      totalBossesDefeated: (state.lifetimeStats?.totalBossesDefeated ?? 0) + 1,
      defeatedLeviathan: (state.lifetimeStats?.defeatedLeviathan ?? false) || bossId === "theLeviathan"
    }
  };
}

function applyBattleRewards(state, battles, xpPerBattle, options = {}) {
  const currentShip = getCurrentShip(state);
  const talentBonuses = getTalentBonuses(state);
  const crewBonuses = getCrewBonuses(state);
  const worldEventBonuses = getWorldEventBonuses(state);
  const goldBonusMultiplier = options.activeCombatGoldBonus ? 1.35 : 1;
  const goldGained = battles * currentShip.goldPerShip * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier * goldBonusMultiplier * worldEventBonuses.combatGoldMultiplier;
  const xpGained = battles * xpPerBattle * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier;
  const xpState = applyXp(state, xpGained);

  return {
    state: addLifetimeShipsSunk(addLifetimeGold({
      ...xpState,
      gold: xpState.gold + goldGained,
      totalShipsSunk: xpState.totalShipsSunk + battles
    }, goldGained), battles),
    goldGained,
    xpGained
  };
}

function applyVictoryRewards(state, battleEnemy, options = {}) {
  const talentBonuses = getTalentBonuses(state);
  const crewBonuses = getCrewBonuses(state);
  const worldEventBonuses = getWorldEventBonuses(state);
  const goldBonusMultiplier = options.activeCombatGoldBonus ? 1.35 : 1;
  const combatEventGoldMultiplier = battleEnemy?.isBoss ? worldEventBonuses.combatGoldMultiplier : 1;
  const bossRewardMultiplier = battleEnemy?.isBoss ? worldEventBonuses.bossRewardMultiplier : 1;
  const goldGained = battleEnemy.goldReward * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier * goldBonusMultiplier * combatEventGoldMultiplier * bossRewardMultiplier;
  const xpGained = battleEnemy.xpReward * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier * bossRewardMultiplier;
  const mapFound = Math.random() < Math.min(1, battleEnemy.mapDropChance * bossRewardMultiplier) ? 1 : 0;
  const rareMapPiecesFound = rollRareMapPieces((battleEnemy.rareMapPieceChance ?? 0.0005) * bossRewardMultiplier);
  const doubloonRollEnemy = battleEnemy?.isBoss
    ? {
        ...battleEnemy,
        doubloonChance: (battleEnemy.doubloonChance ?? 0.03) * bossRewardMultiplier
      }
    : battleEnemy;
  const doubloonsGained = rollDoubloonsFromCombat(doubloonRollEnemy, 1);
  const xpState = applyXp(state, xpGained);
  const rewardState = addDoubloons(addLifetimeShipsSunk(addLifetimeGold({
    ...xpState,
    gold: xpState.gold + goldGained,
    totalShipsSunk: xpState.totalShipsSunk + 1,
    treasureMaps: xpState.treasureMaps + mapFound,
    rareMapPieces: xpState.rareMapPieces + rareMapPiecesFound
  }, goldGained), 1), doubloonsGained);

  return {
    state: rewardState,
    goldGained,
    xpGained,
    mapFound,
    rareMapPiecesFound,
    doubloonsGained,
    activeCombatGoldBonusApplied: Boolean(options.activeCombatGoldBonus),
    bossDefeated: Boolean(battleEnemy?.isBoss),
    defeatedBossId: battleEnemy?.isBoss ? battleEnemy.id : null
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSkillGoldReward(skillId) {
  switch (skillId) {
    case "treasureHunting": {
      const baseGold = randomInt(50, 250);
      const bonusGold = Math.random() < 0.2 ? 500 : 0;
      return baseGold + bonusGold;
    }
    case "shipwright":
      return randomInt(80, 160);
    case "trading":
      return randomInt(150, 350);
    default:
      return 0;
  }
}

function getFishingResourceReward() {
  const fish = randomInt(5, 15);
  const whaleOil = Math.random() < 0.1 ? randomInt(1, 3) : 0;

  return { fish, whaleOil };
}

function getSkillMaterialReward(skillId) {
  switch (skillId) {
    case "navigation":
      return {
        navigationCharts: randomInt(1, 3),
        compassFragments: Math.random() < 0.25 ? 1 : 0
      };
    case "gunnery":
      return {
        gunpowder: randomInt(2, 5),
        cannonParts: Math.random() < 0.15 ? 1 : 0
      };
    case "trading":
      return {
        tradeContracts: 1,
        tradeSeals: Math.random() < 0.1 ? 1 : 0
      };
    default:
      return null;
  }
}

function getTreasureMaterialReward(site) {
  const rareSite = site.requiredSkillLevel >= 8;

  return {
    ancientRelics: rareSite ? randomInt(3, 6) : randomInt(1, 3)
  };
}

function mergeMaterials(materials, rewards = {}) {
  return {
    ...materials,
    navigationCharts: (materials.navigationCharts ?? 0) + (rewards.navigationCharts ?? 0),
    compassFragments: (materials.compassFragments ?? 0) + (rewards.compassFragments ?? 0),
    gunpowder: (materials.gunpowder ?? 0) + (rewards.gunpowder ?? 0),
    cannonParts: (materials.cannonParts ?? 0) + (rewards.cannonParts ?? 0),
    ancientRelics: (materials.ancientRelics ?? 0) + (rewards.ancientRelics ?? 0),
    tradeContracts: (materials.tradeContracts ?? 0) + (rewards.tradeContracts ?? 0),
    tradeSeals: (materials.tradeSeals ?? 0) + (rewards.tradeSeals ?? 0)
  };
}

function spendCannonMaterialCost(state, cost) {
  return {
    ...state,
    gold: state.gold - (cost.gold ?? 0),
    rareMapPieces: state.rareMapPieces - (cost.rareMapPieces ?? 0),
    resources: {
      ...state.resources,
      whaleOil: state.resources.whaleOil - (cost.whaleOil ?? 0)
    },
    materials: {
      ...state.materials,
      navigationCharts: state.materials.navigationCharts - (cost.navigationCharts ?? 0),
      compassFragments: state.materials.compassFragments - (cost.compassFragments ?? 0),
      gunpowder: state.materials.gunpowder - (cost.gunpowder ?? 0),
      cannonParts: state.materials.cannonParts - (cost.cannonParts ?? 0),
      ancientRelics: state.materials.ancientRelics - (cost.ancientRelics ?? 0),
      tradeContracts: state.materials.tradeContracts - (cost.tradeContracts ?? 0),
      tradeSeals: state.materials.tradeSeals - (cost.tradeSeals ?? 0)
    }
  };
}

function getSkillMaterialLogText(skillId, rewards) {
  if (!rewards) {
    return "";
  }

  switch (skillId) {
    case "navigation":
      return ` Found ${rewards.navigationCharts} Navigation Chart${rewards.navigationCharts === 1 ? "" : "s"}.` +
        (rewards.compassFragments > 0 ? " Recovered a Compass Fragment." : "");
    case "gunnery":
      return ` Produced ${rewards.gunpowder} Gunpowder.` +
        (rewards.cannonParts > 0 ? ` Recovered ${rewards.cannonParts} Cannon Part.` : "");
    case "trading":
      return ` Secured ${rewards.tradeContracts} Trade Contract.` +
        (rewards.tradeSeals > 0 ? " Earned a Trade Seal." : "");
    default:
      return "";
  }
}

function rollRareMapPieces(chance, attempts = 1) {
  let pieces = 0;

  for (let index = 0; index < attempts; index += 1) {
    if (Math.random() < chance) {
      pieces += 1;
    }
  }

  return pieces;
}

function getRareTreasure(now) {
  const rareTreasure = rareTreasures[randomInt(0, rareTreasures.length - 1)];

  return {
    id: `${rareTreasure.id}_${now}`,
    name: rareTreasure.name,
    rarity: rareTreasure.rarity,
    foundAt: now
  };
}

function formatRecoveredCannonballs(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function applySkillXp(skillDefinition, skillState, xpAmount) {
  if (skillState.level >= skillDefinition.maxLevel) {
    return {
      skillState: {
        ...skillState,
        level: skillDefinition.maxLevel,
        xp: 0
      },
      levelsGained: 0
    };
  }

  let level = skillState.level;
  let xp = skillState.xp + xpAmount;
  let levelsGained = 0;

  while (level < skillDefinition.maxLevel && xp >= skillDefinition.xpPerLevel[level - 1]) {
    xp -= skillDefinition.xpPerLevel[level - 1];
    level += 1;
    levelsGained += 1;
  }

  if (level >= skillDefinition.maxLevel) {
    xp = 0;
  }

  return {
    skillState: {
      ...skillState,
      level,
      xp
    },
    levelsGained
  };
}

function gameStateReducer(state, action) {
  state = refreshQuestStateForTime(state, action.now ?? Date.now());
  state = refreshWorldEventStateForTime(state, action.now ?? Date.now());

  switch (action.type) {
    case "WORLD_EVENT_TICK":
      return state;
    case "SELECT_ENEMY": {
      const enemy = enemies.find((enemyData) => enemyData.id === action.enemyId);

      if (!enemy || state.playerLevel < enemy.unlockLevel) {
        return state;
      }

      return {
        ...state,
        selectedEnemyId: enemy.id,
        lastSeen: Date.now()
      };
    }
    case "SELECT_REGION": {
      const region = regions.find((regionData) => regionData.id === action.regionId);

      if (!region || (state.playerLevel ?? 1) < region.requiredLevel) {
        return state;
      }

      if (state.currentBattle) {
        return addActivityLogEntry(state, "Finish your current battle before changing regions.", "warning");
      }

      if (state.isIdling) {
        return addActivityLogEntry(state, "Stop idling before changing regions.", "warning");
      }

      if (state.activeRegionId === region.id) {
        return state;
      }

      return addActivityLogEntry({
        ...state,
        activeRegionId: region.id,
        lastSeen: Date.now()
      }, `Entered ${region.name}.`);
    }
    case "START_BATTLE": {
      if (state.isIdling) {
        return addActivityLogEntry(state, "Stop idling before starting an active battle.", "warning");
      }

      if (state.currentBattle || ((state.hull?.current ?? 0) <= 0 && !state.lastBattleEnemyId)) {
        return state;
      }

      const selectedEnemy = enemies.find((enemy) => enemy.id === (action.enemyId ?? state.selectedEnemyId));

      if (!selectedEnemy || state.playerLevel < selectedEnemy.unlockLevel) {
        return addActivityLogEntry(state, "That enemy is not available yet.", "warning");
      }

      const enemy = generateEnemy(state, selectedEnemy);

      return addActivityLogEntry(clampHull({
        ...state,
        selectedEnemyId: selectedEnemy.id,
        lastBattleEnemyId: selectedEnemy.id,
        currentBattle: {
          enemy,
          shotsFired: 0,
          startedAt: Date.now()
        }
      }), `Battle started against ${enemy.name}.`);
    }
    case "START_BOSS_BATTLE": {
      if (state.isIdling) {
        return addActivityLogEntry(state, "Stop idling before starting an active battle.", "warning");
      }

      if (state.currentBattle || ((state.hull?.current ?? 0) <= 0 && !state.lastBattleEnemyId)) {
        return state;
      }

      if (!action.bossId) {
        return state;
      }

      const boss = getBossById(action.bossId);

      if (!boss) {
        return addActivityLogEntry(state, "That boss is not available yet.", "warning");
      }

      const bossRegion = getRegionById(boss.regionId);

      if ((state.playerLevel ?? 1) < bossRegion.requiredLevel) {
        return addActivityLogEntry(state, "That boss is not available yet.", "warning");
      }

      const bossEnemy = generateBoss(state, boss);

      return addActivityLogEntry(clampHull({
        ...state,
        selectedEnemyId: state.selectedEnemyId,
        lastBattleEnemyId: bossEnemy.id,
        currentBattle: {
          enemy: bossEnemy,
          shotsFired: 0,
          startedAt: Date.now()
        }
      }), `Battle started against ${bossEnemy.name}.`);
    }
    case "FIRE_VOLLEY": {
      if (!state.currentBattle) {
        return state;
      }

      const ballsPerBattle = getEffectiveBallsPerBattle(state);

      if (state.cannonballs < ballsPerBattle) {
        return addActivityLogEntry(state, "Not enough cannonballs to fire a volley.", "warning");
      }

      const combatStats = getPlayerCombatStats(state);
      const isCrit = Math.random() < combatStats.critChance;
      const volleyDamage = combatStats.volleyDamage * (isCrit ? combatStats.critMultiplier : 1);
      const enemy = state.currentBattle.enemy;
      const enemyCurrentHP = Math.max(0, enemy.currentHP - volleyDamage);
      const cannonballsRecovered = enemyCurrentHP <= 0
        ? rollCannonballRecovery(state, 1, ballsPerBattle)
        : 0;
      const firedState = {
        ...state,
        cannonballs: Math.max(0, state.cannonballs - ballsPerBattle + cannonballsRecovered)
      };

      if (enemyCurrentHP <= 0) {
        const { state: rewardedState, goldGained, xpGained, mapFound, rareMapPiecesFound, doubloonsGained, activeCombatGoldBonusApplied, bossDefeated, defeatedBossId } = applyVictoryRewards(firedState, enemy, {
          activeCombatGoldBonus: true
        });
        const doubloonText = doubloonsGained > 0
          ? ` Found ${doubloonsGained} Doubloon${doubloonsGained === 1 ? "" : "s"}.`
          : "";
        const bossProgressState = bossDefeated
          ? addLifetimeBossDefeat(rewardedState, defeatedBossId)
          : rewardedState;
        const questProgressState = updateQuestProgressMany(bossProgressState, {
          shipsSunk: 1,
          activeBattlesWon: 1,
          goldEarned: goldGained
        });
        const victoryState = addActivityLogEntry({
          ...questProgressState,
          currentBattle: null,
          lastSeen: Date.now()
        }, `Victory: earned ${Math.round(goldGained)} gold and ${Math.round(xpGained)} XP.${doubloonText}${activeCombatGoldBonusApplied ? " Active combat bonus applied." : ""}`);
        const critState = isCrit
          ? addActivityLogEntry(victoryState, `Critical volley dealt ${Math.round(volleyDamage)} damage.`)
          : victoryState;
        const bossState = bossDefeated
          ? addActivityLogEntry(critState, `Defeated ${enemy.name}.`)
          : critState;
        const recoveredState = cannonballsRecovered > 0
          ? addActivityLogEntry(bossState, `Cannon Braces recovered ${formatRecoveredCannonballs(cannonballsRecovered)} cannonballs.`)
          : bossState;
        const rareMapPieceState = rareMapPiecesFound > 0
          ? addActivityLogEntry(recoveredState, "You discovered a Rare Map Piece.")
          : recoveredState;

        return mapFound > 0
          ? addActivityLogEntry(rareMapPieceState, "Found a treasure map among the wreckage.")
          : rareMapPieceState;
      }

      const incomingDamage = Math.max(1, enemy.damage * (1 - combatStats.incomingDamageReduction) * combatStats.incomingDamageTakenMultiplier);
      const nextHull = Math.max(0, combatStats.currentHull - incomingDamage);

      if (nextHull <= 0) {
        return addActivityLogEntry({
          ...firedState,
          hull: {
            current: 0,
            max: combatStats.maxHull
          },
          currentBattle: null,
          lastSeen: Date.now()
        }, `${enemy.name} broke your hull. Battle lost.`, "warning");
      }

      const updatedState = addActivityLogEntry({
        ...firedState,
        hull: {
          current: nextHull,
          max: combatStats.maxHull
        },
        currentBattle: {
          ...state.currentBattle,
          enemy: {
            ...enemy,
            currentHP: enemyCurrentHP
          },
          shotsFired: state.currentBattle.shotsFired + 1
        },
        lastSeen: Date.now()
      }, `Volley hit ${enemy.name} for ${Math.round(volleyDamage)} damage. ${enemy.name} dealt ${Math.round(incomingDamage)} hull damage.`);

      return isCrit
        ? addActivityLogEntry(updatedState, "Critical hit.")
        : updatedState;
    }
    case "REPAIR_HULL": {
      const clampedState = clampHull(state);
      const missingHull = clampedState.hull.max - clampedState.hull.current;

      if (missingHull <= 0) {
        return clampedState;
      }

      const repairCostPerHull = getRepairCostPerMissingHull(clampedState);
      const repairAmount = Math.min(missingHull, Math.floor(clampedState.gold / repairCostPerHull));

      if (repairAmount <= 0) {
        return addActivityLogEntry(clampedState, "Not enough gold to repair hull.", "warning");
      }

      return addActivityLogEntry({
        ...clampedState,
        gold: clampedState.gold - Math.floor(repairAmount * repairCostPerHull),
        hull: {
          current: clampedState.hull.current + repairAmount,
          max: clampedState.hull.max
        }
      }, `Repaired ${repairAmount} hull.`);
    }
    case "BUY_SHIP": {
      const ship = ships.find((shipData) => shipData.id === action.shipId);

      if (
        !ship ||
        state.playerLevel < ship.level ||
        state.gold < ship.purchaseCost ||
        state.ownedShips.includes(ship.id)
      ) {
        return state;
      }

      return addActivityLogEntry(clampHull({
        ...state,
        gold: state.gold - ship.purchaseCost,
        ownedShips: [...state.ownedShips, ship.id],
        currentShipId: ship.id
      }), `${ship.name} joined the fleet.`);
    }
    case "SET_ACTIVE_SHIP":
      if (!state.ownedShips.includes(action.shipId)) {
        return state;
      }

      return clampHull({
        ...state,
        currentShipId: action.shipId,
        lastSeen: Date.now()
      });
    case "BUY_CANNON": {
      const cannonId = getCannonIds().includes(action.cannonId) ? action.cannonId : null;
      const cannon = cannonId ? getCannonById(cannonId) : null;
      const quantity = Math.max(1, Math.floor(action.quantity ?? 1));
      const totalCost = cannon ? cannon.purchaseCost * quantity : 0;

      if (!cannon || state.playerLevel < cannon.unlockLevel || state.gold < totalCost) {
        return addActivityLogEntry(state, "That cannon is not available right now.", "warning");
      }

      const inventory = {
        ...state.cannonInventory,
        [cannon.id]: (state.cannonInventory?.[cannon.id] ?? 0) + quantity
      };
      const nextCannonTier = getCannonById(getHighestOwnedCannonId({
        ...state,
        cannonInventory: inventory
      })).tier;

      return addActivityLogEntry({
        ...state,
        gold: state.gold - totalCost,
        cannonInventory: inventory,
        cannonTier: nextCannonTier,
        lastSeen: Date.now()
      }, `Bought ${quantity} ${cannon.name}${quantity === 1 ? "" : "s"}.`);
    }
    case "EQUIP_CANNON": {
      const cannonId = getCannonIds().includes(action.cannonId) ? action.cannonId : null;
      const cannon = cannonId ? getCannonById(cannonId) : null;
      const quantity = Math.max(1, Math.floor(action.quantity ?? 1));
      const owned = cannon ? state.cannonInventory?.[cannon.id] ?? 0 : 0;
      const equipped = cannon ? state.equippedCannons?.[cannon.id] ?? 0 : 0;
      const capacityRemaining = getEquippedCapacityRemaining(state);

      if (!cannon || owned <= equipped || quantity <= 0) {
        return state;
      }

      if (capacityRemaining <= 0) {
        return addActivityLogEntry(state, "Cannon loadout is at full capacity.", "warning");
      }

      const equipAmount = Math.min(quantity, owned - equipped, capacityRemaining);

      if (equipAmount <= 0) {
        return state;
      }

      const nextEquipped = {
        ...state.equippedCannons,
        [cannon.id]: equipped + equipAmount
      };
      const nextCannonTier = getCannonById(getHighestOwnedCannonId({
        ...state,
        equippedCannons: nextEquipped
      })).tier;

      return addActivityLogEntry({
        ...state,
        equippedCannons: nextEquipped,
        cannonTier: nextCannonTier,
        lastSeen: Date.now()
      }, `Equipped ${equipAmount} ${cannon.name}${equipAmount === 1 ? "" : "s"}.`);
    }
    case "UNEQUIP_CANNON": {
      const cannonId = getCannonIds().includes(action.cannonId) ? action.cannonId : null;
      const cannon = cannonId ? getCannonById(cannonId) : null;
      const quantity = Math.max(1, Math.floor(action.quantity ?? 1));
      const equipped = cannon ? state.equippedCannons?.[cannon.id] ?? 0 : 0;
      const totalEquipped = getTotalEquippedCannonsFromState(state);

      if (!cannon || equipped <= 0) {
        return state;
      }

      if (totalEquipped <= 1) {
        return addActivityLogEntry(state, "At least one cannon must remain equipped.", "warning");
      }

      const unequipAmount = Math.min(quantity, equipped, totalEquipped - 1);

      if (unequipAmount <= 0) {
        return state;
      }

      const nextEquipped = {
        ...state.equippedCannons,
        [cannon.id]: equipped - unequipAmount
      };
      const nextCannonTier = getCannonById(getHighestOwnedCannonId({
        ...state,
        equippedCannons: nextEquipped
      })).tier;

      return addActivityLogEntry({
        ...state,
        equippedCannons: nextEquipped,
        cannonTier: nextCannonTier,
        lastSeen: Date.now()
      }, `Unequipped ${unequipAmount} ${cannon.name}${unequipAmount === 1 ? "" : "s"}.`);
    }
    case "GAIN_XP":
      return {
        ...applyXp(state, (action.amount ?? 0) * getTalentBonuses(state).xpMultiplier),
        lastSeen: Date.now()
      };
    case "GAIN_GOLD":
      return addLifetimeGold({
        ...state,
        gold: state.gold + (action.amount ?? 0),
        lastSeen: Date.now()
      }, action.amount ?? 0);
    case "SPEND_GOLD":
      return {
        ...state,
        gold: Math.max(0, state.gold - (action.amount ?? 0)),
        lastSeen: Date.now()
      };
    case "REFRESH_MARKET": {
      const now = action.now ?? Date.now();

      if (getMarketCooldownRemaining(state, now) > 0) {
        return addActivityLogEntry(state, "Market refresh is still on cooldown", "warning");
      }

      return addActivityLogEntry({
        ...state,
        marketPrices: generateMarketPrices(),
        marketLastRefreshed: now,
        marketCycleStartedAt: now,
        marketTradeLimit: getCargoCapacity(state),
        marketTradeUsed: 0,
        lastSeen: now
      }, "Market prices refreshed");
    }
    case "BUY_GOODS": {
      const quantity = Math.max(0, Math.floor(action.quantity ?? 0));
      const good = tradeGoods.find((tradeGood) => tradeGood.id === action.goodId);

      if (!good || quantity <= 0) {
        return state;
      }

      const totalCost = getTradeGoodBuyPrice(state, good) * quantity;
      const freeCargo = getCargoCapacity(state) - getUsedCargo(state);
      const tradeAllowanceRemaining = state.marketTradeLimit - state.marketTradeUsed;

      if (state.gold < totalCost) {
        return addActivityLogEntry(state, `Not enough gold to buy ${quantity} ${good.name}.`, "warning");
      }

      if (freeCargo < quantity) {
        return addActivityLogEntry(state, "Not enough cargo space.", "warning");
      }

      if (tradeAllowanceRemaining < quantity) {
        return addActivityLogEntry(state, "Market trade limit reached. Wait for the next market cycle.", "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - totalCost,
        marketTradeUsed: state.marketTradeUsed + quantity,
        cargo: {
          ...state.cargo,
          [good.id]: (state.cargo[good.id] ?? 0) + quantity
        }
      }, `Bought ${quantity} ${good.name}`);
    }
    case "SELL_GOODS": {
      const quantity = Math.max(0, Math.floor(action.quantity ?? 0));
      const good = tradeGoods.find((tradeGood) => tradeGood.id === action.goodId);

      if (!good || quantity <= 0) {
        return state;
      }

      if ((state.cargo[good.id] ?? 0) < quantity) {
        return addActivityLogEntry(state, `Not enough ${good.name} to sell.`, "warning");
      }

      const tradingSkill = skillDefinitions.find((skill) => skill.id === "trading");
      const tradingState = state.skills.trading;
      const talentBonuses = getTalentBonuses(state);
      const tradingXpGained = quantity * 5 * talentBonuses.xpMultiplier;
      const { skillState: updatedTrading, levelsGained } = applySkillXp(
        tradingSkill,
        tradingState,
        tradingXpGained
      );
      const goldEarned = getTradeGoodSellPrice(state, good) * quantity;
      const levelText = levelsGained > 0 ? ` Trading gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";

      const questProgressState = updateQuestProgressMany(addLifetimeGold({
        ...state,
        gold: state.gold + goldEarned,
        talentPoints: state.talentPoints + levelsGained,
        skills: {
          ...state.skills,
          trading: updatedTrading
        },
        cargo: {
          ...state.cargo,
          [good.id]: state.cargo[good.id] - quantity
        }
      }, goldEarned), {
        goodsSold: quantity,
        goldEarned
      });

      return addActivityLogEntry(questProgressState, `Sold ${quantity} ${good.name}. +${Math.round(tradingXpGained)} Trading XP.${levelText}`);
    }
    case "SELL_FISH": {
      const quantity = action.quantity === "all"
        ? state.resources.fish
        : Math.max(0, Math.floor(action.quantity ?? 0));

      if (quantity <= 0 || state.resources.fish < quantity) {
        return addActivityLogEntry(state, "Not enough Fish to sell.", "warning");
      }

      const goldEarned = getFishSellValue(state) * quantity;

      const questProgressState = updateQuestProgressMany(addLifetimeGold({
        ...state,
        gold: state.gold + goldEarned,
        resources: {
          ...state.resources,
          fish: state.resources.fish - quantity
        }
      }, goldEarned), {
        goldEarned
      });

      return addActivityLogEntry(questProgressState, `Sold ${quantity} Fish.`);
    }
    case "SELL_WHALE_OIL": {
      const quantity = action.quantity === "all"
        ? state.resources.whaleOil
        : Math.max(0, Math.floor(action.quantity ?? 0));

      if (quantity <= 0 || state.resources.whaleOil < quantity) {
        return addActivityLogEntry(state, "Not enough Whale Oil to sell.", "warning");
      }

      const goldEarned = getWhaleOilSellValue(state) * quantity;

      const questProgressState = updateQuestProgressMany(addLifetimeGold({
        ...state,
        gold: state.gold + goldEarned,
        resources: {
          ...state.resources,
          whaleOil: state.resources.whaleOil - quantity
        }
      }, goldEarned), {
        goldEarned
      });

      return addActivityLogEntry(questProgressState, `Sold ${quantity} Whale Oil.`);
    }
    case "CRAFT_UPGRADE": {
      const upgrade = craftableUpgrades.find((craftableUpgrade) => craftableUpgrade.id === action.upgradeId);

      if (!upgrade) {
        return state;
      }

      const currentLevel = state.craftedUpgrades[upgrade.id] ?? 0;

      if (currentLevel >= upgrade.maxLevel) {
        return state;
      }

      const cost = getCraftingCost(upgrade, currentLevel);

      if (
        state.gold < cost.gold ||
        state.resources.fish < cost.fish ||
        state.resources.whaleOil < cost.whaleOil
      ) {
        return addActivityLogEntry(state, `Not enough resources to craft ${upgrade.name}.`, "warning");
      }

      const shipwrightSkill = skillDefinitions.find((skill) => skill.id === "shipwright");
      const talentBonuses = getTalentBonuses(state);
      const shipwrightXp = cost.shipwrightXp * talentBonuses.xpMultiplier;
      const { skillState: updatedShipwright, levelsGained } = applySkillXp(
        shipwrightSkill,
        state.skills.shipwright,
        shipwrightXp
      );
      const nextLevel = currentLevel + 1;
      const levelText = levelsGained > 0 ? ` Shipwright gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";

      const questProgressState = updateQuestProgressMany(clampHull({
        ...state,
        gold: state.gold - cost.gold,
        talentPoints: state.talentPoints + levelsGained,
        resources: {
          ...state.resources,
          fish: state.resources.fish - cost.fish,
          whaleOil: state.resources.whaleOil - cost.whaleOil
        },
        craftedUpgrades: {
          ...state.craftedUpgrades,
          [upgrade.id]: nextLevel
        },
        lifetimeStats: {
          ...state.lifetimeStats,
          upgradesCrafted: (state.lifetimeStats?.upgradesCrafted ?? 0) + 1
        },
        skills: {
          ...state.skills,
          shipwright: updatedShipwright
        }
      }), {
        upgradesCrafted: 1
      });

      return addActivityLogEntry(questProgressState, `Crafted ${upgrade.name} Lv. ${nextLevel}.${levelText}`);
    }
    case "BUY_CANNONBALLS": {
      const currentCannon = getCurrentCannon(state);

      if (state.gold < currentCannon.goldPer100Balls) {
        return addActivityLogEntry(state, "Not enough gold to buy cannonballs.", "warning");
      }

      const questProgressState = updateQuestProgressMany({
        ...state,
        gold: state.gold - currentCannon.goldPer100Balls,
        cannonballs: state.cannonballs + 100
      }, {
        cannonballsBought: 100
      });

      return addActivityLogEntry(questProgressState, `Bought 100 ${currentCannon.name} cannonballs.`);
    }
    case "START_TREASURE_DIG": {
      const site = treasureSites.find((treasureSite) => treasureSite.id === action.siteId);
      const treasureSkill = state.skills.treasureHunting;
      const now = action.now ?? Date.now();

      if (!site || state.activeTreasureDig) {
        return state;
      }

      if (treasureSkill.level < site.requiredSkillLevel) {
        return addActivityLogEntry(state, `${site.name} requires Treasure Hunting level ${site.requiredSkillLevel}.`, "warning");
      }

      if (state.treasureMaps < site.mapCost) {
        return addActivityLogEntry(state, "Not enough treasure maps.", "warning");
      }

      return addActivityLogEntry({
        ...state,
        treasureMaps: state.treasureMaps - site.mapCost,
        activeTreasureDig: {
          siteId: site.id,
          startedAt: now,
          finishesAt: now + site.durationSeconds * 1000
        }
      }, `Started digging at ${site.name}.`);
    }
    case "COMPLETE_TREASURE_DIG": {
      const now = action.now ?? Date.now();
      const activeDig = state.activeTreasureDig;
      const site = treasureSites.find((treasureSite) => treasureSite.id === activeDig?.siteId);

      if (!activeDig || !site || now < activeDig.finishesAt) {
        return state;
      }

      const treasureSkillDefinition = skillDefinitions.find((skill) => skill.id === "treasureHunting");
      const talentBonuses = getTalentBonuses(state);
      const crewBonuses = getCrewBonuses(state);
      const goldReward = randomInt(site.goldMin, site.goldMax) * talentBonuses.goldMultiplier;
      const xpReward = site.xpReward * talentBonuses.xpMultiplier;
      const rareChance = site.rareChance * talentBonuses.treasureChanceMultiplier * crewBonuses.treasureChanceMultiplier;
      const rareFound = Math.random() < rareChance ? getRareTreasure(now) : null;
      const materialReward = getTreasureMaterialReward(site);
      const rareMapPiecesFound = rollRareMapPieces(0.005);
      const doubloonsGained = rollDoubloonsFromTreasure(site);
      const { skillState: updatedTreasureSkill, levelsGained } = applySkillXp(
        treasureSkillDefinition,
        state.skills.treasureHunting,
        xpReward
      );
      const levelText = levelsGained > 0 ? ` Treasure Hunting gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";
      const rareText = rareFound ? ` Found ${rareFound.name}.` : "";
      const relicText = ` Recovered ${materialReward.ancientRelics} Ancient Relic${materialReward.ancientRelics === 1 ? "" : "s"}.`;
      const rareMapPieceText = rareMapPiecesFound > 0 ? " You discovered a Rare Map Piece." : "";

      const questProgressState = updateQuestProgressMany(addDoubloons(addLifetimeGold({
        ...state,
        gold: state.gold + goldReward,
        talentPoints: state.talentPoints + levelsGained,
        materials: mergeMaterials(state.materials, materialReward),
        rareMapPieces: state.rareMapPieces + rareMapPiecesFound,
        activeTreasureDig: null,
        treasureInventory: rareFound ? [rareFound, ...state.treasureInventory] : state.treasureInventory,
        lifetimeStats: {
          ...state.lifetimeStats,
          treasureDigsCompleted: (state.lifetimeStats?.treasureDigsCompleted ?? 0) + 1,
          rareTreasuresFound: (state.lifetimeStats?.rareTreasuresFound ?? 0) + (rareFound ? 1 : 0)
        },
        skills: {
          ...state.skills,
          treasureHunting: updatedTreasureSkill
        }
      }, goldReward), doubloonsGained), {
        treasureDigsCompleted: 1,
        goldEarned: goldReward
      });

      return addActivityLogEntry(questProgressState, `${site.name} dig complete: +${Math.round(goldReward)} gold, +${Math.round(xpReward)} Treasure Hunting XP.${doubloonsGained > 0 ? ` Found ${doubloonsGained} Doubloon${doubloonsGained === 1 ? "" : "s"}.` : ""}${relicText}${rareText}${rareMapPieceText}${levelText}`);
    }
    case "CANCEL_TREASURE_DIG":
      if (!state.activeTreasureDig) {
        return state;
      }

      return addActivityLogEntry({
        ...state,
        activeTreasureDig: null
      }, "Treasure dig cancelled.");
    case "START_SKILL_ACTION": {
      const skillDefinition = skillDefinitions.find((skill) => skill.id === action.skillId);
      const skillState = state.skills[action.skillId];
      const now = action.now ?? Date.now();

      if (!skillDefinition || !skillState || skillState.active || skillState.level >= skillDefinition.maxLevel) {
        return state;
      }

      if (state.gold < skillDefinition.goldCostPerAction) {
        return addActivityLogEntry(state, `Not enough gold to start ${skillDefinition.actionName}.`, "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - skillDefinition.goldCostPerAction,
        skills: {
          ...state.skills,
          [skillDefinition.id]: {
            ...skillState,
            active: true,
            startedAt: now,
            finishesAt: now + skillDefinition.actionTimeSeconds * 1000
          }
        }
      }, `${skillDefinition.actionName} started.`);
    }
    case "COMPLETE_SKILL_ACTION": {
      const skillDefinition = skillDefinitions.find((skill) => skill.id === action.skillId);
      const skillState = state.skills[action.skillId];
      const now = action.now ?? Date.now();

      if (!skillDefinition || !skillState || !skillState.active || now < skillState.finishesAt) {
        return state;
      }

      const talentBonuses = getTalentBonuses(state);
      const goldReward = getSkillGoldReward(skillDefinition.id);
      const fishingReward = skillDefinition.id === "fishing" ? getFishingResourceReward() : null;
      const materialReward = getSkillMaterialReward(skillDefinition.id);
      const skillXpReward = BASE_SKILL_XP_REWARD * talentBonuses.xpMultiplier;
      const { skillState: rewardedSkillState, levelsGained } = applySkillXp(
        skillDefinition,
        {
          ...skillState,
          active: false,
          startedAt: null,
          finishesAt: null
        },
        skillXpReward
      );
      const levelText = levelsGained > 0 ? ` ${skillDefinition.name} gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";
      const goldText = goldReward > 0 ? ` +${goldReward} gold.` : "";
      const fishText = fishingReward ? ` Caught ${fishingReward.fish} Fish.` : "";
      const whaleOilText = fishingReward?.whaleOil > 0 ? ` Found ${fishingReward.whaleOil} Whale Oil.` : "";
      const materialText = getSkillMaterialLogText(skillDefinition.id, materialReward);

      const questProgressState = updateQuestProgressMany(addLifetimeGold({
        ...state,
        gold: state.gold + goldReward,
        talentPoints: state.talentPoints + levelsGained,
        materials: materialReward ? mergeMaterials(state.materials, materialReward) : state.materials,
        resources: fishingReward ? {
          ...state.resources,
          fish: state.resources.fish + fishingReward.fish,
          whaleOil: state.resources.whaleOil + fishingReward.whaleOil
        } : state.resources,
        skills: {
          ...state.skills,
          [skillDefinition.id]: rewardedSkillState
        }
      }, goldReward), {
        skillActionsCompleted: 1,
        skillLevelsGained: levelsGained,
        goldEarned: goldReward,
        fishGained: fishingReward?.fish ?? 0
      });

      return addActivityLogEntry(questProgressState, `${skillDefinition.actionName} complete: +${Math.round(skillXpReward)} ${skillDefinition.name} XP.${goldText}${fishText}${whaleOilText}${materialText}${levelText}`);
    }
    case "CANCEL_SKILL_ACTION": {
      const skillDefinition = skillDefinitions.find((skill) => skill.id === action.skillId);
      const skillState = state.skills[action.skillId];

      if (!skillDefinition || !skillState || !skillState.active) {
        return state;
      }

      return addActivityLogEntry({
        ...state,
        skills: {
          ...state.skills,
          [skillDefinition.id]: {
            ...skillState,
            active: false,
            startedAt: null,
            finishesAt: null
          }
        }
      }, `${skillDefinition.actionName} cancelled.`);
    }
    case "UPGRADE_CANNONS_WITH_GOLD": {
      const nextCannon = getNextCannon(state);
      const upgradeCost = calcCannonUpgradeCost(state);

      if (!nextCannon) {
        return state;
      }

      if (state.playerLevel < nextCannon.unlockLevel || state.gold < upgradeCost) {
        return state;
      }

      const inventory = {
        ...state.cannonInventory,
        [nextCannon.id]: (state.cannonInventory?.[nextCannon.id] ?? 0) + 1
      };
      const equipped = { ...state.equippedCannons };
      const capacity = getCannonCapacity(state);
      const equippedTotal = getTotalEquippedCannonsFromState(state);
      const lowestEquipped = getLowestEquippedCannonId(state);

      if (equippedTotal < capacity) {
        equipped[nextCannon.id] = (equipped[nextCannon.id] ?? 0) + 1;
      } else if (lowestEquipped) {
        equipped[lowestEquipped] = Math.max(0, (equipped[lowestEquipped] ?? 0) - 1);
        equipped[nextCannon.id] = (equipped[nextCannon.id] ?? 0) + 1;
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - upgradeCost,
        cannonInventory: inventory,
        equippedCannons: equipped,
        cannonTier: nextCannon.tier,
        lastSeen: Date.now()
      }, `Bought cannon upgrade: ${nextCannon.name}.`);
    }
    case "UPGRADE_CANNONS_WITH_MATERIALS": {
      const nextCannon = getNextCannon(state);
      const materialCost = getCannonMaterialUpgradeCost(state);

      if (!nextCannon || !materialCost) {
        return state;
      }

      if (state.playerLevel < nextCannon.unlockLevel || !hasCannonMaterialUpgradeResources(state)) {
        return state;
      }

      const upgradedState = spendCannonMaterialCost(state, materialCost);
      const inventory = {
        ...upgradedState.cannonInventory,
        [nextCannon.id]: (upgradedState.cannonInventory?.[nextCannon.id] ?? 0) + 1
      };
      const equipped = { ...upgradedState.equippedCannons };
      const capacity = getCannonCapacity(upgradedState);
      const equippedTotal = getTotalEquippedCannonsFromState(upgradedState);
      const lowestEquipped = getLowestEquippedCannonId(upgradedState);

      if (equippedTotal < capacity) {
        equipped[nextCannon.id] = (equipped[nextCannon.id] ?? 0) + 1;
      } else if (lowestEquipped) {
        equipped[lowestEquipped] = Math.max(0, (equipped[lowestEquipped] ?? 0) - 1);
        equipped[nextCannon.id] = (equipped[nextCannon.id] ?? 0) + 1;
      }

      return addActivityLogEntry({
        ...upgradedState,
        cannonInventory: inventory,
        equippedCannons: equipped,
        cannonTier: nextCannon.tier,
        lastSeen: Date.now()
      }, `Crafted cannon upgrade: ${nextCannon.name}.`);
    }
    case "SINK_ENEMY_SHIP": {
      const ballsPerBattle = getEffectiveBallsPerBattle(state);

      if (state.cannonballs < ballsPerBattle) {
        return addActivityLogEntry(state, "Not enough cannonballs to sink an enemy ship.", "warning");
      }

      const mapsFound = rollTreasureMapDrops(state, 1);
      const cannonballsRecovered = rollCannonballRecovery(state, 1, ballsPerBattle);
      const battleEnemy = generateEnemy(state);
      const doubloonsGained = rollDoubloonsFromCombat(battleEnemy, 1);
      const { state: rewardedState, goldGained, xpGained } = applyBattleRewards({
          ...state,
          cannonballs: state.cannonballs - ballsPerBattle + cannonballsRecovered
        }, 1, action.xpAmount ?? 5, {
          activeCombatGoldBonus: true
        });
      const doubloonRewardState = addDoubloons(rewardedState, doubloonsGained);
      const doubloonText = doubloonsGained > 0
        ? ` Found ${doubloonsGained} Doubloon${doubloonsGained === 1 ? "" : "s"}.`
        : "";
      const loggedState = addActivityLogEntry(updateQuestProgressMany({
        ...doubloonRewardState,
        treasureMaps: rewardedState.treasureMaps + mapsFound
      }, {
        shipsSunk: 1,
        activeBattlesWon: 1,
        goldEarned: goldGained
      }), `Victory: earned ${Math.round(goldGained)} gold and ${Math.round(xpGained)} XP.${doubloonText} Active combat bonus applied.`);
      const recoveredState = cannonballsRecovered > 0
        ? addActivityLogEntry(loggedState, `Cannon Braces recovered ${formatRecoveredCannonballs(cannonballsRecovered)} cannonballs.`)
        : loggedState;

      return mapsFound > 0
        ? addActivityLogEntry(recoveredState, "Found a treasure map among the wreckage.")
        : recoveredState;
    }
    case "SPEND_TALENT_POINT": {
      const talent = talentDefinitions.find((talentData) => talentData.id === action.talentId);

      if (!talent || !canSpendTalentPoint(state, talent)) {
        return state;
      }

      return addActivityLogEntry(clampHull({
        ...state,
        talentPoints: state.talentPoints - 1,
        talents: {
          ...state.talents,
          [talent.id]: (state.talents[talent.id] ?? 0) + 1
        }
      }), `${talent.name} increased to ${(state.talents[talent.id] ?? 0) + 1}/${talent.maxPoints}.`);
    }
    case "UPGRADE_CREW_MEMBER": {
      const crewMember = crewMembers.find((member) => member.id === action.crewId);

      if (!crewMember) {
        return state;
      }

      const currentLevel = state.crew?.[crewMember.id]?.level ?? 1;

      if (currentLevel >= crewMember.maxLevel) {
        return state;
      }

      const cost = getCrewUpgradeCost(crewMember, currentLevel);
      const hasMaterials =
        (state.materials?.navigationCharts ?? 0) >= (cost.navigationCharts ?? 0) &&
        (state.materials?.compassFragments ?? 0) >= (cost.compassFragments ?? 0) &&
        (state.materials?.gunpowder ?? 0) >= (cost.gunpowder ?? 0) &&
        (state.materials?.cannonParts ?? 0) >= (cost.cannonParts ?? 0) &&
        (state.materials?.ancientRelics ?? 0) >= (cost.ancientRelics ?? 0) &&
        (state.materials?.tradeContracts ?? 0) >= (cost.tradeContracts ?? 0) &&
        (state.materials?.tradeSeals ?? 0) >= (cost.tradeSeals ?? 0) &&
        (state.resources?.fish ?? 0) >= (cost.fish ?? 0) &&
        (state.resources?.whaleOil ?? 0) >= (cost.whaleOil ?? 0) &&
        (state.rareMapPieces ?? 0) >= (cost.rareMapPieces ?? 0);

      if (state.gold < (cost.gold ?? 0) || !hasMaterials) {
        return addActivityLogEntry(state, `Not enough resources to upgrade ${crewMember.name}.`, "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - (cost.gold ?? 0),
        materials: {
          ...state.materials,
          navigationCharts: state.materials.navigationCharts - (cost.navigationCharts ?? 0),
          compassFragments: state.materials.compassFragments - (cost.compassFragments ?? 0),
          gunpowder: state.materials.gunpowder - (cost.gunpowder ?? 0),
          cannonParts: state.materials.cannonParts - (cost.cannonParts ?? 0),
          ancientRelics: state.materials.ancientRelics - (cost.ancientRelics ?? 0),
          tradeContracts: state.materials.tradeContracts - (cost.tradeContracts ?? 0),
          tradeSeals: state.materials.tradeSeals - (cost.tradeSeals ?? 0)
        },
        resources: {
          ...state.resources,
          fish: state.resources.fish - (cost.fish ?? 0),
          whaleOil: state.resources.whaleOil - (cost.whaleOil ?? 0)
        },
        rareMapPieces: state.rareMapPieces - (cost.rareMapPieces ?? 0),
        crew: {
          ...state.crew,
          [crewMember.id]: {
            level: currentLevel + 1
          }
        },
        lastSeen: Date.now()
      }, `${crewMember.role} promoted to Lv. ${currentLevel + 1}.`);
    }
    case "LEVEL_UP":
      if (state.playerLevel >= MAX_PLAYER_LEVEL) {
        return state;
      }

      return {
        ...state,
        playerLevel: state.playerLevel + 1,
        playerXP: 0,
        talentPoints: state.talentPoints + 4,
        lastSeen: Date.now()
      };
    case "START_IDLE":
      if (state.currentBattle) {
        return addActivityLogEntry(state, "Finish your current battle before idling.", "warning");
      }

      if (state.cannonballs <= 0) {
        return addActivityLogEntry(state, "Cannot start idling without cannonballs.", "warning");
      }

      if ((state.hull?.current ?? 0) <= 0) {
        return addActivityLogEntry(state, "Repair your hull before idling.", "warning");
      }

      return {
        ...state,
        isIdling: true,
        idleProgressSeconds: 0,
        lastSeen: Date.now()
      };
    case "STOP_IDLE":
      return {
        ...state,
        isIdling: false,
        idleProgressSeconds: 0,
        lastSeen: Date.now()
      };
    case "TICK_IDLE": {
      if (!state.isIdling) {
        return state;
      }

      const talentBonuses = getTalentBonuses(state);
      const crewBonuses = getCrewBonuses(state);
      const seconds = action.seconds ?? 1;
      const estimate = getIdleCombatEstimate(state);
      const passiveGold = (talentBonuses.passiveGoldPerHour / 3600) * seconds;
      const accumulatedSeconds = (state.idleProgressSeconds ?? 0) + seconds;
      const enemiesByTime = Math.floor(accumulatedSeconds / estimate.secondsPerEnemy);
      const enemiesByCannonballs = Math.floor(state.cannonballs / (estimate.volleysNeeded * estimate.ballsPerVolley));
      const enemiesByHull = Math.floor((state.hull?.current ?? 0) / estimate.hullDamagePerEnemy);
      const enemiesSunk = Math.max(0, Math.min(enemiesByTime, enemiesByCannonballs, enemiesByHull));
      const limitedByCannonballs = enemiesByTime > 0 && enemiesByTime > enemiesByCannonballs && enemiesByCannonballs <= enemiesByHull;
      const limitedByHull = enemiesByTime > 0 && enemiesByTime >= enemiesByHull && enemiesByHull <= enemiesByCannonballs;
      const remainingIdleProgressSeconds = limitedByCannonballs || limitedByHull
        ? 0
        : accumulatedSeconds - enemiesSunk * estimate.secondsPerEnemy;

      if (state.cannonballs <= 0) {
        return addActivityLogEntry({
          ...state,
          isIdling: false,
          idleProgressSeconds: 0,
          cannonballs: 0,
          lastSeen: action.now ?? Date.now()
        }, "Idle combat stopped: not enough cannonballs.", "warning");
      }

      if ((state.hull?.current ?? 0) <= 0) {
        return addActivityLogEntry({
          ...state,
          isIdling: false,
          idleProgressSeconds: 0,
          lastSeen: action.now ?? Date.now()
        }, "Idle combat stopped: your ship was defeated.", "warning");
      }

      if (enemiesSunk <= 0 && !limitedByCannonballs && !limitedByHull) {
        return addLifetimeGold({
          ...state,
          gold: state.gold + passiveGold,
          idleProgressSeconds: accumulatedSeconds,
          lastSeen: action.now ?? Date.now()
        }, passiveGold);
      }

      if (enemiesSunk <= 0 && limitedByCannonballs) {
        return addActivityLogEntry({
          ...state,
          isIdling: false,
          idleProgressSeconds: 0,
          lastSeen: action.now ?? Date.now()
        }, "Idle combat stopped: not enough cannonballs.", "warning");
      }

      if (enemiesSunk <= 0 && limitedByHull) {
        return addActivityLogEntry({
          ...state,
          hull: {
            current: 0,
            max: getMaxHull(state)
          },
          isIdling: false,
          idleProgressSeconds: 0,
          lastSeen: action.now ?? Date.now()
        }, "Idle combat stopped: your ship was defeated.", "warning");
      }

      const volleysFired = enemiesSunk * estimate.volleysNeeded;
      const cannonballsSpent = volleysFired * estimate.ballsPerVolley;
      const hullDamageTaken = enemiesSunk * estimate.hullDamagePerEnemy;
      const cannonballsRecovered = rollCannonballRecovery(state, enemiesSunk, estimate.volleysNeeded * estimate.ballsPerVolley);
      const mapsFound = rollEnemyMapDrops(estimate.enemy.mapDropChance, enemiesSunk);
      const rareMapPiecesFound = rollRareMapPieces(0.0005, enemiesSunk);
      const goldEarned = enemiesSunk * estimate.enemy.goldReward * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier;
      const xpEarned = enemiesSunk * estimate.enemy.xpReward * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier;
      const xpState = applyXp({
        ...state,
        gold: state.gold + goldEarned + passiveGold,
        cannonballs: Math.max(0, state.cannonballs - cannonballsSpent + cannonballsRecovered),
        hull: {
          current: Math.max(0, (state.hull?.current ?? getMaxHull(state)) - hullDamageTaken),
          max: getMaxHull(state)
        },
        idleProgressSeconds: remainingIdleProgressSeconds,
        isIdling: !(limitedByCannonballs || limitedByHull),
        totalShipsSunk: state.totalShipsSunk + enemiesSunk,
        treasureMaps: state.treasureMaps + mapsFound,
        rareMapPieces: state.rareMapPieces + rareMapPiecesFound,
        lastSeen: action.now ?? Date.now()
      }, xpEarned);
      const idleState = addLifetimeShipsSunk(addLifetimeGold(xpState, goldEarned + passiveGold), enemiesSunk);
      const recoveredState = cannonballsRecovered > 0
        ? addActivityLogEntry(idleState, `Cannon Braces recovered ${formatRecoveredCannonballs(cannonballsRecovered)} cannonballs while idling.`)
        : idleState;
      const mapState = mapsFound > 0
        ? addActivityLogEntry(recoveredState, `Your crew recovered ${mapsFound} treasure map${mapsFound === 1 ? "" : "s"} while idling.`)
        : recoveredState;
      const rareMapPieceState = rareMapPiecesFound > 0
        ? addActivityLogEntry(mapState, "You discovered a Rare Map Piece.")
        : mapState;
      const stoppedState = limitedByCannonballs
        ? addActivityLogEntry(rareMapPieceState, "Idle combat stopped: not enough cannonballs.", "warning")
        : limitedByHull
          ? addActivityLogEntry(rareMapPieceState, "Idle combat stopped: your ship was defeated.", "warning")
          : rareMapPieceState;

      return addActivityLogEntry(stoppedState, `Idle combat defeated ${enemiesSunk} ${estimate.enemy.name}${enemiesSunk === 1 ? "" : "s"}.`);
    }
    case "APPLY_OFFLINE_PROGRESS":
      return applyXp(addLifetimeGold({
        ...state,
        gold: state.gold + (action.goldGained ?? 0),
        lastSeen: action.now ?? Date.now()
      }, action.goldGained ?? 0), action.xpGained ?? 0);
    case "CLAIM_QUEST_REWARD": {
      const quest = findQuestById(state.quests, action.questId);

      if (!quest || quest.claimed || (quest.progress ?? 0) < quest.target) {
        return state;
      }

      const claimedState = claimQuestById(state, quest.id);

      if (!claimedState) {
        return state;
      }

      const questRewardState = addDoubloons(addLifetimeGold({
        ...claimedState,
        gold: claimedState.gold + (quest.rewardGold ?? 0),
        talentPoints: claimedState.talentPoints + (quest.rewardTalentPoints ?? 0),
        materials: quest.rewardMaterials ? mergeMaterials(claimedState.materials, quest.rewardMaterials) : claimedState.materials,
        lastSeen: Date.now()
      }, quest.rewardGold ?? 0), quest.rewardDoubloons ?? 0);

      return addActivityLogEntry(questRewardState, `Quest completed: ${quest.title}`);
    }
    case "CLAIM_ACHIEVEMENT": {
      const achievement = achievements.find((achievementData) => achievementData.id === action.achievementId);

      if (
        !achievement ||
        (state.claimedAchievements ?? []).includes(achievement.id) ||
        !isAchievementUnlocked(achievement, state)
      ) {
        return state;
      }

      const doubloonsRewarded = achievement.rewardDoubloons ?? 0;
      const rewardedState = updateQuestProgressMany(addDoubloons(addLifetimeGold({
        ...state,
        gold: state.gold + achievement.rewardGold,
        talentPoints: state.talentPoints + achievement.rewardTalentPoints,
        claimedAchievements: [...(state.claimedAchievements ?? []), achievement.id],
        lastSeen: Date.now()
      }, achievement.rewardGold), doubloonsRewarded), {
        achievementsClaimed: 1,
        goldEarned: achievement.rewardGold
      });
      const doubloonText = doubloonsRewarded > 0
        ? ` Found ${doubloonsRewarded} Doubloon${doubloonsRewarded === 1 ? "" : "s"}.`
        : "";

      return addActivityLogEntry(rewardedState, `Achievement claimed: ${achievement.name}.${doubloonText}`);
    }
    case "CLAIM_OFFLINE_REWARDS": {
      if (!state.pendingOfflineRewards) {
        return {
          ...state,
          offlineSummaryVisible: false,
          lastSeen: Date.now()
        };
      }

      const rewards = state.pendingOfflineRewards;
      const netCannonballsUsed = rewards.netCannonballsUsed ?? rewards.cannonballsUsed ?? 0;
      const enemiesSunk = rewards.enemiesSunk ?? rewards.shipsSunk ?? 0;
      const hullDamageTaken = rewards.hullDamageTaken ?? 0;
      const doubloonsEarned = rewards.doubloonsEarned ?? 0;
      const baseRewardState = updateQuestProgressMany(addDoubloons(addLifetimeShipsSunk(addLifetimeGold({
        ...state,
        gold: state.gold + rewards.goldEarned,
        cannonballs: Math.max(0, state.cannonballs - netCannonballsUsed),
        hull: {
          current: Math.max(0, (state.hull?.current ?? getMaxHull(state)) - hullDamageTaken),
          max: getMaxHull(state)
        },
        totalShipsSunk: state.totalShipsSunk + enemiesSunk,
        treasureMaps: state.treasureMaps + (rewards.mapsFound ?? 0),
        rareMapPieces: state.rareMapPieces + (rewards.rareMapPiecesFound ?? 0),
        pendingOfflineRewards: null,
        offlineSummaryVisible: false,
        lastSeen: Date.now()
      }, rewards.goldEarned), enemiesSunk), doubloonsEarned), {
        shipsSunk: enemiesSunk,
        goldEarned: rewards.goldEarned
      });
      const xpState = applyXp(baseRewardState, rewards.xpEarned);
      const doubloonText = doubloonsEarned > 0
        ? ` Recovered ${doubloonsEarned} Doubloon${doubloonsEarned === 1 ? "" : "s"}.`
        : "";

      return addActivityLogEntry(xpState, `Claimed offline rewards.${doubloonText}`);
    }
    case "DISMISS_OFFLINE_REWARDS":
      return {
        ...state,
        pendingOfflineRewards: null,
        offlineSummaryVisible: false,
        lastSeen: Date.now()
      };
    case "SAVE_EXPORTED":
      return addActivityLogEntry(state, "Save exported.");
    case "SAVE_RESET_REQUESTED":
      return addActivityLogEntry(state, "Save reset requested.", "warning");
    case "DEBUG_ADD_GOLD":
      return addActivityLogEntry(addLifetimeGold({
        ...state,
        gold: state.gold + 10000,
        lastSeen: Date.now()
      }, 10000), "Developer tool used: added gold.", "warning");
    case "DEBUG_ADD_CANNONBALLS":
      return addActivityLogEntry({
        ...state,
        cannonballs: state.cannonballs + 100,
        lastSeen: Date.now()
      }, "Developer tool used: added cannonballs.", "warning");
    case "DEBUG_ADD_TALENT_POINTS":
      return addActivityLogEntry({
        ...state,
        talentPoints: state.talentPoints + 10,
        lastSeen: Date.now()
      }, "Developer tool used: added talent points.", "warning");
    case "DEBUG_ADD_MATERIALS_BUNDLE":
      return addActivityLogEntry({
        ...state,
        materials: mergeMaterials(state.materials, {
          navigationCharts: 50,
          compassFragments: 10,
          gunpowder: 200,
          cannonParts: 50,
          ancientRelics: 25,
          tradeContracts: 20,
          tradeSeals: 5
        }),
        resources: {
          ...state.resources,
          fish: state.resources.fish + 100,
          whaleOil: state.resources.whaleOil + 25
        },
        rareMapPieces: state.rareMapPieces + 2,
        lastSeen: Date.now()
      }, "Developer tool used: added basic materials bundle.", "warning");
    case "DEBUG_REPAIR_FULL":
      return addActivityLogEntry({
        ...state,
        hull: {
          current: getMaxHull(state),
          max: getMaxHull(state)
        },
        lastSeen: Date.now()
      }, "Developer tool used: repaired hull to full.", "warning");
    case "TRIGGER_RANDOM_WORLD_EVENT": {
      const nextEvent = weightedRandomWorldEvent();

      if (!nextEvent) {
        return state;
      }

      const now = action.now ?? Date.now();
      const worldEventState = createWorldEventState(nextEvent, now);
      return addActivityLogEntry({
        ...state,
        activeWorldEvent: worldEventState,
        lastWorldEventGeneratedAt: now,
        lifetimeStats: {
          ...state.lifetimeStats,
          worldEventsSeen: (state.lifetimeStats?.worldEventsSeen ?? 0) + 1,
          cursedFogEventsSeen: (state.lifetimeStats?.cursedFogEventsSeen ?? 0) + (nextEvent.id === "cursedFog" ? 1 : 0)
        }
      }, `World Event Started: ${nextEvent.name}.`);
    }
    case "CLEAR_ACTIVE_WORLD_EVENT": {
      if (!state.activeWorldEvent) {
        return state;
      }

      const now = action.now ?? Date.now();
      return addActivityLogEntry({
        ...state,
        activeWorldEvent: null,
        lastWorldEventGeneratedAt: now,
        lastSeen: now
      }, `World Event Ended: ${state.activeWorldEvent.name}.`);
    }
    default:
      return state;
  }
}

export function useGameState() {
  const [gameState, dispatch] = useReducer(gameStateReducer, undefined, loadSavedState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    function handleBeforeUnload() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...gameState,
        lastSeen: Date.now()
      }));
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameState]);

  useEffect(() => {
    if (!gameState.isIdling) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: "TICK_IDLE", seconds: 1, now: Date.now() });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [gameState.isIdling]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      dispatch({ type: "QUEST_CLOCK_TICK", now: Date.now() });
    }, 60 * 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      dispatch({ type: "WORLD_EVENT_TICK", now: Date.now() });
    }, 60 * 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return { gameState, dispatch };
}

export { initialState, gameStateReducer };
