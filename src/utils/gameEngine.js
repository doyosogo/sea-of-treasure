import { BASE_CANNON_DAMAGE, cannons } from "../data/cannons.js";
import { achievements } from "../data/achievements.js";
import { bosses } from "../data/bosses.js";
import { craftableUpgrades } from "../data/crafting.js";
import { enemies } from "../data/enemies.js";
import { levels } from "../data/levels.js";
import { regions } from "../data/regions.js";
import { crewMembers } from "../data/crew.js";
import { ships } from "../data/ships.js";
import { talents } from "../data/talents.js";
import { worldEvents } from "../data/worldEvents.js";
import { tradeGoods } from "../data/tradeGoods.js";
import { ammunition } from "../data/ammunition.js";
import {
  ACTIVE_COMBAT_GOLD_BONUS_MULTIPLIER,
  BEGINNER_DAMAGE_REDUCTION_MULTIPLIER,
  BOSS_COMBAT_DOUBLOON_CHANCE,
  DEFAULT_COMBAT_DOUBLOON_CHANCE,
  OFFLINE_DOUBLOON_CAP,
  REPAIR_COST_PER_MISSING_HULL,
  RARE_TREASURE_DOUBLOON_BONUS_CHANCE,
  TREASURE_DOUBLOON_CHANCE,
  TREASURE_MAP_DROP_BASE_CHANCE
} from "../data/balance.js";

const CANNON_ORDER = cannons.map((cannon) => cannon.id);
const CANNON_BY_ID = Object.fromEntries(cannons.map((cannon) => [cannon.id, cannon]));
const CANNON_ID_BY_TIER = Object.fromEntries(cannons.map((cannon) => [cannon.tier, cannon.id]));
const CANNON_TIER_BY_ID = Object.fromEntries(cannons.map((cannon) => [cannon.id, cannon.tier]));
const AMMO_ORDER = ammunition.map((ammo) => ammo.id);
const AMMO_BY_ID = Object.fromEntries(ammunition.map((ammo) => [ammo.id, ammo]));
const CREW_BY_ID = Object.fromEntries(crewMembers.map((crewMember) => [crewMember.id, crewMember]));

export function getXpRequired(level) {
  return levels.find((levelData) => levelData.level === level)?.xpRequired ?? Infinity;
}

export function getCurrentShip(gameState) {
  return ships.find((ship) => ship.id === gameState.currentShipId) ?? ships[0];
}

export function getAmmoInventory(gameState) {
  const inventory = gameState.ammoInventory ?? {};

  return AMMO_ORDER.reduce((accumulator, ammoId) => {
    accumulator[ammoId] = Math.max(0, inventory[ammoId] ?? 0);
    return accumulator;
  }, {});
}

export function getTotalAmmoCount(gameState) {
  return Object.values(getAmmoInventory(gameState)).reduce((total, value) => total + value, 0);
}

export function getSelectedAmmoId(gameState) {
  return AMMO_BY_ID[gameState.selectedAmmoId]?.id ?? "iron";
}

export function getSelectedAmmo(gameState) {
  return AMMO_BY_ID[getSelectedAmmoId(gameState)] ?? ammunition[0];
}

export function getAmmoById(ammoId) {
  return AMMO_BY_ID[ammoId] ?? ammunition[0];
}

export function getAmmoQuantity(gameState, ammoId = getSelectedAmmoId(gameState)) {
  return Math.max(0, getAmmoInventory(gameState)[ammoId] ?? 0);
}

export function getAmmoDamageMultiplier(gameState, ammoId = getSelectedAmmoId(gameState)) {
  return AMMO_BY_ID[ammoId]?.damageMultiplier ?? 1;
}

export function getAmmoCostPer100(ammoId = "iron") {
  return AMMO_BY_ID[ammoId]?.costPer100 ?? 0;
}

export function getRegionById(regionId) {
  return regions.find((region) => region.id === regionId) ?? regions[0];
}

export function getActiveRegion(gameState) {
  return getRegionById(gameState.activeRegionId ?? "coastalWaters");
}

export function getUnlockedRegions(gameState) {
  return regions.filter((region) => (gameState.playerLevel ?? 1) >= region.requiredLevel);
}

export function getRecommendedRegion(gameState) {
  const unlocked = getUnlockedRegions(gameState);
  const currentShip = getCurrentShip(gameState);
  const preferred = [...unlocked].reverse().find((region) => currentShip.level >= region.recommendedShipLevel) ?? unlocked[0] ?? regions[0];
  return preferred;
}

export function getRegionCombatModifiers(gameState) {
  const region = getActiveRegion(gameState);
  const difficultyMultiplier = 1 + region.backgroundDifficultyModifier;

  return {
    region,
    difficultyMultiplier,
    goldMultiplier: region.goldMultiplier,
    xpMultiplier: region.xpMultiplier
  };
}

