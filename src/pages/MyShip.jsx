import {
  formatNumber,
  getCargoCapacity,
  getCraftingBonuses,
  getCraftingEffect,
  getCurrentCannon,
  getCurrentShip,
  getIdleCombatEstimate,
  getMaxHull,
  getPlayerCombatStats
} from "../utils/gameEngine.js";

function MyShip({ gameState, dispatch }) {
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const craftingBonuses = getCraftingBonuses(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const baseHull = 100 + currentShip.level * 40;
  const hullPercent = combatStats.maxHull > 0 ? (combatStats.currentHull / combatStats.maxHull) * 100 : 0;
  const missingHull = Math.max(0, combatStats.maxHull - combatStats.currentHull);
  const talents = gameState.talents ?? {};

  return (
    <section className="my-ship-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Current Vessel</p>
          <h1>My Ship</h1>
        </div>
        <span className="resource-counter">{currentShip.name}</span>
      </div>

      <article className="pixel-panel my-ship-panel">
        <h2>Active Ship</h2>
        <div className="summary-stat-grid">
          <Stat label="Ship" value={currentShip.name} />
          <Stat label="Ship Level" value={currentShip.level} />
          <Stat label="Map" value={currentShip.mapName} />
          <Stat label="Cannons" value={currentShip.cannons} />
          <Stat label="Cargo Capacity" value={formatNumber(getCargoCapacity(gameState))} />
          <Stat label="Owned Status" value={gameState.ownedShips.includes(currentShip.id) ? "Owned" : "Not Owned"} />
        </div>
      </article>

      <article className="pixel-panel hull-panel">
        <div className="panel-heading-row">
          <h2>Hull</h2>
          <span className="resource-counter">
            {formatNumber(combatStats.currentHull)} / {formatNumber(combatStats.maxHull)}
          </span>
        </div>
        <div className="progress-track hull-track" aria-label="Hull percentage">
          <div className="progress-fill hull-fill" style={{ width: `${Math.min(100, hullPercent)}%` }} />
        </div>
        <div className="summary-stat-grid">
          <Stat label="Base Hull" value={formatNumber(baseHull)} />
          <Stat label="Reinforced Hull Bonus" value={`${formatNumber((craftingBonuses.hullMultiplier - 1) * 100)}%`} />
          <Stat label="Iron Hull Talent Bonus" value={`${formatNumber((talents.ironHull ?? 0) * 5)}%`} />
          <Stat label="Repair Cost to Full" value={`${formatNumber(missingHull * 10)} Gold`} />
        </div>
        <button
          className="chunky-button"
          disabled={missingHull <= 0 || gameState.gold <= 0}
          onClick={() => dispatch({ type: "REPAIR_HULL" })}
          type="button"
        >
          Repair Hull
        </button>
      </article>

      <article className="pixel-panel cannon-status-panel">
        <h2>Cannons</h2>
        <p className="shop-note">All cannons on your active ship currently use this cannon tier.</p>
        <div className="summary-stat-grid">
          <Stat label="Current Tier" value={`Tier ${currentCannon.tier}`} />
          <Stat label="Cannon Name" value={currentCannon.name} />
          <Stat label="Total Cannons" value={formatNumber(currentShip.cannons)} />
          <Stat label="Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} />
          <Stat label="Base Cannon Damage" value={formatNumber(combatStats.baseCannonDamage)} />
          <Stat label="Effective Cannons" value={formatNumber(combatStats.effectiveCannons)} />
          <Stat label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} />
          <Stat label="Crit Chance" value={`${formatNumber(combatStats.critChance * 100)}%`} />
          <Stat label="Crit Multiplier" value={`${formatNumber(combatStats.critMultiplier)}x`} />
        </div>
      </article>

      <article className="pixel-panel upgrade-bonuses-panel">
        <h2>Shipwright Upgrades</h2>
        <div className="summary-stat-grid">
          <Stat
            label="Reinforced Hull"
            value={`Lv. ${gameState.craftedUpgrades.reinforcedHull} - ${getCraftingEffect("reinforcedHull", gameState.craftedUpgrades.reinforcedHull)}`}
          />
          <Stat
            label="Speed Sails"
            value={`Lv. ${gameState.craftedUpgrades.speedSails} - ${getCraftingEffect("speedSails", gameState.craftedUpgrades.speedSails)}`}
          />
          <Stat
            label="Cannon Braces"
            value={`Lv. ${gameState.craftedUpgrades.cannonBraces} - ${formatNumber(craftingBonuses.cannonballRefundChance * 100)}% refund chance`}
          />
        </div>
      </article>

      <article className="pixel-panel talent-bonuses-panel">
        <h2>Combat Talents</h2>
        <div className="summary-stat-grid">
          <Stat label="Powder Kegs" value={`${formatNumber((talents.powderKegs ?? 0) * 2)}% damage`} />
          <Stat label="Broadside Master" value={`+${formatNumber(talents.broadsideMaster ?? 0)} effective cannons`} />
          <Stat label="Dead Eye" value={`${formatNumber((talents.deadEye ?? 0) * 1)}% crit chance`} />
          <Stat label="Killing Blow" value={`+${formatNumber((talents.killingBlow ?? 0) * 0.05)} crit multiplier`} />
          <Stat label="Iron Hull" value={`${formatNumber((talents.ironHull ?? 0) * 5)}% max hull`} />
          <Stat label="Ghost Ship" value={`${formatNumber((talents.ghostShip ?? 0) * 1.5)}% damage reduction`} />
        </div>
      </article>

      <article className="pixel-panel readiness-panel">
        <h2>Combat Readiness</h2>
        <div className="summary-stat-grid">
          <Stat label="Selected Enemy" value={idleEstimate.enemy.name} />
          <Stat label="Estimated Enemy HP" value={formatNumber(idleEstimate.enemy.maxHP)} />
          <Stat label="Estimated Enemy Damage" value={formatNumber(idleEstimate.enemy.damage)} />
          <Stat label="Volleys to Defeat" value={formatNumber(idleEstimate.volleysNeeded)} />
          <Stat label="Cannonballs Needed" value={formatNumber(idleEstimate.volleysNeeded * idleEstimate.ballsPerVolley)} />
          <Stat label="Hull Damage Taken" value={formatNumber(idleEstimate.hullDamagePerEnemy)} />
          <Stat label="Reward Gold" value={formatNumber(idleEstimate.goldPerEnemy)} />
          <Stat label="Reward XP" value={formatNumber(idleEstimate.xpPerEnemy)} />
        </div>
      </article>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default MyShip;
