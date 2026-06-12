import { useEffect, useReducer } from "react";

const STORAGE_KEY = "sot_save";

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
  lastSeen: Date.now()
};

function loadSavedState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? { ...initialState, ...JSON.parse(savedState) } : initialState;
  } catch {
    return initialState;
  }
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
      return {
        ...state,
        playerXP: state.playerXP + (action.amount ?? 0)
      };
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
    case "APPLY_OFFLINE_PROGRESS":
      return {
        ...state,
        gold: state.gold + (action.goldGained ?? 0),
        playerXP: state.playerXP + (action.xpGained ?? 0),
        lastSeen: action.now ?? Date.now()
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

  return { gameState, dispatch };
}

export { initialState, gameStateReducer };
