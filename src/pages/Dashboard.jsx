import {
  calcCannonUpgradeCost,
  calcOfflineCap,
  calcGoldPerHour,
  calcXpPerHour,
  formatDuration,
  formatNumber,
  getCargoCapacity,
  getEstimatedCargoValue,
  getEstimatedResourceValue,
  getEffectiveBallsPerBattle,
  getCurrentCannon,
  getCurrentShip,
  getMarketCooldownRemaining,
  getNextCannon,
  getTalentBonuses,
  getUsedCargo,
  getXpRequired
} from "../utils/gameEngine.js";
import { skills } from "../data/skills.js";
import { treasureSites } from "../data/treasures.js";

function Dashboard({ gameState, dispatch }) {
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const nextCannon = getNextCannon(gameState);
  const talentBonuses = getTalentBonuses(gameState);
  const upgradeCost = calcCannonUpgradeCost(gameState);
  const xpRequired = getXpRequired(gameState.playerLevel);
  const xpProgress = xpRequired === Infinity ? 100 : (gameState.playerXP / xpRequired) * 100;
  const visibleActivityLog = (gameState.activityLog ?? []).slice(0, 6);
  const canBuyCannonballs = gameState.gold >= currentCannon.goldPer100Balls;
  const canUpgradeCannons =
    Boolean(nextCannon) &&
    gameState.playerLevel >= nextCannon.unlockLevel &&
    gameState.gold >= upgradeCost;
  const usedCargo = getUsedCargo(gameState);
  const cargoCapacity = getCargoCapacity(gameState);
  const marketCooldown = getMarketCooldownRemaining(gameState);
  const activeTreasureDig = gameState.activeTreasureDig;
  const activeTreasureSite = treasureSites.find((site) => site.id === activeTreasureDig?.siteId);
  const activeTreasureRemaining = activeTreasureDig
    ? Math.max(0, activeTreasureDig.finishesAt - Date.now())
    : 0;
  const recentMapLog = (gameState.activityLog ?? []).find((entry) => (
    getLogMessage(entry).toLowerCase().includes("treasure map")
  ));

  function handleManualSink() {
    dispatch({ type: "SINK_ENEMY_SHIP", xpAmount: 5 });
  }

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

        <article className="pixel-panel rates-card">
          <h2>Idle Rates</h2>
          <div className="stat-grid three-up">
            <div className="stat-box">
              <span>Ships / Hour</span>
              <strong>{formatNumber(currentShip.shipsPerHour)}</strong>
            </div>
            <div className="stat-box">
              <span>Gold / Hour</span>
              <strong>{formatNumber(calcGoldPerHour(gameState))}</strong>
            </div>
            <div className="stat-box">
              <span>XP / Hour</span>
              <strong>{formatNumber(calcXpPerHour(gameState))}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel controls-card">
          <h2>Actions</h2>
          <div className="button-row">
            <button
              className="chunky-button primary"
              disabled={gameState.isIdling}
              onClick={() => dispatch({ type: "START_IDLE" })}
              type="button"
            >
              Start Idling
            </button>
            <button
              className="chunky-button"
              disabled={!gameState.isIdling}
              onClick={() => dispatch({ type: "STOP_IDLE" })}
              type="button"
            >
              Stop Idling
            </button>
            <button className="chunky-button danger" onClick={handleManualSink} type="button">
              Sink Enemy Ship
            </button>
          </div>
        </article>

        <article className="pixel-panel cannon-card">
          <div className="panel-heading-row">
            <h2>Armoury</h2>
            <span className="resource-counter">{formatNumber(gameState.cannonballs)} Cannonballs</span>
          </div>

          <div className="armoury-grid">
            <div className="stat-box">
              <span>Current Tier</span>
              <strong>Tier {currentCannon.tier}</strong>
            </div>
            <div className="stat-box">
              <span>Cannon</span>
              <strong>{currentCannon.name}</strong>
            </div>
            <div className="stat-box">
              <span>Damage</span>
              <strong>{formatNumber(currentCannon.damage)}</strong>
            </div>
            <div className="stat-box">
              <span>Used / Battle</span>
              <strong>{formatNumber(getEffectiveBallsPerBattle(gameState))}</strong>
            </div>
            <div className="stat-box">
              <span>Cost / 100 Balls</span>
              <strong>{formatNumber(currentCannon.goldPer100Balls)}</strong>
            </div>
            <div className="stat-box">
              <span>Next Tier</span>
              <strong>{nextCannon ? nextCannon.name : "Max Tier"}</strong>
            </div>
            <div className="stat-box">
              <span>Upgrade Cost</span>
              <strong>{nextCannon ? formatNumber(upgradeCost) : "Complete"}</strong>
            </div>
            <div className="stat-box">
              <span>Unlock Level</span>
              <strong>{nextCannon ? nextCannon.unlockLevel : "Max"}</strong>
            </div>
          </div>

          <div className="button-row armoury-actions">
            <button
              className="chunky-button primary"
              disabled={!canBuyCannonballs}
              onClick={() => dispatch({ type: "BUY_CANNONBALLS" })}
              type="button"
            >
              Buy 100 Cannonballs
            </button>
            <button
              className="chunky-button"
              disabled={!canUpgradeCannons}
              onClick={() => dispatch({ type: "UPGRADE_CANNONS" })}
              type="button"
            >
              Upgrade Cannons
            </button>
          </div>
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
