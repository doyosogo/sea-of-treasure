import { useEffect, useReducer } from "react";
import { getCurrentShip, getXpRequired } from "../utils/gameEngine.js";

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
  talentPoints: 0,
  talents: {},
  skills: {},
  isIdling: false,
  lastSeen: Date.now()
};

function loadSavedState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? { ...initialState, ...JSON.parse(savedState), isIdling: false } : initialState;
  } catch {
    return initialState;
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

function gameStateReducer(state, action) {
  switch (action.type) {
    case "BUY_SHIP":
      return {
        ...state,
        ownedShips: state.ownedShips.includes(action.shipId)
          ? state.ownedShips
          : [...state.ownedShips, action.shipId],
        currentShipId: action.shipId ?? state.currentShipId
      };
    case "GAIN_XP":
      return applyXp(state, action.amount ?? 0);
    case "GAIN_GOLD":
      return {
        ...state,
        gold: state.gold + (action.amount ?? 0)
      };
    case "SPEND_GOLD":
      return {
        ...state,
        gold: Math.max(0, state.gold - (action.amount ?? 0))
      };
    case "BUY_CANNONBALLS":
      return {
        ...state,
        cannonballs: state.cannonballs + (action.amount ?? 0)
      };
    case "LEVEL_UP":
      if (state.playerLevel >= MAX_PLAYER_LEVEL) {
        return state;
      }

      return {
        ...state,
        playerLevel: state.playerLevel + 1,
        playerXP: 0,
        talentPoints: state.talentPoints + 4
      };
    case "START_IDLE":
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
      const seconds = action.seconds ?? 1;
      const shipsSunk = (currentShip.shipsPerHour / 3600) * seconds;
      const goldGained = shipsSunk * currentShip.goldPerShip;
      const xpGained = shipsSunk * currentShip.xpPerShip;
      const xpState = applyXp(state, xpGained);

      return {
        ...xpState,
        gold: xpState.gold + goldGained,
        lastSeen: action.now ?? Date.now()
      };
    }
    case "APPLY_OFFLINE_PROGRESS":
      return applyXp({
        ...state,
        gold: state.gold + (action.goldGained ?? 0),
        lastSeen: action.now ?? Date.now()
      }, action.xpGained ?? 0);
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
