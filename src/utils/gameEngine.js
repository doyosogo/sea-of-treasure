import { cannons } from "../data/cannons.js";
import { levels } from "../data/levels.js";
import { ships } from "../data/ships.js";
import { talents } from "../data/talents.js";

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

export function getTalentPointsSpentInTree(gameState, treeId) {
  return talents
    .filter((talent) => talent.tree === treeId)
    .reduce((total, talent) => total + (gameState.talents?.[talent.id] ?? 0), 0);
}

export function canSpendTalentPoint(gameState, talent) {
  const currentPoints = gameState.talents?.[talent.id] ?? 0;

  return (
    gameState.talentPoints > 0 &&
    currentPoints < talent.maxPoints &&
    talent.requires.every((requirement) => (
      (gameState.talents?.[requirement.id] ?? 0) >= requirement.points
    ))
  );
}

export function getTalentBonuses(gameState) {
  const bonuses = {
    goldMultiplier: 1,
    xpMultiplier: 1,
    cannonDamageMultiplier: 1,
    reloadMultiplier: 1,
    critChance: 0,
    critMultiplier: 1.5,
    offlineCapBonusHours: 0,
    passiveGoldPerHour: 0,
    cannonballReduction: 0
  };

  for (const talent of talents) {
    const points = gameState.talents?.[talent.id] ?? 0;

    if (points <= 0) {
      continue;
    }

    const value = points * talent.bonusPerPoint;

    switch (talent.bonusType) {
      case "goldMultiplier":
        bonuses.goldMultiplier += value;
        break;
      case "xpMultiplier":
        bonuses.xpMultiplier += value;
        break;
      case "cannonDamageMultiplier":
        bonuses.cannonDamageMultiplier += value;
        break;
      case "reloadMultiplier":
        bonuses.reloadMultiplier = Math.max(0.5, bonuses.reloadMultiplier + value);
        break;
      case "critChance":
        bonuses.critChance += value;
        break;
      case "critMultiplier":
        bonuses.critMultiplier += value;
        break;
      case "offlineCapBonusHours":
        bonuses.offlineCapBonusHours += value;
        break;
      case "passiveGoldPerHour":
        bonuses.passiveGoldPerHour += value;
        break;
      case "cannonballReduction":
        bonuses.cannonballReduction += value;
        break;
      default:
        break;
    }
  }

  return bonuses;
}

export function getEffectiveBallsPerBattle(gameState) {
  const currentCannon = getCurrentCannon(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const reduction = Math.floor(talentBonuses.cannonballReduction / 5);
  return Math.max(1, currentCannon.ballsPerBattle - reduction);
}

export function calcIdleProgress(lastSeen, now, gameState) {
  const elapsedSeconds = Math.max(0, Math.floor((now - lastSeen) / 1000));
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const shipsSunk = (currentShip.shipsPerHour / 3600) * elapsedSeconds;

  return {
    goldGained: (shipsSunk * currentShip.goldPerShip * talentBonuses.goldMultiplier) +
      ((talentBonuses.passiveGoldPerHour / 3600) * elapsedSeconds),
    xpGained: shipsSunk * currentShip.xpPerShip * talentBonuses.xpMultiplier
  };
}

export function calcOfflineCap(gameState) {
  const talentBonuses = getTalentBonuses(gameState);
  const cappedHours = Math.min(34, 24 + talentBonuses.offlineCapBonusHours);
  return cappedHours * 60 * 60 * 1000;
}

export function calcOfflineProgress(lastSeen, now, gameState) {
  const timeAwayMs = Math.max(0, now - lastSeen);

  if (timeAwayMs < 60 * 1000) {
    return null;
  }

  const offlineCapMs = calcOfflineCap(gameState);
  let effectiveTimeMs = Math.min(timeAwayMs, offlineCapMs);
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const ballsPerBattle = getEffectiveBallsPerBattle(gameState);
  let stoppedReason = timeAwayMs > offlineCapMs ? "offline_cap_reached" : null;
  let shipsSunk = (currentShip.shipsPerHour * effectiveTimeMs) / (60 * 60 * 1000);
  let cannonballsUsed = shipsSunk * ballsPerBattle;

  if (cannonballsUsed > gameState.cannonballs) {
    shipsSunk = gameState.cannonballs / ballsPerBattle;
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
    goldEarned: (shipsSunk * currentShip.goldPerShip * talentBonuses.goldMultiplier) +
      ((talentBonuses.passiveGoldPerHour * effectiveTimeMs) / (60 * 60 * 1000)),
    xpEarned: shipsSunk * currentShip.xpPerShip * talentBonuses.xpMultiplier,
    cannonballsUsed,
    stoppedReason
  };
}

export function calcDamagePerShot(cannonTier, talentBonuses) {
  const cannon = cannons.find((cannonData) => cannonData.tier === cannonTier) ?? cannons[0];
  return cannon.damage * (talentBonuses?.cannonDamageMultiplier ?? 1);
}

export function calcReloadTime(baseCooldown, talentBonuses) {
  return baseCooldown * (talentBonuses?.reloadMultiplier ?? 1);
}

export function calcGoldPerHour(gameState) {
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  return (currentShip.shipsPerHour * currentShip.goldPerShip * talentBonuses.goldMultiplier) +
    talentBonuses.passiveGoldPerHour;
}

export function calcXpPerHour(gameState) {
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  return currentShip.shipsPerHour * currentShip.xpPerShip * talentBonuses.xpMultiplier;
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
