import { cannons } from "../data/cannons.js";
import { levels } from "../data/levels.js";
import { ships } from "../data/ships.js";

export function getXpRequired(level) {
  return levels.find((levelData) => levelData.level === level)?.xpRequired ?? Infinity;
}

export function getCurrentShip(gameState) {
  return ships.find((ship) => ship.id === gameState.currentShipId) ?? ships[0];
}

export function getCurrentCannon(gameState) {
  return cannons.find((cannon) => cannon.tier === gameState.cannonTier) ?? cannons[0];
}

export function getNextCannon(gameState) {
  return cannons.find((cannon) => cannon.tier === gameState.cannonTier + 1) ?? null;
}

export function calcCannonUpgradeCost(gameState) {
  const currentShip = getCurrentShip(gameState);
  const nextCannon = getNextCannon(gameState);
  return nextCannon ? currentShip.cannons * nextCannon.upgradeCostPerCannon : 0;
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

export function calcOfflineCap() {
  return 24 * 60 * 60 * 1000;
}

export function calcOfflineProgress(lastSeen, now, gameState) {
  const timeAwayMs = Math.max(0, now - lastSeen);

  if (timeAwayMs < 60 * 1000) {
    return null;
  }

  const offlineCapMs = calcOfflineCap(gameState);
  let effectiveTimeMs = Math.min(timeAwayMs, offlineCapMs);
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  let stoppedReason = timeAwayMs > offlineCapMs ? "offline_cap_reached" : null;
  let shipsSunk = (currentShip.shipsPerHour * effectiveTimeMs) / (60 * 60 * 1000);
  let cannonballsUsed = shipsSunk * currentCannon.ballsPerBattle;

  if (cannonballsUsed > gameState.cannonballs) {
    shipsSunk = gameState.cannonballs / currentCannon.ballsPerBattle;
    cannonballsUsed = gameState.cannonballs;
    effectiveTimeMs = currentShip.shipsPerHour > 0
      ? (shipsSunk / currentShip.shipsPerHour) * 60 * 60 * 1000
      : 0;
    stoppedReason = "out_of_cannonballs";
  }

  return {
    timeAwayMs,
    effectiveTimeMs,
    shipsSunk,
    goldEarned: shipsSunk * currentShip.goldPerShip,
    xpEarned: shipsSunk * currentShip.xpPerShip,
    cannonballsUsed,
    stoppedReason
  };
}

export function calcDamagePerShot(cannonTier, talentBonuses) {
  const cannon = cannons.find((cannonData) => cannonData.tier === cannonTier) ?? cannons[0];
  return cannon.damage + Number(Boolean(talentBonuses));
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

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1
  }).format(value);
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}