export function getRegionCombatModifiersById(regionId) {
  const region = getRegionById(regionId);
  const difficultyMultiplier = 1 + region.backgroundDifficultyModifier;

  return {
    region,
    difficultyMultiplier,
    goldMultiplier: region.goldMultiplier,
    xpMultiplier: region.xpMultiplier
  };
}

export function getActiveWorldEvent(gameState) {
  const eventState = gameState.activeWorldEvent;

  if (!eventState?.id) {
    return null;
  }

  const definition = worldEvents.find((event) => event.id === eventState.id);

  if (!definition) {
    return null;
  }

  return {
    ...definition,
    ...eventState,
    effects: {
      ...definition.effects,
      ...(eventState.effects ?? {})
    }
  };
}

export function getWorldEventBonuses(gameState) {
  const activeEvent = getActiveWorldEvent(gameState);

  return {
    activeEvent,
    tradeSellValueMultiplier: activeEvent?.effects?.tradeSellValueMultiplier ?? 1,
    combatGoldMultiplier: activeEvent?.effects?.combatGoldMultiplier ?? 1,
    treasureMapDropMultiplier: activeEvent?.effects?.treasureMapDropMultiplier ?? 1,
    hullDamageTakenMultiplier: activeEvent?.effects?.hullDamageTakenMultiplier ?? 1,
    bossRewardMultiplier: activeEvent?.effects?.bossRewardMultiplier ?? 1,
    bossDamageMultiplier: activeEvent?.effects?.bossDamageMultiplier ?? 1
  };
}

export function getCannonKeyByTier(tier) {
  return CANNON_ID_BY_TIER[tier] ?? "iron";
}

export function getCannonTierByKey(cannonId) {
  return CANNON_TIER_BY_ID[cannonId] ?? 1;
}

export function getCannonById(cannonId) {
  return CANNON_BY_ID[cannonId] ?? cannons[0];
}

export function getCannonInventory(gameState) {
  return CANNON_ORDER.reduce((accumulator, cannonId) => {
    accumulator[cannonId] = Math.max(0, gameState.cannonInventory?.[cannonId] ?? 0);
    return accumulator;
  }, {});
}

export function getEquippedCannons(gameState) {
  return CANNON_ORDER.reduce((accumulator, cannonId) => {
    accumulator[cannonId] = Math.max(0, gameState.equippedCannons?.[cannonId] ?? 0);
    return accumulator;
  }, {});
}

export function getTotalEquippedCannons(gameState) {
  return Object.values(getEquippedCannons(gameState)).reduce((total, value) => total + value, 0);
}

export function getHighestOwnedCannonTier(gameState) {
  const inventory = getCannonInventory(gameState);
  const equipped = getEquippedCannons(gameState);

  for (let index = CANNON_ORDER.length - 1; index >= 0; index -= 1) {
    const cannonId = CANNON_ORDER[index];
    if ((equipped[cannonId] ?? 0) > 0 || (inventory[cannonId] ?? 0) > 0) {
      return getCannonById(cannonId);
    }
  }

  return cannons[0];
}

export function getCurrentCannon(gameState) {
  return getHighestOwnedCannonTier(gameState);
}

export function getNextCannon(gameState) {
  const currentCannon = getCurrentCannon(gameState);
  return cannons.find((cannon) => cannon.tier === currentCannon.tier + 1) ?? null;
}

export function calcCannonUpgradeCost(gameState) {
  const nextCannon = getNextCannon(gameState);
  return nextCannon ? nextCannon.goldUpgradeCost : 0;
}

export function getCannonMaterialUpgradeCost(gameState) {
  return getNextCannon(gameState)?.materialUpgradeCost ?? null;
}

export function hasCannonMaterialUpgradeResources(gameState) {
  const cost = getCannonMaterialUpgradeCost(gameState);

  if (!cost || gameState.gold < (cost.gold ?? 0)) {
    return false;
  }

  return Object.entries(cost).every(([resourceId, amount]) => {
    if (resourceId === "gold") {
      return true;
    }

    if (resourceId === "rareMapPieces") {
      return (gameState.rareMapPieces ?? 0) >= amount;
    }

    if (resourceId === "whaleOil") {
      return (gameState.resources?.whaleOil ?? 0) >= amount;
    }

    return (gameState.materials?.[resourceId] ?? 0) >= amount;
  });
}

export function getTalentPointsSpentInTree(gameState, treeId) {
  return talents
    .filter((talent) => talent.tree === treeId)
    .reduce((total, talent) => total + (gameState.talents?.[talent.id] ?? 0), 0);
}

