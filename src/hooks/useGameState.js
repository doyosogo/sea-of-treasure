import { useEffect, useReducer } from "react";
import { skills as skillDefinitions } from "../data/skills.js";
import { talents as talentDefinitions } from "../data/talents.js";
import { rareTreasures, treasureSites } from "../data/treasures.js";
import { tradeGoods } from "../data/tradeGoods.js";
import { ships } from "../data/ships.js";
import {
  calcCannonUpgradeCost,
  calcOfflineProgress,
  canSpendTalentPoint,
  generateMarketPrices,
  getCargoCapacity,
  getEffectiveBallsPerBattle,
  getFishSellValue,
  getCurrentCannon,
  getCurrentShip,
  getNextCannon,
  getMarketCooldownRemaining,
  getTalentBonuses,
  getTradeGoodBuyPrice,
  getTradeGoodSellPrice,
  getUsedCargo,
  getWhaleOilSellValue,
  getXpRequired,
  rollTreasureMapDrops
} from "../utils/gameEngine.js";

const STORAGE_KEY = "sot_save";
const MAX_PLAYER_LEVEL = 15;
const BASE_SKILL_XP_REWARD = 100;
const MARKET_REFRESH_COOLDOWN_MS = 10800000;

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

const initialState = {
  playerLevel: 1,
  playerXP: 0,
  gold: 0,
  currentShipId: 1,
  ownedShips: [1],
  cannonTier: 1,
  cannonballs: 100,
  totalShipsSunk: 0,
  talentPoints: 0,
  talents: createInitialTalents(),
  skills: createInitialSkills(),
  cargo: createInitialCargo(),
  resources: createInitialResources(),
  marketPrices: generateMarketPrices(),
  marketLastRefreshed: Date.now(),
  marketCycleStartedAt: Date.now(),
  marketTradeLimit: 102,
  marketTradeUsed: 0,
  marketRefreshCooldownMs: MARKET_REFRESH_COOLDOWN_MS,
  treasureMaps: 3,
  activeTreasureDig: null,
  treasureInventory: [],
  activityLog: [],
  pendingOfflineRewards: null,
  offlineSummaryVisible: false,
  isIdling: false,
  lastSeen: Date.now()
};

