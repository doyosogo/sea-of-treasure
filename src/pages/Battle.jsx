import {
  formatNumber,
  generateEnemy,
  getCurrentCannon,
  getEffectiveBallsPerBattle,
  getIdleCombatEstimate,
  getPlayerCombatStats
} from "../utils/gameEngine.js";
import { enemies } from "../data/enemies.js";

function Battle({ gameState, dispatch }) {
  const currentCannon = getCurrentCannon(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const hullProgress = combatStats.maxHull > 0 ? (combatStats.currentHull / combatStats.maxHull) * 100 : 0;
  const missingHull = Math.max(0, combatStats.maxHull - combatStats.currentHull);
  const repairCost = missingHull * 10;
  const currentBattle = gameState.currentBattle;
  const battleEnemy = currentBattle?.enemy;
  const battleHpProgress = battleEnemy ? (battleEnemy.currentHP / battleEnemy.maxHP) * 100 : 0;
  const mainActionDisabled = battleEnemy
    ? gameState.cannonballs < getEffectiveBallsPerBattle(gameState)
    : combatStats.currentHull <= 0;

  function handleMainCombatAction() {
    dispatch({ type: battleEnemy ? "FIRE_VOLLEY" : "START_BATTLE" });
  }

  return (
    <section className="battle-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Combat Deck</p>
          <h1>Battle</h1>
        </div>
        <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
          {gameState.isIdling ? "Idling" : battleEnemy ? "In Battle" : "Ready"}
        </div>
      </div>

      <article className="pixel-panel enemy-selector-card battle-section">
        <h2>Enemy Selection</h2>
        <div className="enemy-grid">
          {enemies.map((enemy) => {
            const locked = gameState.playerLevel < enemy.unlockLevel;
            const selected = gameState.selectedEnemyId === enemy.id;
            const estimate = generateEnemy(gameState, enemy);

            return (
              <div
                className={`enemy-card ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
                key={enemy.id}
              >
                <div className="enemy-card-header">
                  <h3>{enemy.name}</h3>
                  <span className="enemy-difficulty">{enemy.difficulty}</span>
                </div>
                <p>{enemy.description}</p>
                <div className="ship-meta-list">
                  <div><span>HP Estimate</span><strong>{formatNumber(estimate.maxHP)}</strong></div>
                  <div><span>Damage</span><strong>{formatNumber(estimate.damage)}</strong></div>
                  <div><span>Gold</span><strong>{formatNumber(estimate.goldReward)}</strong></div>
                  <div><span>XP</span><strong>{formatNumber(estimate.xpReward)}</strong></div>
                </div>
                <button
                  className="chunky-button primary"
                  disabled={locked || selected || Boolean(currentBattle)}
                  onClick={() => dispatch({ type: "SELECT_ENEMY", enemyId: enemy.id })}
                  type="button"
                >
                  {locked ? `Unlocks Lv. ${enemy.unlockLevel}` : selected ? "Selected" : "Select"}
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="pixel-panel combat-action-panel battle-section">
        <h2>{battleEnemy ? "Current Battle" : "Battle Control"}</h2>
        <div className="battle-control-card">
          <div className="enemy-card-header">
            <h3>{battleEnemy ? battleEnemy.name : idleEstimate.enemy.name}</h3>
            <span className="enemy-difficulty">{battleEnemy ? battleEnemy.difficulty : idleEstimate.enemy.difficulty}</span>
          </div>
          {battleEnemy ? (
            <>
              <div className="level-row">
                <span>Enemy HP</span>
                <span>{formatNumber(battleEnemy.currentHP)} / {formatNumber(battleEnemy.maxHP)}</span>
              </div>
              <div className="progress-track enemy-hp-track" aria-label="Enemy hull">
                <div className="progress-fill enemy-hp-fill" style={{ width: `${Math.min(100, battleHpProgress)}%` }} />
              </div>
              <div className="battle-control-stats">
                <Stat label="Enemy Damage" value={formatNumber(battleEnemy.damage)} />
                <Stat label="Shots Fired" value={formatNumber(currentBattle.shotsFired)} />
              </div>
            </>
          ) : (
            <>
              <p className="skill-description">Selected enemy is ready. Start battle when your hull and cannonballs are prepared.</p>
              <div className="battle-control-stats">
                <Stat label="Enemy HP" value={formatNumber(idleEstimate.enemy.maxHP)} />
                <Stat label="Enemy Damage" value={formatNumber(idleEstimate.enemy.damage)} />
              </div>
            </>
          )}
          <button
            className="chunky-button danger combat-action-button"
            disabled={mainActionDisabled}
            onClick={handleMainCombatAction}
            type="button"
          >
            {battleEnemy ? "Fire Volley" : "Start Battle"}
          </button>
        </div>
      </article>

      <article className="pixel-panel player-combat-panel battle-section">
        <div className="panel-heading-row">
          <h2>Player Combat Stats</h2>
          <span className="resource-counter">{formatNumber(gameState.cannonballs)} Cannonballs</span>
        </div>
        <div className="level-row">
          <span>Hull</span>
          <span>{formatNumber(combatStats.currentHull)} / {formatNumber(combatStats.maxHull)}</span>
        </div>
        <div className="progress-track hull-track" aria-label="Hull integrity">
          <div className="progress-fill hull-fill" style={{ width: `${Math.min(100, hullProgress)}%` }} />
        </div>
        <div className="combat-stat-grid readable-card-grid">
          <Stat label="Hull" value={`${formatNumber(combatStats.currentHull)} / ${formatNumber(combatStats.maxHull)}`} />
          <Stat label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
          <Stat label="Cannon Tier" value={`Tier ${currentCannon.tier}`} />
          <Stat label="Cannon Name" value={currentCannon.name} />
          <Stat label="Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} />
          <Stat label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} />
          <Stat label="Crit Chance" value={`${formatNumber(combatStats.critChance * 100)}%`} />
          <Stat label="Crit Multiplier" value={`${formatNumber(combatStats.critMultiplier)}x`} />
          <Stat label="Repair Cost" value={formatNumber(repairCost)} />
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

      <article className="pixel-panel idle-combat-panel battle-section">
        <div className="panel-heading-row">
          <h2>Idle Combat</h2>
          <span className="resource-counter">Enemy: {idleEstimate.enemy.name}</span>
        </div>
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
        </div>
        <div className="idle-estimate-grid readable-card-grid">
          <Stat label="Kills / Hour" value={formatNumber(idleEstimate.enemiesPerHour)} />
          <Stat label="Gold / Hour" value={formatNumber(idleEstimate.goldPerHour)} />
          <Stat label="XP / Hour" value={formatNumber(idleEstimate.xpPerHour)} />
          <Stat label="Cannonballs / Hour" value={formatNumber(idleEstimate.cannonballsPerHour)} />
          <Stat label="Hull Damage / Hour" value={formatNumber(idleEstimate.hullDamagePerHour)} />
        </div>
      </article>

      <article className="pixel-panel log-card battle-log-card">
        <h2>Combat Activity</h2>
        {(gameState.activityLog ?? []).slice(0, 6).length > 0 ? (
          <ul className="activity-log">
            {(gameState.activityLog ?? []).slice(0, 6).map((entry, index) => {
              const message = typeof entry === "string" ? entry : entry.message;
              const type = typeof entry === "string" ? "info" : entry.type;

              return (
                <li className={type === "warning" ? "warning" : "info"} key={`${message}-${index}`}>
                  {message}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-log">No combat activity yet.</p>
        )}
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

export default Battle;