export function getCrewMemberById(crewId) {
  return CREW_BY_ID[crewId] ?? crewMembers[0] ?? null;
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
    passiveRepair: 0,
    cannonballReduction: 0,
    sellPriceMultiplier: 1,
    treasureChanceMultiplier: 1,
    effectiveCannons: 0,
    maxHullMultiplier: 1,
    incomingDamageReduction: 0
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
      case "passiveRepair":
        bonuses.passiveRepair += value;
        break;
      case "sellPriceMultiplier":
        bonuses.sellPriceMultiplier += value;
        break;
      case "treasureChance":
        bonuses.treasureChanceMultiplier += value;
        break;
      case "cannonballReduction":
        bonuses.cannonballReduction += value;
        break;
      case "effectiveCannons":
        bonuses.effectiveCannons += value;
        break;
      case "maxHullMultiplier":
        bonuses.maxHullMultiplier += value;
        break;
      case "incomingDamageReduction":
        bonuses.incomingDamageReduction += value;
        break;
      default:
        break;
    }
  }

  return bonuses;
}

export function getCrewBonuses(gameState) {
  const bonuses = {
    combatXpMultiplier: 1,
    volleyDamageMultiplier: 1,
    repairCostMultiplier: 1,
    combatGoldMultiplier: 1,
    tradeSellMultiplier: 1,
    treasureChanceMultiplier: 1
  };

  for (const crewMember of crewMembers) {
    const level = Math.max(0, gameState.crew?.[crewMember.id]?.level ?? 1);

    if (level <= 0) {
      continue;
    }

    const value = level * crewMember.bonusPerLevel;

    switch (crewMember.bonusType) {
      case "combatXpMultiplier":
        bonuses.combatXpMultiplier += value;
        break;
      case "volleyDamageMultiplier":
        bonuses.volleyDamageMultiplier += value;
        break;
      case "repairCostMultiplier":
        bonuses.repairCostMultiplier = Math.max(0.5, bonuses.repairCostMultiplier + value);
        break;
      case "combatGoldMultiplier":
        bonuses.combatGoldMultiplier += value;
        break;
      case "tradeSellMultiplier":
        bonuses.tradeSellMultiplier += value;
        break;
      case "treasureChanceMultiplier":
        bonuses.treasureChanceMultiplier += value;
        break;
      default:
        break;
    }
  }

  return bonuses;
}

export function getCrewUpgradeCost(crewMember, currentLevel) {
  const nextLevel = currentLevel + 1;
  const scale = Math.max(1, nextLevel);

  switch (crewMember?.id) {
    case "navigator":
      return {
        gold: crewMember.upgradeCostBase * scale,
        navigationCharts: 8 * scale,
        compassFragments: 2 * scale
      };
    case "gunner":
      return {
        gold: crewMember.upgradeCostBase * scale,
        gunpowder: 16 * scale,
        cannonParts: 4 * scale
      };
    case "carpenter":
      return {
        gold: crewMember.upgradeCostBase * scale,
        fish: 24 * scale,
        whaleOil: 3 * scale
      };
    case "quartermaster":
      return {
        gold: crewMember.upgradeCostBase * scale,
        tradeContracts: 8 * scale,
        tradeSeals: 2 * scale
      };
    case "merchant":
      return {
        gold: crewMember.upgradeCostBase * scale,
        tradeContracts: 12 * scale,
        tradeSeals: 1 * scale
      };
    case "treasureHunter":
      return {
        gold: crewMember.upgradeCostBase * scale,
        ancientRelics: 6 * scale,
        rareMapPieces: 1 * scale
      };
    default:
      return {
        gold: 0
      };
  }
}

export function getRepairCostPerMissingHull(gameState) {
  return 5 * getCrewBonuses(gameState).repairCostMultiplier;
}

export function getEffectiveBallsPerBattle(gameState) {
  const talentBonuses = getTalentBonuses(gameState);
  const reduction = Math.floor(talentBonuses.cannonballReduction / 5);
  const equippedCannons = Math.max(1, getTotalEquippedCannons(gameState));
  return Math.max(1, equippedCannons - reduction);
}

export function getCraftingCost(upgrade, currentLevel) {
  const nextLevel = currentLevel + 1;

  return {
    gold: upgrade.goldCostPerLevel * nextLevel,
    fish: upgrade.fishCostPerLevel * nextLevel,
    whaleOil: upgrade.whaleOilCostPerLevel * nextLevel,
    shipwrightXp: upgrade.shipwrightXpPerLevel * nextLevel
  };
}

export function getCraftingEffect(upgradeId, level) {
  switch (upgradeId) {
    case "reinforcedHull":
      return `+${formatNumber(level * 2)}% future max hull`;
    case "speedSails":
      return `+${formatNumber(level * 2)}% ships/hour`;
    case "cannonBraces":
      return `${formatNumber(Math.min(20, level * 2))}% refund chance`;
    default:
      return "No bonus";
  }
}