function normalizeResources(savedResources = {}) {
  return {
    fish: Math.max(0, savedResources.fish ?? 0),
    whaleOil: Math.max(0, savedResources.whaleOil ?? 0)
  };
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
      activityLog: Array.isArray(parsedState.activityLog) ? parsedState.activityLog : [],
      talents: normalizeTalents(parsedState.talents),
      skills: normalizeSkills(parsedState.skills),
      cargo: normalizeCargo(parsedState.cargo),
      resources: normalizeResources(parsedState.resources),
      marketPrices: normalizeMarketPrices(parsedState.marketPrices),
      marketLastRefreshed: parsedState.marketLastRefreshed ?? now,
      marketRefreshCooldownMs: parsedState.marketRefreshCooldownMs ?? MARKET_REFRESH_COOLDOWN_MS,
      treasureMaps: parsedState.treasureMaps ?? 3,
      activeTreasureDig: parsedState.activeTreasureDig ?? null,
      treasureInventory: normalizeTreasureInventory(parsedState.treasureInventory),
      isIdling: false,
      pendingOfflineRewards: null,
      offlineSummaryVisible: false
    };
    const normalizedState = {
      ...restoredState,
      marketCycleStartedAt: parsedState.marketCycleStartedAt ?? now,
      marketTradeLimit: parsedState.marketTradeLimit ?? getCargoCapacity(restoredState),
      marketTradeUsed: parsedState.marketTradeUsed ?? 0
    };

    if (parsedState.pendingOfflineRewards && parsedState.offlineSummaryVisible) {
      return {
        ...normalizedState,
        pendingOfflineRewards: parsedState.pendingOfflineRewards,
        offlineSummaryVisible: true,
        lastSeen: now
      };
    }

    const offlineRewards = calcOfflineProgress(normalizedState.lastSeen, now, normalizedState);

    if (!offlineRewards) {
      return {
        ...normalizedState,
        lastSeen: now
      };
    }

    return {
      ...normalizedState,
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

function applyBattleRewards(state, battles, xpPerBattle) {
  const currentShip = getCurrentShip(state);
  const talentBonuses = getTalentBonuses(state);
  const goldGained = battles * currentShip.goldPerShip * talentBonuses.goldMultiplier;
  const xpGained = battles * xpPerBattle * talentBonuses.xpMultiplier;
  const xpState = applyXp(state, xpGained);

  return {
    ...xpState,
    gold: xpState.gold + goldGained,
    totalShipsSunk: xpState.totalShipsSunk + battles
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

function getRareTreasure(now) {
  const rareTreasure = rareTreasures[randomInt(0, rareTreasures.length - 1)];

  return {
    id: `${rareTreasure.id}_${now}`,
    name: rareTreasure.name,
    rarity: rareTreasure.rarity,
    foundAt: now
  };
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
  switch (action.type) {
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

      return addActivityLogEntry({
        ...state,
        gold: state.gold - ship.purchaseCost,
        ownedShips: [...state.ownedShips, ship.id],
        currentShipId: ship.id
      }, `${ship.name} joined the fleet.`);
    }
    case "SET_ACTIVE_SHIP":
      if (!state.ownedShips.includes(action.shipId)) {
        return state;
      }

      return {
        ...state,
        currentShipId: action.shipId,
        lastSeen: Date.now()
      };
    case "GAIN_XP":
      return {
        ...applyXp(state, (action.amount ?? 0) * getTalentBonuses(state).xpMultiplier),
        lastSeen: Date.now()
      };
    case "GAIN_GOLD":
      return {
        ...state,
        gold: state.gold + (action.amount ?? 0),
        lastSeen: Date.now()
      };
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
      const levelText = levelsGained > 0 ? ` Trading gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";

      return addActivityLogEntry({
        ...state,
        gold: state.gold + getTradeGoodSellPrice(state, good) * quantity,
        talentPoints: state.talentPoints + levelsGained,
        skills: {
          ...state.skills,
          trading: updatedTrading
        },
        cargo: {
          ...state.cargo,
          [good.id]: state.cargo[good.id] - quantity
        }
      }, `Sold ${quantity} ${good.name}. +${Math.round(tradingXpGained)} Trading XP.${levelText}`);
    }
    case "SELL_FISH": {
      const quantity = action.quantity === "all"
        ? state.resources.fish
        : Math.max(0, Math.floor(action.quantity ?? 0));

      if (quantity <= 0 || state.resources.fish < quantity) {
        return addActivityLogEntry(state, "Not enough Fish to sell.", "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold + getFishSellValue(state) * quantity,
        resources: {
          ...state.resources,
          fish: state.resources.fish - quantity
        }
      }, `Sold ${quantity} Fish.`);
    }
    case "SELL_WHALE_OIL": {
      const quantity = action.quantity === "all"
        ? state.resources.whaleOil
        : Math.max(0, Math.floor(action.quantity ?? 0));

      if (quantity <= 0 || state.resources.whaleOil < quantity) {
        return addActivityLogEntry(state, "Not enough Whale Oil to sell.", "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold + getWhaleOilSellValue(state) * quantity,
        resources: {
          ...state.resources,
          whaleOil: state.resources.whaleOil - quantity
        }
      }, `Sold ${quantity} Whale Oil.`);
    }
    case "BUY_CANNONBALLS": {
      const currentCannon = getCurrentCannon(state);

      if (state.gold < currentCannon.goldPer100Balls) {
        return addActivityLogEntry(state, "Not enough gold to buy cannonballs.", "warning");
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - currentCannon.goldPer100Balls,
        cannonballs: state.cannonballs + 100
      }, `Bought 100 ${currentCannon.name} cannonballs.`);
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
      const goldReward = randomInt(site.goldMin, site.goldMax) * talentBonuses.goldMultiplier;
      const xpReward = site.xpReward * talentBonuses.xpMultiplier;
      const rareChance = site.rareChance * talentBonuses.treasureChanceMultiplier;
      const rareFound = Math.random() < rareChance ? getRareTreasure(now) : null;
      const { skillState: updatedTreasureSkill, levelsGained } = applySkillXp(
        treasureSkillDefinition,
        state.skills.treasureHunting,
        xpReward
      );
      const levelText = levelsGained > 0 ? ` Treasure Hunting gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.` : "";
      const rareText = rareFound ? ` Found ${rareFound.name}.` : "";

      return addActivityLogEntry({
        ...state,
        gold: state.gold + goldReward,
        talentPoints: state.talentPoints + levelsGained,
        activeTreasureDig: null,
        treasureInventory: rareFound ? [rareFound, ...state.treasureInventory] : state.treasureInventory,
        skills: {
          ...state.skills,
          treasureHunting: updatedTreasureSkill
        }
      }, `${site.name} dig complete: +${Math.round(goldReward)} gold, +${Math.round(xpReward)} Treasure Hunting XP.${rareText}${levelText}`);
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

      return addActivityLogEntry({
        ...state,
        gold: state.gold + goldReward,
        talentPoints: state.talentPoints + levelsGained,
        resources: fishingReward ? {
          ...state.resources,
          fish: state.resources.fish + fishingReward.fish,
          whaleOil: state.resources.whaleOil + fishingReward.whaleOil
        } : state.resources,
        skills: {
          ...state.skills,
          [skillDefinition.id]: rewardedSkillState
        }
      }, `${skillDefinition.actionName} complete: +${Math.round(skillXpReward)} ${skillDefinition.name} XP.${goldText}${fishText}${whaleOilText}${levelText}`);
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
    case "UPGRADE_CANNONS": {
      const nextCannon = getNextCannon(state);
      const upgradeCost = calcCannonUpgradeCost(state);

      if (!nextCannon) {
        return state;
      }

      if (state.playerLevel < nextCannon.unlockLevel || state.gold < upgradeCost) {
        return state;
      }

      return addActivityLogEntry({
        ...state,
        gold: state.gold - upgradeCost,
        cannonTier: nextCannon.tier
      }, `Cannons upgraded to ${nextCannon.name}.`);
    }
    case "SINK_ENEMY_SHIP": {
      const ballsPerBattle = getEffectiveBallsPerBattle(state);

      if (state.cannonballs < ballsPerBattle) {
        return addActivityLogEntry(state, "Not enough cannonballs to sink an enemy ship.", "warning");
      }

      const mapsFound = rollTreasureMapDrops(state, 1);
      const rewardedState = applyBattleRewards({
          ...state,
          cannonballs: state.cannonballs - ballsPerBattle
        }, 1, action.xpAmount ?? 5);
      const loggedState = addActivityLogEntry({
        ...rewardedState,
        treasureMaps: rewardedState.treasureMaps + mapsFound
      }, `Sank an enemy ship: +${action.xpAmount ?? 5} XP, +${getCurrentShip(state).goldPerShip} gold.`);

      return mapsFound > 0
        ? addActivityLogEntry(loggedState, "Found a treasure map among the wreckage.")
        : loggedState;
    }
    case "SPEND_TALENT_POINT": {
      const talent = talentDefinitions.find((talentData) => talentData.id === action.talentId);

      if (!talent || !canSpendTalentPoint(state, talent)) {
        return state;
      }

      return addActivityLogEntry({
        ...state,
        talentPoints: state.talentPoints - 1,
        talents: {
          ...state.talents,
          [talent.id]: (state.talents[talent.id] ?? 0) + 1
        }
      }, `${talent.name} increased to ${(state.talents[talent.id] ?? 0) + 1}/${talent.maxPoints}.`);
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
      if (state.cannonballs <= 0) {
        return addActivityLogEntry(state, "Cannot start idling without cannonballs.", "warning");
      }

      return {
        ...state,
        isIdling: true,
        lastSeen: Date.now()
      };
    case "STOP_IDLE":
      return {
        ...state,
        isIdling: false,
        lastSeen: Date.now()
      };
    case "TICK_IDLE": {
      if (!state.isIdling) {
        return state;
      }

      const currentShip = getCurrentShip(state);
      const talentBonuses = getTalentBonuses(state);
      const seconds = action.seconds ?? 1;
      const ballsPerBattle = getEffectiveBallsPerBattle(state);
      const shipsSunk = (currentShip.shipsPerHour / 3600) * seconds;
      const cannonballsNeeded = shipsSunk * ballsPerBattle;

      if (state.cannonballs <= 0) {
        return addActivityLogEntry({
          ...state,
          isIdling: false,
          cannonballs: 0,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");
      }

      if (state.cannonballs < cannonballsNeeded) {
        const possibleBattles = state.cannonballs / ballsPerBattle;
        const mapsFound = rollTreasureMapDrops(state, possibleBattles);
        const effectiveSeconds = currentShip.shipsPerHour > 0
          ? (possibleBattles / currentShip.shipsPerHour) * 3600
          : 0;
        const partialRewardState = applyBattleRewards({
          ...state,
          cannonballs: 0
        }, possibleBattles, currentShip.xpPerShip);

        const stoppedState = addActivityLogEntry({
          ...partialRewardState,
          gold: partialRewardState.gold + ((talentBonuses.passiveGoldPerHour / 3600) * effectiveSeconds),
          treasureMaps: partialRewardState.treasureMaps + mapsFound,
          isIdling: false,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");

        return mapsFound > 0
          ? addActivityLogEntry(stoppedState, `Your crew recovered ${mapsFound} treasure map${mapsFound === 1 ? "" : "s"} while idling.`)
          : stoppedState;
      }

      const remainingCannonballs = state.cannonballs - cannonballsNeeded;
      const mapsFound = rollTreasureMapDrops(state, shipsSunk);
      const rewardState = applyBattleRewards({
        ...state,
        cannonballs: remainingCannonballs
      }, shipsSunk, currentShip.xpPerShip);

      if (remainingCannonballs <= 0) {
        const depletedState = addActivityLogEntry({
          ...rewardState,
          gold: rewardState.gold + ((talentBonuses.passiveGoldPerHour / 3600) * seconds),
          treasureMaps: rewardState.treasureMaps + mapsFound,
          isIdling: false,
          cannonballs: 0,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");

        return mapsFound > 0
          ? addActivityLogEntry(depletedState, `Your crew recovered ${mapsFound} treasure map${mapsFound === 1 ? "" : "s"} while idling.`)
          : depletedState;
      }

      const idleState = {
        ...rewardState,
        gold: rewardState.gold + ((talentBonuses.passiveGoldPerHour / 3600) * seconds),
        treasureMaps: rewardState.treasureMaps + mapsFound,
        lastSeen: action.now ?? Date.now()
      };

      return mapsFound > 0
        ? addActivityLogEntry(idleState, `Your crew recovered ${mapsFound} treasure map${mapsFound === 1 ? "" : "s"} while idling.`)
        : idleState;
    }
    case "APPLY_OFFLINE_PROGRESS":
      return applyXp({
        ...state,
        gold: state.gold + (action.goldGained ?? 0),
        lastSeen: action.now ?? Date.now()
      }, action.xpGained ?? 0);
    case "CLAIM_OFFLINE_REWARDS": {
      if (!state.pendingOfflineRewards) {
        return {
          ...state,
          offlineSummaryVisible: false,
          lastSeen: Date.now()
        };
      }

      const rewards = state.pendingOfflineRewards;
      const xpState = applyXp({
        ...state,
        gold: state.gold + rewards.goldEarned,
        cannonballs: Math.max(0, state.cannonballs - rewards.cannonballsUsed),
        totalShipsSunk: state.totalShipsSunk + rewards.shipsSunk,
        treasureMaps: state.treasureMaps + (rewards.mapsFound ?? 0),
        pendingOfflineRewards: null,
        offlineSummaryVisible: false,
        lastSeen: Date.now()
      }, rewards.xpEarned);

      return addActivityLogEntry(xpState, "Claimed offline rewards.");
    }
    case "DISMISS_OFFLINE_REWARDS":
      return {
        ...state,
        pendingOfflineRewards: null,
        offlineSummaryVisible: false,
        lastSeen: Date.now()
      };
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

  return { gameState, dispatch };
}

export { initialState, gameStateReducer };
