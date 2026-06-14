import { useEffect, useReducer } from "react";
import { ships } from "../data/ships.js";
import {
  calcCannonUpgradeCost,
  calcOfflineProgress,
  getCurrentCannon,
  getCurrentShip,
  getNextCannon,
  getXpRequired
} from "../utils/gameEngine.js";

const STORAGE_KEY = "sot_save";
const MAX_PLAYER_LEVEL = 15;

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
  talents: {},
  skills: {},
  activityLog: [],
  pendingOfflineRewards: null,
  offlineSummaryVisible: false,
  isIdling: false,
  lastSeen: Date.now()
};

function loadSavedState() {
  const now = Date.now();

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      return { ...initialState, lastSeen: now };
    }

    const parsedState = JSON.parse(savedState);
    const restoredState = {
      ...initialState,
      ...parsedState,
      activityLog: Array.isArray(parsedState.activityLog) ? parsedState.activityLog : [],
      isIdling: false,
      pendingOfflineRewards: null,
      offlineSummaryVisible: false
    };

    if (parsedState.pendingOfflineRewards && parsedState.offlineSummaryVisible) {
      return {
        ...restoredState,
        pendingOfflineRewards: parsedState.pendingOfflineRewards,
        offlineSummaryVisible: true,
        lastSeen: now
      };
    }

    const offlineRewards = calcOfflineProgress(restoredState.lastSeen, now, restoredState);

    if (!offlineRewards) {
      return {
        ...restoredState,
        lastSeen: now
      };
    }

    return {
      ...restoredState,
      pendingOfflineRewards: offlineRewards,
      offlineSummaryVisible: true,
      lastSeen: now
    };
  } catch {
    return { ...initialState, lastSeen: now };
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
  const goldGained = battles * currentShip.goldPerShip;
  const xpGained = battles * xpPerBattle;
  const xpState = applyXp(state, xpGained);

  return {
    ...xpState,
    gold: xpState.gold + goldGained,
    totalShipsSunk: xpState.totalShipsSunk + battles
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
        ...applyXp(state, action.amount ?? 0),
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
      const currentCannon = getCurrentCannon(state);

      if (state.cannonballs < currentCannon.ballsPerBattle) {
        return addActivityLogEntry(state, "Not enough cannonballs to sink an enemy ship.", "warning");
      }

      return addActivityLogEntry({
        ...applyBattleRewards({
          ...state,
          cannonballs: state.cannonballs - currentCannon.ballsPerBattle
        }, 1, action.xpAmount ?? 5)
      }, `Sank an enemy ship: +${action.xpAmount ?? 5} XP, +${getCurrentShip(state).goldPerShip} gold.`);
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
      const currentCannon = getCurrentCannon(state);
      const seconds = action.seconds ?? 1;
      const shipsSunk = (currentShip.shipsPerHour / 3600) * seconds;
      const cannonballsNeeded = shipsSunk * currentCannon.ballsPerBattle;

      if (state.cannonballs <= 0) {
        return addActivityLogEntry({
          ...state,
          isIdling: false,
          cannonballs: 0,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");
      }

      if (state.cannonballs < cannonballsNeeded) {
        const possibleBattles = state.cannonballs / currentCannon.ballsPerBattle;
        const partialRewardState = applyBattleRewards({
          ...state,
          cannonballs: 0
        }, possibleBattles, currentShip.xpPerShip);

        return addActivityLogEntry({
          ...partialRewardState,
          isIdling: false,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");
      }

      const remainingCannonballs = state.cannonballs - cannonballsNeeded;
      const rewardState = applyBattleRewards({
        ...state,
        cannonballs: remainingCannonballs
      }, shipsSunk, currentShip.xpPerShip);

      if (remainingCannonballs <= 0) {
        return addActivityLogEntry({
          ...rewardState,
          isIdling: false,
          cannonballs: 0,
          lastSeen: action.now ?? Date.now()
        }, "The ship ran out of cannonballs and stopped idling.", "warning");
      }

      return {
        ...rewardState,
        lastSeen: action.now ?? Date.now()
      };
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