export function getCraftingBonuses(gameState) {
  const reinforcedHull = gameState.craftedUpgrades?.reinforcedHull ?? 0;
  const speedSails = gameState.craftedUpgrades?.speedSails ?? 0;
  const cannonBraces = gameState.craftedUpgrades?.cannonBraces ?? 0;

  return {
    shipsPerHourMultiplier: 1 + speedSails * 0.02,
    cannonballRefundChance: Math.min(0.2, cannonBraces * 0.02),
    hullMultiplier: 1 + reinforcedHull * 0.02
  };
}

export function rollCannonballRecovery(gameState, battles, ballsPerBattle) {
  const refundChance = getCraftingBonuses(gameState).cannonballRefundChance;
  const wholeBattles = Math.floor(battles);
  const fractionalBattle = battles - wholeBattles;
  let recovered = 0;

  if (refundChance <= 0 || ballsPerBattle <= 0 || battles <= 0) {
    return 0;
  }

  for (let index = 0; index < wholeBattles; index += 1) {
    if (Math.random() < refundChance) {
      recovered += ballsPerBattle;
    }
  }

  if (fractionalBattle > 0 && Math.random() < refundChance * fractionalBattle) {
    recovered += ballsPerBattle * fractionalBattle;
  }

  return Math.min(recovered, battles * ballsPerBattle);
}

export function getEffectiveShipsPerHour(gameState) {
  return getCurrentShip(gameState).shipsPerHour * getCraftingBonuses(gameState).shipsPerHourMultiplier;
}

export function getMaxHull(gameState) {
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const craftingBonuses = getCraftingBonuses(gameState);
  const baseHull = 100 + currentShip.level * 40;

  return Math.round(baseHull * talentBonuses.maxHullMultiplier * craftingBonuses.hullMultiplier);
}

export function getSelectedEnemyType(gameState) {
  return enemies.find((enemy) => enemy.id === gameState.selectedEnemyId) ?? enemies[1] ?? enemies[0];
}

export function generateEnemy(gameState, enemyType = getSelectedEnemyType(gameState)) {
  const currentShip = getCurrentShip(gameState);
  const regionModifiers = getRegionCombatModifiers(gameState);
  const worldEventBonuses = getWorldEventBonuses(gameState);
  const baseHP = 40 + gameState.playerLevel * 25;
  const baseDamage = 2 + gameState.playerLevel * 1.5;
  const enemyData = typeof enemyType === "string"
    ? enemies.find((enemy) => enemy.id === enemyType)
    : enemyType;
  const selectedEnemy = enemyData ?? getSelectedEnemyType(gameState);
  const beginnerDamageMultiplier = gameState.playerLevel <= 3 ? BEGINNER_DAMAGE_REDUCTION_MULTIPLIER : 1;
  const regionDifficultyMultiplier = regionModifiers.difficultyMultiplier;

  return {
    id: selectedEnemy.id,
    name: selectedEnemy.name,
    difficulty: selectedEnemy.difficulty,
    description: selectedEnemy.description,
    maxHP: Math.round(baseHP * selectedEnemy.hpMultiplier * regionDifficultyMultiplier),
    currentHP: Math.round(baseHP * selectedEnemy.hpMultiplier * regionDifficultyMultiplier),
    damage: Math.max(1, Math.round(baseDamage * selectedEnemy.damageMultiplier * beginnerDamageMultiplier * regionDifficultyMultiplier)),
    goldReward: currentShip.goldPerShip * selectedEnemy.goldMultiplier * regionModifiers.goldMultiplier * worldEventBonuses.combatGoldMultiplier,
    xpReward: currentShip.xpPerShip * selectedEnemy.xpMultiplier * regionModifiers.xpMultiplier,
    mapDropChance: Math.min(1, getTreasureMapDropChance(gameState) * selectedEnemy.mapDropMultiplier)
  };
}

export function getBossById(bossId) {
  return bosses.find((boss) => boss.id === bossId) ?? null;
}

export function getUnlockedBosses(gameState) {
  return bosses.filter((boss) => {
    const region = getRegionById(boss.regionId);
    return (gameState.playerLevel ?? 1) >= region.requiredLevel;
  });
}

