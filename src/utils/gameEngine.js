import { levels } from "../data/levels.js";
import { ships } from "../data/ships.js";

export function getXpRequired(level) {
  return levels.find((levelData) => levelData.level === level)?.xpRequired ?? Infinity;
}

export function getCurrentShip(gameState) {
  return ships.find((ship) => ship.id === gameState.currentShipId) ?? ships[0];
}

export function calcIdleProgress(lastSeen, now, gameState) {
  const elapsedSeconds = Math.max(0, Math.floor((now - lastSeen) / 1000));
  const currentShip = getCurrentShip(gameState);
  const shipsSunk = (currentShip.shipsPerHour / 3600) * elapsedSeconds;

  return {
    goldGained: shipsSunk * currentShip.goldPerShip,
    xpGained: shipsSunk * currentShip.xpPerShip
  };
}

export function calcDamagePerShot(cannonTier, talentBonuses) {
  return cannonTier + Number(Boolean(talentBonuses));
}

export function calcReloadTime(baseCooldown, talentBonuses) {
  return baseCooldown - Number(Boolean(talentBonuses));
}

export function calcGoldPerHour(gameState) {
  const currentShip = getCurrentShip(gameState);
  return currentShip.shipsPerHour * currentShip.goldPerShip;
}

export function calcXpPerHour(gameState) {
  const currentShip = getCurrentShip(gameState);
  return currentShip.shipsPerHour * currentShip.xpPerShip;
}

export function calcOfflineCap(talentBonuses) {
  return Number(Boolean(talentBonuses));
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1
  }).format(value);
}
