export function getXpRequired(level) {
  return level;
}

export function calcIdleProgress(lastSeen, now, gameState) {
  return {
    lastSeen,
    now,
    gameState,
    goldGained: 0,
    xpGained: 0
  };
}

export function calcDamagePerShot(cannonTier, talentBonuses) {
  return cannonTier + Number(Boolean(talentBonuses));
}

export function calcReloadTime(baseCooldown, talentBonuses) {
  return baseCooldown - Number(Boolean(talentBonuses));
}

export function calcGoldPerHour(gameState) {
  return Number(Boolean(gameState));
}

export function calcOfflineCap(talentBonuses) {
  return Number(Boolean(talentBonuses));
}