export function generateBoss(gameState, bossType = getUnlockedBosses(gameState)[0]) {
  const bossData = typeof bossType === "string"
    ? getBossById(bossType)
    : bossType ?? getUnlockedBosses(gameState)[0] ?? bosses[0];
  const currentShip = getCurrentShip(gameState);
  const baseHP = 40 + gameState.playerLevel * 25;
  const baseDamage = 2 + gameState.playerLevel * 1.5;
  const regionModifiers = getRegionCombatModifiersById(bossData.regionId);
  const worldEventBonuses = getWorldEventBonuses(gameState);
  const beginnerDamageMultiplier = gameState.playerLevel <= 3 ? BEGINNER_DAMAGE_REDUCTION_MULTIPLIER : 1;
  const bossDamageMultiplier = bossData.id && worldEventBonuses.activeEvent?.id === "cursedFog"
    ? worldEventBonuses.bossDamageMultiplier
    : 1;

  return {
    id: bossData.id,
    name: bossData.name,
    difficulty: "Boss",
    regionId: bossData.regionId,
    description: bossData.description,
    isBoss: true,
    maxHP: Math.round(baseHP * bossData.hpMultiplier * regionModifiers.difficultyMultiplier),
    currentHP: Math.round(baseHP * bossData.hpMultiplier * regionModifiers.difficultyMultiplier),
    damage: Math.max(1, Math.round(baseDamage * bossData.damageMultiplier * regionModifiers.difficultyMultiplier * beginnerDamageMultiplier * bossDamageMultiplier)),
    goldReward: currentShip.goldPerShip * bossData.goldReward * regionModifiers.goldMultiplier,
    xpReward: currentShip.xpPerShip * bossData.xpReward * regionModifiers.xpMultiplier,
    mapDropChance: Math.min(1, bossData.mapDropChance ?? getTreasureMapDropChance(gameState)),
    rareMapPieceChance: bossData.rareMapPieceChance,
    doubloonChance: bossData.doubloonChance
  };
}

