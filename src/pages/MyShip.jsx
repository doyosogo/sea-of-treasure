import {
  CANNON_IMAGES,
  SHIP_IMAGES,
  SCENES,
  UI_CANNONBALLS,
  UI_GOLD,
  UI_HULL
} from "../data/assets.js";
import { cannons } from "../data/cannons.js";
import {
  formatNumber,
  getCannonCapacity,
  getCargoCapacity,
  getCraftingBonuses,
  getCraftingEffect,
  getCrewBonuses,
  getActiveRegion,
  getRecommendedRegion,
  getCurrentCannon,
  getCurrentShip,
  getIdleCombatEstimate,
  getPlayerCombatStats,
  getRepairCostPerMissingHull,
  getCannonInventory,
  getEquippedCannons,
  getTotalEquippedCannons
} from "../utils/gameEngine.js";

function MyShip({ gameState, dispatch }) {
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const craftingBonuses = getCraftingBonuses(gameState);
  const crewBonuses = getCrewBonuses(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const baseHull = 100 + currentShip.level * 40;
  const hullPercent = combatStats.maxHull > 0 ? (combatStats.currentHull / combatStats.maxHull) * 100 : 0;
  const missingHull = Math.max(0, combatStats.maxHull - combatStats.currentHull);
  const repairCost = Math.floor(missingHull * getRepairCostPerMissingHull(gameState));
  const talents = gameState.talents ?? {};
  const cannonImage = CANNON_IMAGES[currentCannon.tier];
  const cannonInventory = getCannonInventory(gameState);
  const equippedCannons = getEquippedCannons(gameState);
  const totalEquippedCannons = getTotalEquippedCannons(gameState);
  const cannonCapacity = getCannonCapacity(gameState);
  const activeRegion = getActiveRegion(gameState);
  const recommendedRegion = getRecommendedRegion(gameState);

  return (
    <section
      className="my-ship-page shipyard-scene shipyard-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.shipyard})`
      }}
    >
      <div className="shipyard-overlay" aria-hidden="true" />
      <div className="shipyard-shell">
        <header className="shipyard-topbar">
          <img alt="Sea of Treasure logo" className="shipyard-logo" src="/assets/logo/LOGO.png" />
          <div className="shipyard-title-copy">
            <p className="eyebrow">My Ship</p>
            <h1>My Ship</h1>
            <p>Inspect your active ship, hull, cannons, upgrades and combat readiness.</p>
          </div>
          <div className="status-pill active">{currentShip.name}</div>
        </header>

        <section className="shipyard-main-grid">
          <article className="shipyard-panel shipyard-active-panel">
            <div className="panel-heading-row">
              <h2>Active Ship</h2>
              <span className="resource-counter">{currentShip.mapName}</span>
            </div>
            <div className="shipyard-active-layout">
              <div className="shipyard-ship-frame">
                <img alt={currentShip.name} className="shipyard-active-image" src={SHIP_IMAGES[currentShip.id]} />
              </div>
              <div className="shipyard-active-copy">
                <h3>{currentShip.name}</h3>
                <p>Manage your cannon loadout below. The highest cannon tier you own is shown here for inspection.</p>
                <div className="shipyard-active-stats">
                  <Metric icon={UI_GOLD} label="Current Region" value={activeRegion.name} />
                  <Metric icon={UI_GOLD} label="Recommended Region" value={recommendedRegion.name} />
                  <Metric icon={UI_HULL} label="Ship Level" value={currentShip.level} />
                  <Metric icon={UI_CANNONBALLS} label="Cannons" value={formatNumber(currentShip.cannons)} />
                  <Metric icon={UI_GOLD} label="Cargo Capacity" value={formatNumber(getCargoCapacity(gameState))} />
                  <Metric icon={UI_GOLD} label="Owned Status" value={gameState.ownedShips.includes(currentShip.id) ? "Owned" : "Not Owned"} />
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="shipyard-grid">
          <article className="shipyard-panel">
            <h2>Hull</h2>
            <div className="progress-track hull-track" aria-label="Hull percentage">
              <div className="progress-fill hull-fill" style={{ width: `${Math.min(100, hullPercent)}%` }} />
            </div>
            <div className="shipyard-card-stats">
              <Metric icon={UI_HULL} label="Current Hull" value={`${formatNumber(combatStats.currentHull)} / ${formatNumber(combatStats.maxHull)}`} />
              <Metric icon={UI_HULL} label="Base Hull" value={formatNumber(baseHull)} />
              <Metric icon={UI_GOLD} label="Reinforced Hull Bonus" value={`${formatNumber((craftingBonuses.hullMultiplier - 1) * 100)}%`} />
              <Metric icon={UI_HULL} label="Iron Hull Talent Bonus" value={`${formatNumber((talents.ironHull ?? 0) * 5)}%`} />
              <Metric icon={UI_GOLD} label="Repair Cost to Full" value={`${formatNumber(repairCost)} Gold`} />
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

          <article className="shipyard-panel">
            <h2>Cannons</h2>
            <div className="shipyard-cannon-art">
              <img alt={currentCannon.name} className="shipyard-cannon-image" src={cannonImage} />
            </div>
            <div className="shipyard-card-stats">
              <Metric icon={UI_GOLD} label="Current Tier" value={`Tier ${currentCannon.tier}`} />
              <Metric icon={UI_GOLD} label="Cannon Name" value={currentCannon.name} />
              <Metric icon={UI_CANNONBALLS} label="Total Cannons" value={formatNumber(currentShip.cannons)} />
              <Metric icon={UI_GOLD} label="Damage Multiplier" value={`${formatNumber(combatStats.cannonDamageMultiplier)}x`} />
              <Metric icon={UI_GOLD} label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} />
              <Metric icon={UI_HULL} label="Effective Cannons" value={formatNumber(combatStats.effectiveCannons)} />
            </div>
          </article>

          <article className="shipyard-panel">
            <h2>Cannon Loadout</h2>
            <div className="shipyard-card-stats">
              <Metric icon={UI_CANNONBALLS} label="Cannon Capacity" value={formatNumber(cannonCapacity)} />
              <Metric icon={UI_CANNONBALLS} label="Cannons Equipped" value={formatNumber(totalEquippedCannons)} />
            </div>
            <div className="shipyard-loadout-grid">
              {cannons.map((cannon) => {
                const owned = cannonInventory[cannon.id] ?? 0;
                const equipped = equippedCannons[cannon.id] ?? 0;

                if (owned <= 0) {
                  return null;
                }

                const canEquip = owned > equipped && totalEquippedCannons < cannonCapacity;
                const canUnequip = equipped > 0 && totalEquippedCannons > 1;

                return (
                  <article className="shipyard-loadout-card" key={cannon.id}>
                    <div className="shipyard-loadout-image-frame">
                      <img alt={cannon.name} src={CANNON_IMAGES[cannon.tier]} />
                    </div>
                    <div className="shipyard-card-header">
                      <div>
                        <p className="shipyard-kicker">Tier {cannon.tier}</p>
                        <h3>{cannon.name}</h3>
                      </div>
                      <span className="upgrade-level-badge">{formatNumber(cannon.damageMultiplier)}x</span>
                    </div>
                    <div className="shipyard-card-stats">
                      <Metric icon={UI_CANNONBALLS} label="Owned" value={formatNumber(owned)} />
                      <Metric icon={UI_CANNONBALLS} label="Equipped" value={formatNumber(equipped)} />
                    </div>
                    <div className="shipyard-loadout-actions">
                      <button
                        className="chunky-button primary"
                        disabled={!canEquip}
                        onClick={() => dispatch({ type: "EQUIP_CANNON", cannonId: cannon.id, quantity: 1 })}
                        type="button"
                      >
                        Equip 1
                      </button>
                      <button
                        className="chunky-button"
                        disabled={!canUnequip}
                        onClick={() => dispatch({ type: "UNEQUIP_CANNON", cannonId: cannon.id, quantity: 1 })}
                        type="button"
                      >
                        Unequip 1
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="shipyard-panel">
            <h2>Shipwright Upgrades</h2>
            <div className="shipyard-card-stats">
              <Metric
                icon={UI_HULL}
                label="Reinforced Hull"
                value={`Lv. ${gameState.craftedUpgrades.reinforcedHull} - ${getCraftingEffect("reinforcedHull", gameState.craftedUpgrades.reinforcedHull)}`}
              />
              <Metric
                icon={UI_GOLD}
                label="Speed Sails"
                value={`Lv. ${gameState.craftedUpgrades.speedSails} - ${getCraftingEffect("speedSails", gameState.craftedUpgrades.speedSails)}`}
              />
              <Metric
                icon={UI_CANNONBALLS}
                label="Cannon Braces"
                value={`Lv. ${gameState.craftedUpgrades.cannonBraces} - ${formatNumber(craftingBonuses.cannonballRefundChance * 100)}% refund chance`}
              />
            </div>
          </article>

          <article className="shipyard-panel">
            <h2>Talent Bonuses</h2>
            <div className="shipyard-card-stats">
              <Metric label="Powder Kegs" value={`${formatNumber((talents.powderKegs ?? 0) * 2)}% damage`} icon={UI_GOLD} />
              <Metric label="Iron Barrage" value={`${formatNumber((talents.ironBarrage ?? 0) * 1.5)}% faster reload`} icon={UI_GOLD} />
              <Metric label="Dead Eye" value={`${formatNumber((talents.deadEye ?? 0) * 1)}% crit chance`} icon={UI_GOLD} />
              <Metric label="Killing Blow" value={`${formatNumber(1.5 + (talents.killingBlow ?? 0) * 0.05)}x crit multiplier`} icon={UI_GOLD} />
              <Metric label="Broadside Master" value={`+${formatNumber(talents.broadsideMaster ?? 0)} effective cannons`} icon={UI_GOLD} />
              <Metric label="Iron Hull" value={`${formatNumber((talents.ironHull ?? 0) * 5)}% max hull`} icon={UI_HULL} />
              <Metric label="Veteran Crew" value={`${formatNumber((talents.veteranCrew ?? 0) * 3)}% passive repair`} icon={UI_HULL} />
              <Metric label="Night Watch" value={`${formatNumber(talents.nightWatch ?? 0)} hour offline cap`} icon={UI_HULL} />
              <Metric label="Ghost Ship" value={`${formatNumber((talents.ghostShip ?? 0) * 1.5)}% damage reduction`} icon={UI_HULL} />
              <Metric label="Salt & Knowledge" value={`${formatNumber((talents.saltAndKnowledge ?? 0) * 2)}% XP`} icon={UI_GOLD} />
              <Metric label="Plunderer's Eye" value={`${formatNumber((talents.plunderersEye ?? 0) * 3)}% gold`} icon={UI_GOLD} />
              <Metric label="Lucky Coin" value={`${formatNumber((talents.luckyCoin ?? 0) * 1)}% treasure luck`} icon={UI_GOLD} />
              <Metric label="Chest Seeker" value={`${formatNumber((talents.chestSeeker ?? 0) * 2)}% treasure chance`} icon={UI_GOLD} />
              <Metric label="Merchant's Touch" value={`${formatNumber((talents.merchantsTouch ?? 0) * 2)}% sell value`} icon={UI_GOLD} />
              <Metric label="Trade Wind" value={`+${formatNumber((talents.tradeWind ?? 0) * 50)} gold/hour`} icon={UI_GOLD} />
            </div>
          </article>

          <article className="shipyard-panel">
            <h2>Crew Bonuses</h2>
            <div className="shipyard-card-stats">
              <Metric icon={UI_GOLD} label="Gunner Volley Bonus" value={`${formatNumber((crewBonuses.volleyDamageMultiplier - 1) * 100)}%`} />
              <Metric icon={UI_GOLD} label="Carpenter Repair Discount" value={`${formatNumber((1 - crewBonuses.repairCostMultiplier) * 100)}%`} />
              <Metric icon={UI_GOLD} label="Quartermaster Gold Bonus" value={`${formatNumber((crewBonuses.combatGoldMultiplier - 1) * 100)}%`} />
            </div>
          </article>

          <article className="shipyard-panel">
            <h2>Combat Readiness</h2>
            <div className="shipyard-card-stats">
              <Metric label="Selected Enemy" value={idleEstimate.enemy.name} icon={UI_HULL} />
              <Metric label="Estimated Enemy HP" value={formatNumber(idleEstimate.enemy.maxHP)} icon={UI_HULL} />
              <Metric label="Estimated Enemy Damage" value={formatNumber(idleEstimate.enemy.damage)} icon={UI_HULL} />
              <Metric label="Volleys to Defeat" value={formatNumber(idleEstimate.volleysNeeded)} icon={UI_CANNONBALLS} />
              <Metric label="Cannonballs Needed" value={formatNumber(idleEstimate.volleysNeeded * idleEstimate.ballsPerVolley)} icon={UI_CANNONBALLS} />
              <Metric label="Hull Damage Taken" value={formatNumber(idleEstimate.hullDamagePerEnemy)} icon={UI_HULL} />
              <Metric label="Reward Gold" value={formatNumber(idleEstimate.goldPerEnemy)} icon={UI_GOLD} />
              <Metric label="Reward XP" value={formatNumber(idleEstimate.xpPerEnemy)} icon={UI_GOLD} />
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="shipyard-metric">
      {icon ? <img alt={label} className="shipyard-metric-icon" src={icon} /> : null}
      <div className="shipyard-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default MyShip;
