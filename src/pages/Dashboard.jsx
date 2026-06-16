import {
  calcOfflineCap,
  formatDuration,
  formatNumber,
  getCargoCapacity,
  getCraftingBonuses,
  getEstimatedCargoValue,
  getEstimatedResourceValue,
  getIdleCombatEstimate,
  getCurrentShip,
  getPlayerCombatStats,
  getMarketCooldownRemaining,
  getTalentBonuses,
  getUsedCargo,
  getXpRequired,
  getClaimableAchievements
} from "../utils/gameEngine.js";
import { achievements } from "../data/achievements.js";
import { skills } from "../data/skills.js";
import { treasureSites } from "../data/treasures.js";

function Dashboard({ gameState, onNavigate }) {
  const currentShip = getCurrentShip(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const xpRequired = getXpRequired(gameState.playerLevel);
  const xpProgress = xpRequired === Infinity ? 100 : (gameState.playerXP / xpRequired) * 100;
  const visibleActivityLog = (gameState.activityLog ?? []).slice(0, 6);
  const usedCargo = getUsedCargo(gameState);
  const cargoCapacity = getCargoCapacity(gameState);
  const marketCooldown = getMarketCooldownRemaining(gameState);
  const craftingBonuses = getCraftingBonuses(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const activeTreasureDig = gameState.activeTreasureDig;
  const activeTreasureSite = treasureSites.find((site) => site.id === activeTreasureDig?.siteId);
  const activeTreasureRemaining = activeTreasureDig
    ? Math.max(0, activeTreasureDig.finishesAt - Date.now())
    : 0;
  const recentMapLog = (gameState.activityLog ?? []).find((entry) => (
    getLogMessage(entry).toLowerCase().includes("treasure map")
  ));
  const claimableAchievements = getClaimableAchievements(gameState);
  const latestClaimableAchievement = claimableAchievements[0];

  function getLogMessage(entry) {
    return typeof entry === "string" ? entry : entry.message;
  }

  function getLogClassName(entry) {
    const type = typeof entry === "string" ? "info" : entry.type;
    return type === "warning" ? "warning" : "info";
  }

  return (
    <section className="dashboard">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Idle Pirate Game</p>
          <h1>Sea of Treasure</h1>
        </div>
        <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
          {gameState.isIdling ? "Idling" : "Docked"}
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="pixel-panel captain-card">
          <h2>Captain</h2>
          <div className="level-row">
            <span>Level {gameState.playerLevel}</span>
            <span>
              {formatNumber(gameState.playerXP)} / {formatNumber(xpRequired)} XP
            </span>
          </div>
          <div className="progress-track" aria-label="XP progress">
            <div className="progress-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
          </div>
          <div className="stat-grid">
            <div className="stat-box">
              <span>Gold</span>
              <strong>{formatNumber(gameState.gold)}</strong>
            </div>
            <div className="stat-box">
              <span>Talent Points</span>
              <strong>{formatNumber(gameState.talentPoints)}</strong>
            </div>
            <div className="stat-box">
              <span>Ships Sunk</span>
              <strong>{formatNumber(gameState.totalShipsSunk)}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel ship-card">
          <h2>Current Voyage</h2>
          <div className="info-list">
            <div>
              <span>Ship</span>
              <strong>{currentShip.name}</strong>
            </div>
            <div>
              <span>Map</span>
              <strong>{currentShip.mapName}</strong>
            </div>
            <div>
              <span>Cannons</span>
              <strong>{currentShip.cannons}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel combat-summary-card">
          <h2>Combat Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Selected Enemy</span>
              <strong>{idleEstimate.enemy.name}</strong>
            </div>
            <div className="stat-box">
              <span>Hull</span>
              <strong>{formatNumber(combatStats.currentHull)} / {formatNumber(combatStats.maxHull)}</strong>
            </div>
            <div className="stat-box">
              <span>Cannonballs</span>
              <strong>{formatNumber(gameState.cannonballs)}</strong>
            </div>
            <div className="stat-box">
              <span>Estimated Gold / Hour</span>
              <strong>{formatNumber(idleEstimate.goldPerHour)}</strong>
            </div>
            <div className="stat-box">
              <span>Estimated XP / Hour</span>
              <strong>{formatNumber(idleEstimate.xpPerHour)}</strong>
            </div>
          </div>
          <p className="shop-note">Use the Battle page to fight enemies.</p>
          <button className="chunky-button primary nav-hint-button" onClick={() => onNavigate?.("battle")} type="button">
            Open Battle
          </button>
        </article>

        <article className="pixel-panel skills-summary-card">
          <h2>Skills Summary</h2>
          <div className="skills-summary-grid">
            {skills.map((skill) => {
              const skillState = gameState.skills[skill.id];
              const isActive = Boolean(skillState?.active);

              return (
                <div className={isActive ? "skill-summary-item active" : "skill-summary-item"} key={skill.id}>
                  <span>{skill.name}</span>
                  <strong>Level {skillState?.level ?? 1}</strong>
                  {isActive && <em>{skill.actionName}</em>}
                </div>
              );
            })}
          </div>
        </article>

        <article className="pixel-panel talent-summary-card">
          <h2>Talent Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Available Points</span>
              <strong>{formatNumber(gameState.talentPoints)}</strong>
            </div>
            <div className="stat-box">
              <span>Gold Multiplier</span>
              <strong>{formatNumber(talentBonuses.goldMultiplier)}x</strong>
            </div>
            <div className="stat-box">
              <span>XP Multiplier</span>
              <strong>{formatNumber(talentBonuses.xpMultiplier)}x</strong>
            </div>
            <div className="stat-box">
              <span>Passive Gold / Hour</span>
              <strong>{formatNumber(talentBonuses.passiveGoldPerHour)}</strong>
            </div>
            <div className="stat-box">
              <span>Offline Cap</span>
              <strong>{formatDuration(calcOfflineCap(gameState))}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel trading-summary-card">
          <h2>Trading Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Cargo</span>
              <strong>{formatNumber(usedCargo)} / {formatNumber(cargoCapacity)}</strong>
            </div>
            <div className="stat-box">
              <span>Trading Level</span>
              <strong>{gameState.skills.trading?.level ?? 1}</strong>
            </div>
            <div className="stat-box">
              <span>Market Allowance</span>
              <strong>
                {formatNumber(gameState.marketTradeUsed)} / {formatNumber(gameState.marketTradeLimit)}
              </strong>
            </div>
            <div className="stat-box">
              <span>Cargo Value</span>
              <strong>{formatNumber(getEstimatedCargoValue(gameState))}</strong>
            </div>
            <div className="stat-box">
              <span>Next Market Cycle</span>
              <strong>{marketCooldown > 0 ? formatDuration(marketCooldown) : "Ready"}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel treasure-summary-card">
          <h2>Treasure Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Treasure Maps</span>
              <strong>{formatNumber(gameState.treasureMaps)}</strong>
            </div>
            <div className="stat-box">
              <span>Recent Map Find</span>
              <strong>{recentMapLog ? getLogMessage(recentMapLog) : "None"}</strong>
            </div>
            <div className="stat-box">
              <span>Active Dig</span>
              <strong>{activeTreasureSite ? activeTreasureSite.name : "None"}</strong>
            </div>
            <div className="stat-box">
              <span>Time Remaining</span>
              <strong>{activeTreasureDig ? formatDuration(activeTreasureRemaining) : "None"}</strong>
            </div>
            <div className="stat-box">
              <span>Rare Finds</span>
              <strong>{formatNumber(gameState.treasureInventory.length)}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel resource-summary-card">
          <h2>Resource Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Fish</span>
              <strong>{formatNumber(gameState.resources.fish)}</strong>
            </div>
            <div className="stat-box">
              <span>Whale Oil</span>
              <strong>{formatNumber(gameState.resources.whaleOil)}</strong>
            </div>
            <div className="stat-box">
              <span>Estimated Value</span>
              <strong>{formatNumber(getEstimatedResourceValue(gameState))}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel materials-summary-card">
          <h2>Materials Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Gunpowder</span>
              <strong>{formatNumber(gameState.materials.gunpowder)}</strong>
            </div>
            <div className="stat-box">
              <span>Cannon Parts</span>
              <strong>{formatNumber(gameState.materials.cannonParts)}</strong>
            </div>
            <div className="stat-box">
              <span>Ancient Relics</span>
              <strong>{formatNumber(gameState.materials.ancientRelics)}</strong>
            </div>
            <div className="stat-box">
              <span>Rare Map Pieces</span>
              <strong>{formatNumber(gameState.rareMapPieces)}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel shipwright-summary-card">
          <h2>Shipwright Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Reinforced Hull</span>
              <strong>Lv. {gameState.craftedUpgrades.reinforcedHull} Future Hull</strong>
            </div>
            <div className="stat-box">
              <span>Speed Sails</span>
              <strong>Lv. {gameState.craftedUpgrades.speedSails}</strong>
            </div>
            <div className="stat-box">
              <span>Cannon Braces</span>
              <strong>Lv. {gameState.craftedUpgrades.cannonBraces}</strong>
            </div>
            <div className="stat-box">
              <span>Ships / Hour Bonus</span>
              <strong>{formatNumber((craftingBonuses.shipsPerHourMultiplier - 1) * 100)}%</strong>
            </div>
            <div className="stat-box">
              <span>Cannonball Refund Chance</span>
              <strong>{formatNumber(craftingBonuses.cannonballRefundChance * 100)}%</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel achievements-summary-card">
          <h2>Achievements Summary</h2>
          <div className="summary-stat-grid">
            <div className="stat-box">
              <span>Claimed</span>
              <strong>
                {formatNumber(gameState.claimedAchievements?.length ?? 0)} / {formatNumber(achievements.length)}
              </strong>
            </div>
            <div className="stat-box">
              <span>Claimable</span>
              <strong>{formatNumber(claimableAchievements.length)}</strong>
            </div>
            <div className="stat-box">
              <span>Latest Claimable</span>
              <strong>{latestClaimableAchievement ? latestClaimableAchievement.name : "None"}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel log-card">
          <h2>Activity Log</h2>
          {visibleActivityLog.length > 0 ? (
            <ul className="activity-log">
              {visibleActivityLog.map((entry, index) => (
                <li className={getLogClassName(entry)} key={`${getLogMessage(entry)}-${index}`}>
                  {getLogMessage(entry)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-log">No ships sunk yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