export function getPlayerCombatStats(gameState) {
  const equippedCannons = getEquippedCannons(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const crewBonuses = getCrewBonuses(gameState);
  const worldEventBonuses = getWorldEventBonuses(gameState);
  const selectedAmmo = getSelectedAmmo(gameState);
  const maxHull = getMaxHull(gameState);
  const totalEquippedCannons = Object.values(equippedCannons).reduce((total, value) => total + value, 0);
  const baseLoadoutDamage = Object.entries(equippedCannons).reduce((total, [cannonId, quantity]) => {
    const cannon = getCannonById(cannonId);
    return total + quantity * BASE_CANNON_DAMAGE * cannon.damageMultiplier;
  }, 0);
  const averageCannonDamageMultiplier = totalEquippedCannons > 0
    ? baseLoadoutDamage / (Math.max(1, totalEquippedCannons) * BASE_CANNON_DAMAGE)
    : 1;
  const effectiveCannons = totalEquippedCannons + talentBonuses.effectiveCannons;
  const cannonDamage = BASE_CANNON_DAMAGE * averageCannonDamageMultiplier * talentBonuses.cannonDamageMultiplier;
  const ammoDamageMultiplier = selectedAmmo.damageMultiplier ?? 1;

  return {
    effectiveCannons,
    cannonDamage,
    baseCannonDamage: BASE_CANNON_DAMAGE,
    cannonDamageMultiplier: averageCannonDamageMultiplier,
    ammoDamageMultiplier,
    selectedAmmoId: selectedAmmo.id,
    selectedAmmo,
    volleyDamage: effectiveCannons * cannonDamage * crewBonuses.volleyDamageMultiplier * ammoDamageMultiplier,
    critChance: talentBonuses.critChance,
    critMultiplier: talentBonuses.critMultiplier,
    maxHull,
    currentHull: Math.min(gameState.hull?.current ?? maxHull, maxHull),
    incomingDamageReduction: Math.min(0.75, talentBonuses.incomingDamageReduction),
    incomingDamageTakenMultiplier: worldEventBonuses.hullDamageTakenMultiplier,
    totalEquippedCannons,
    loadoutDamage: baseLoadoutDamage,
    averageCannonDamageMultiplier
  };
}

export function getTreasureMapDropChance(gameState) {
  const talentBonuses = getTalentBonuses(gameState);
  const crewBonuses = getCrewBonuses(gameState);
  return TREASURE_MAP_DROP_BASE_CHANCE * talentBonuses.treasureChanceMultiplier * crewBonuses.treasureChanceMultiplier * getWorldEventBonuses(gameState).treasureMapDropMultiplier;
}

export function rollTreasureMapDrops(gameState, shipsSunk) {
  const dropChance = getTreasureMapDropChance(gameState);
  const wholeShips = Math.floor(shipsSunk);
  const fractionalShip = shipsSunk - wholeShips;
  let mapsFound = 0;

  for (let index = 0; index < wholeShips; index += 1) {
    if (Math.random() < dropChance) {
      mapsFound += 1;
    }
  }

  if (fractionalShip > 0 && Math.random() < dropChance * fractionalShip) {
    mapsFound += 1;
  }

  return mapsFound;
}

export function rollEnemyMapDrops(mapDropChance, enemiesSunk) {
  const wholeEnemies = Math.floor(enemiesSunk);
  const fractionalEnemy = enemiesSunk - wholeEnemies;
  let mapsFound = 0;

  for (let index = 0; index < wholeEnemies; index += 1) {
    if (Math.random() < mapDropChance) {
      mapsFound += 1;
    }
  }

  if (fractionalEnemy > 0 && Math.random() < mapDropChance * fractionalEnemy) {
    mapsFound += 1;
  }

  return mapsFound;
}

export function rollRareMapPieces(chance, attempts = 1) {
  let pieces = 0;

  for (let index = 0; index < attempts; index += 1) {
    if (Math.random() < chance) {
      pieces += 1;
    }
  }

  return pieces;
}

export function rollDoubloonsFromCombat(enemy, attempts = 1, cap = Infinity) {
  const dropChance = enemy?.doubloonChance ?? (enemy?.difficulty === "Boss" ? BOSS_COMBAT_DOUBLOON_CHANCE : DEFAULT_COMBAT_DOUBLOON_CHANCE);
  const wholeAttempts = Math.floor(attempts);
  const fractionalAttempt = attempts - wholeAttempts;
  let doubloons = 0;

  for (let index = 0; index < wholeAttempts; index += 1) {
    if (Math.random() < dropChance) {
      doubloons += 1;
    }
  }

  if (fractionalAttempt > 0 && Math.random() < dropChance * fractionalAttempt) {
    doubloons += 1;
  }

  return Math.min(cap, doubloons);
}

export function rollDoubloonsFromTreasure(site) {
  const baseRoll = Math.random() < TREASURE_DOUBLOON_CHANCE ? 1 : 0;

  if (baseRoll <= 0) {
    return 0;
  }

  if ((site?.requiredSkillLevel ?? 0) >= 8 && Math.random() < RARE_TREASURE_DOUBLOON_BONUS_CHANCE) {
    return 2;
  }

  return 1;
}

export function generateMarketPrices() {
  return Object.fromEntries(tradeGoods.map((good) => [
    good.id,
    {
      buyModifier: randomModifier(),
      sellModifier: randomModifier()
    }
  ]));
}

function randomModifier() {
  return Number((0.8 + Math.random() * 0.4).toFixed(2));
}

export function getCargoCapacity(gameState) {
  return 100 + getCurrentShip(gameState).cannons * 2;
}

export function getCannonCapacity(gameState) {
  return getCurrentShip(gameState).cannonCapacity ?? getCurrentShip(gameState).cannons ?? 0;
}

export function getUsedCargo(gameState) {
  return tradeGoods.reduce((total, good) => total + (gameState.cargo?.[good.id] ?? 0), 0);
}

export function getMarketCooldownRemaining(gameState, now = Date.now()) {
  const cycleStartedAt = gameState.marketCycleStartedAt ?? gameState.marketLastRefreshed ?? 0;
  const nextRefreshAt = cycleStartedAt + gameState.marketRefreshCooldownMs;
  return Math.max(0, nextRefreshAt - now);
}

export function getTradingSellMultiplier(gameState) {
  const tradingLevel = gameState.skills?.trading?.level ?? 1;
  const talentBonuses = getTalentBonuses(gameState);
  const worldEventBonuses = getWorldEventBonuses(gameState);
  return (1 + tradingLevel * 0.01) * talentBonuses.sellPriceMultiplier * worldEventBonuses.tradeSellValueMultiplier;
}

export function getFishSellValue(gameState) {
  return Math.floor(8 * getTradingSellMultiplier(gameState));
}

export function getWhaleOilSellValue(gameState) {
  return Math.floor(60 * getTradingSellMultiplier(gameState));
}

export function getEstimatedResourceValue(gameState) {
  return (gameState.resources?.fish ?? 0) * getFishSellValue(gameState) +
    (gameState.resources?.whaleOil ?? 0) * getWhaleOilSellValue(gameState);
}

export function getTradeGoodBuyPrice(gameState, good) {
  const marketPrice = gameState.marketPrices?.[good.id] ?? { buyModifier: 1 };
  return Math.ceil(good.baseBuyPrice * marketPrice.buyModifier);
}

export function getTradeGoodSellPrice(gameState, good) {
  const marketPrice = gameState.marketPrices?.[good.id] ?? { sellModifier: 1 };
  const crewBonuses = getCrewBonuses(gameState);
  return Math.floor(good.baseSellPrice * marketPrice.sellModifier * getTradingSellMultiplier(gameState) * crewBonuses.tradeSellMultiplier);
}

export function getEstimatedCargoValue(gameState) {
  return tradeGoods.reduce((total, good) => (
    total + (gameState.cargo?.[good.id] ?? 0) * getTradeGoodSellPrice(gameState, good)
  ), 0);
}

export function calcIdleProgress(lastSeen, now, gameState) {
  const elapsedSeconds = Math.max(0, Math.floor((now - lastSeen) / 1000));
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const shipsSunk = (getEffectiveShipsPerHour(gameState) / 3600) * elapsedSeconds;

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

export function getIdleCombatEstimate(gameState) {
  const enemy = generateEnemy(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const craftingBonuses = getCraftingBonuses(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const crewBonuses = getCrewBonuses(gameState);
  const ballsPerVolley = getEffectiveBallsPerBattle(gameState);
  const averageCritMultiplier = 1 + combatStats.critChance * (combatStats.critMultiplier - 1);
  const averageVolleyDamage = Math.max(1, combatStats.volleyDamage * averageCritMultiplier);
  const volleysNeeded = Math.max(1, Math.ceil(enemy.maxHP / averageVolleyDamage));
  const volleyIntervalSeconds = 10 / craftingBonuses.shipsPerHourMultiplier;
  const secondsPerEnemy = volleysNeeded * volleyIntervalSeconds;
  const enemiesPerHour = secondsPerEnemy > 0 ? 3600 / secondsPerEnemy : 0;
  const hullDamagePerEnemy = Math.max(1, enemy.damage * (1 - combatStats.incomingDamageReduction) * combatStats.incomingDamageTakenMultiplier);
  const cannonballsPerEnemy = volleysNeeded * ballsPerVolley;

  return {
    enemy,
    averageVolleyDamage,
    volleysNeeded,
    volleyIntervalSeconds,
    secondsPerEnemy,
    enemiesPerHour,
    goldPerHour: enemiesPerHour * enemy.goldReward * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier + talentBonuses.passiveGoldPerHour,
    xpPerHour: enemiesPerHour * enemy.xpReward * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier,
    cannonballsPerHour: enemiesPerHour * cannonballsPerEnemy,
    hullDamagePerHour: enemiesPerHour * hullDamagePerEnemy,
    ballsPerVolley,
    hullDamagePerEnemy,
    goldPerEnemy: enemy.goldReward * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier,
    xpPerEnemy: enemy.xpReward * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier
  };
}

export function calcOfflineProgress(lastSeen, now, gameState) {
  const timeAwayMs = Math.max(0, now - lastSeen);

  if (timeAwayMs < 60 * 1000) {
    return null;
  }

  const offlineCapMs = calcOfflineCap(gameState);
  const cappedTimeMs = Math.min(timeAwayMs, offlineCapMs);
  const estimate = getIdleCombatEstimate(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const crewBonuses = getCrewBonuses(gameState);
  const selectedAmmo = getSelectedAmmo(gameState);
  const ammoId = selectedAmmo.id;
  const ammoQuantity = getAmmoQuantity(gameState, ammoId);
  let stoppedReason = timeAwayMs > offlineCapMs ? "offline_cap_reached" : null;
  const maxEnemiesByTime = Math.floor((cappedTimeMs / 1000) / estimate.secondsPerEnemy);
  const maxEnemiesByCannonballs = Math.floor(ammoQuantity / (estimate.volleysNeeded * estimate.ballsPerVolley));
  const maxEnemiesByHull = Math.floor((gameState.hull?.current ?? estimate.hullDamagePerEnemy) / estimate.hullDamagePerEnemy);
  let enemiesSunk = Math.max(0, Math.min(maxEnemiesByTime, maxEnemiesByCannonballs, maxEnemiesByHull));

  if (maxEnemiesByTime > 0 && maxEnemiesByTime > maxEnemiesByCannonballs && maxEnemiesByCannonballs <= maxEnemiesByHull) {
    stoppedReason = "out_of_cannonballs";
  } else if (maxEnemiesByTime > 0 && maxEnemiesByTime >= maxEnemiesByHull && maxEnemiesByHull <= maxEnemiesByCannonballs) {
    stoppedReason = "hull_destroyed";
  }

  const volleysFired = enemiesSunk * estimate.volleysNeeded;
  const cannonballsSpent = volleysFired * estimate.ballsPerVolley;
  const cannonballsRecovered = rollCannonballRecovery(gameState, enemiesSunk, estimate.volleysNeeded * estimate.ballsPerVolley);
  const netCannonballsUsed = Math.max(0, cannonballsSpent - cannonballsRecovered);
  const hullDamageTaken = enemiesSunk * estimate.hullDamagePerEnemy;
  const doubloonsEarned = rollDoubloonsFromCombat(estimate.enemy, enemiesSunk, OFFLINE_DOUBLOON_CAP);
  const effectiveTimeMs = Math.min(cappedTimeMs, enemiesSunk * estimate.secondsPerEnemy * 1000);

  return {
    timeAwayMs,
    effectiveTimeMs,
    enemiesSunk,
    shipsSunk: enemiesSunk,
    ammoId,
    ammoName: selectedAmmo.name,
    volleysFired,
    goldEarned: (enemiesSunk * estimate.enemy.goldReward * talentBonuses.goldMultiplier * crewBonuses.combatGoldMultiplier) +
      ((talentBonuses.passiveGoldPerHour * effectiveTimeMs) / (60 * 60 * 1000)),
    xpEarned: enemiesSunk * estimate.enemy.xpReward * talentBonuses.xpMultiplier * crewBonuses.combatXpMultiplier,
    cannonballsSpent,
    cannonballsRecovered,
    netCannonballsUsed,
    cannonballsUsed: netCannonballsUsed,
    hullDamageTaken,
    doubloonsEarned,
    mapsFound: rollEnemyMapDrops(estimate.enemy.mapDropChance, enemiesSunk),
    rareMapPiecesFound: rollRareMapPieces(0.0005, enemiesSunk),
    stoppedReason
  };
}

export function calcDamagePerShot(cannonTier, talentBonuses, ammoDamageMultiplier = 1) {
  const cannon = cannons.find((cannonData) => cannonData.tier === cannonTier) ?? cannons[0];
  return BASE_CANNON_DAMAGE * cannon.damageMultiplier * (talentBonuses?.cannonDamageMultiplier ?? 1) * ammoDamageMultiplier;
}

export function calcReloadTime(baseCooldown, talentBonuses) {
  return baseCooldown * (talentBonuses?.reloadMultiplier ?? 1);
}

export function calcGoldPerHour(gameState) {
  return getIdleCombatEstimate(gameState).goldPerHour;
}

export function calcXpPerHour(gameState) {
  return getIdleCombatEstimate(gameState).xpPerHour;
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

export function getAchievementProgress(achievement, gameState) {
  const skills = Object.values(gameState.skills ?? {});
  const craftedLevels = Object.values(gameState.craftedUpgrades ?? {});
  const lifetimeStats = gameState.lifetimeStats ?? {};
  let current = 0;
  let target = achievement.target ?? 1;

  switch (achievement.id) {
    case "sink_10_ships":
    case "sink_100_ships":
    case "sink_1000_ships":
    case "sink_10000_ships":
      current = lifetimeStats.totalShipsSunk ?? gameState.totalShipsSunk ?? 0;
      break;
    case "reach_level_5":
    case "reach_level_10":
    case "reach_level_15":
      current = gameState.playerLevel ?? 1;
      break;
    case "own_3_ships":
    case "own_7_ships":
    case "own_all_ships":
      current = gameState.ownedShips?.length ?? 0;
      break;
    case "earn_10000_gold":
    case "earn_1000000_gold":
    case "earn_100000000_gold":
      current = lifetimeStats.totalGoldEarned ?? 0;
      break;
    case "skill_level_5_any":
    case "skill_level_10_any":
      current = skills.length > 0 ? Math.max(...skills.map((skill) => skill.level ?? 1)) : 1;
      break;
    case "skill_level_10_all":
      current = skills.length > 0 ? Math.min(...skills.map((skill) => skill.level ?? 1)) : 1;
      break;
    case "complete_5_treasure_digs":
      current = lifetimeStats.treasureDigsCompleted ?? 0;
      break;
    case "find_1_rare_treasure":
    case "find_10_rare_treasures":
      current = lifetimeStats.rareTreasuresFound ?? gameState.treasureInventory?.length ?? 0;
      break;
    case "craft_5_upgrades":
      current = lifetimeStats.upgradesCrafted ?? 0;
      break;
    case "defeat_first_boss":
    case "defeat_10_bosses":
    case "defeat_100_bosses":
      current = lifetimeStats.totalBossesDefeated ?? 0;
      break;
    case "defeat_the_leviathan":
      current = lifetimeStats.defeatedLeviathan ? 1 : 0;
      break;
    case "experience_1_world_event":
    case "experience_10_world_events":
      current = lifetimeStats.worldEventsSeen ?? 0;
      break;
    case "benefit_from_cursed_fog_once":
      current = lifetimeStats.cursedFogEventsSeen ?? 0;
      break;
    case "max_one_crafted_upgrade":
      current = craftedLevels.length > 0 ? Math.max(...craftedLevels) : 0;
      break;
    case "max_all_crafted_upgrades":
      current = craftedLevels.reduce((total, level) => total + level, 0);
      break;
    default:
      target = 1;
      current = 0;
      break;
  }

  return {
    current,
    target,
    percentage: Math.min(100, target > 0 ? (current / target) * 100 : 0)
  };
}

export function isAchievementUnlocked(achievement, gameState) {
  const progress = getAchievementProgress(achievement, gameState);
  return progress.current >= progress.target;
}

export function getUnlockedAchievements(gameState) {
  return achievements.filter((achievement) => isAchievementUnlocked(achievement, gameState));
}

export function getClaimableAchievements(gameState) {
  const claimedAchievements = gameState.claimedAchievements ?? [];
  return achievements.filter((achievement) => (
    !claimedAchievements.includes(achievement.id) &&
    isAchievementUnlocked(achievement, gameState)
  ));
}
