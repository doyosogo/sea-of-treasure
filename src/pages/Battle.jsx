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
  const lastBattleEnemy = gameState.lastBattleEnemyId
    ? enemies.find((enemy) => enemy.id === gameState.lastBattleEnemyId) ?? null
    : null;
  const battleHpProgress = battleEnemy ? (battleEnemy.currentHP / battleEnemy.maxHP) * 100 : 0;
  const mainActionDisabled = battleEnemy
    ? gameState.cannonballs < getEffectiveBallsPerBattle(gameState)
    : !lastBattleEnemy;

  function handleMainCombatAction() {
    if (battleEnemy) {
      dispatch({ type: "FIRE_VOLLEY" });
      return;
    }

    if (lastBattleEnemy) {
      dispatch({ type: "START_BATTLE", enemyId: lastBattleEnemy.id });
    }
  }

  function getEnemyBattleDisabled(enemy, locked) {
    return locked || gameState.isIdling || Boolean(currentBattle) || combatStats.currentHull <= 0;
  }

  function getEnemyBattleLabel(enemy, locked) {
    if (locked) {
      return `Unlocks Lv. ${enemy.unlockLevel}`;
    }

    if (gameState.isIdling) {
      return "Stop idling before starting active battle.";
    }

    if (currentBattle) {
      return "Finish current battle first.";
    }

    return "Battle";
  }

  return (
    <section className="battle-page">
      <article className="pixel-panel active-combat-panel">
        <div className="active-combat-header">
          <div>
            <p className="eyebrow">Active Combat</p>
            <h1>{battleEnemy ? battleEnemy.name : "No Active Battle"}</h1>
          </div>
          <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
            {gameState.isIdling ? "Idling" : battleEnemy ? "In Battle" : "Ready"}
          </div>
        </div>

        {!battleEnemy && !lastBattleEnemy && (
          <p className="skill-description">Choose an enemy below to begin battle.</p>
        )}

        <div className="battle-main-grid">
          <div className="battle-resource-column">
            <div className="level-row">
              <span>Enemy HP</span>
              <span>
                {battleEnemy ? `${formatNumber(battleEnemy.currentHP)} / ${formatNumber(battleEnemy.maxHP)}` : "No active enemy"}
              </span>
            </div>
            <div className="progress-track enemy-hp-track" aria-label="Enemy hull">
              <div className="progress-fill enemy-hp-fill" style={{ width: `${battleEnemy ? Math.min(100, battleHpProgress) : 0}%` }} />
            </div>

            <div className="level-row">
              <span>Player Hull</span>
              <span>{formatNumber(combatStats.currentHull)} / {formatNumber(combatStats.maxHull)}</span>
            </div>
            <div className="progress-track hull-track" aria-label="Hull integrity">
              <div className="progress-fill hull-fill" style={{ width: `${Math.min(100, hullProgress)}%` }} />
            </div>
          </div>

          <div className="battle-resource-row">
            <Stat label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
            <Stat label="Shots Fired" value={battleEnemy ? formatNumber(currentBattle.shotsFired) : "0"} />
            <Stat label="Enemy Damage" value={battleEnemy ? formatNumber(battleEnemy.damage) : "-"} />
            <Stat label="Repair Cost" value={formatNumber(repairCost)} />
          </div>
        </div>

        <div className="battle-action-row">
          <button
            className="chunky-button danger combat-action-button"
            disabled={mainActionDisabled}
            onClick={handleMainCombatAction}
            type="button"
          >
            {battleEnemy ? "Fire Volley" : lastBattleEnemy ? "Battle Again" : "Choose an enemy below"}
          </button>
          <button
            className="chunky-button"
            disabled={missingHull <= 0 || gameState.gold <= 0}
            onClick={() => dispatch({ type: "REPAIR_HULL" })}
            type="button"
          >
            Repair Hull
          </button>
        </div>
      </article>

      <article className="pixel-panel player-combat-panel battle-section">
        <div className="panel-heading-row">
          <h2>Player Combat Stats</h2>
          <span className="resource-counter">{currentCannon.name}</span>
        </div>
        <div className="combat-stat-grid readable-card-grid">
          <Stat label="Cannon Tier" value={`Tier ${currentCannon.tier}`} />
          <Stat label="Cannon Name" value={currentCannon.name} />
          <Stat label="Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} />
          <Stat label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} />
          <Stat label="Crit Chance" value={`${formatNumber(combatStats.critChance * 100)}%`} />
          <Stat label="Crit Multiplier" value={`${formatNumber(combatStats.critMultiplier)}x`} />
        </div>
      </article>

      <article className="pixel-panel enemy-selector-card battle-section">
        <h2>Enemy Selection</h2>
        <div className="enemy-card-grid">
          {enemies.map((enemy) => {
            const locked = gameState.playerLevel < enemy.unlockLevel;
            const selected = gameState.selectedEnemyId === enemy.id;
            const estimate = generateEnemy(gameState, enemy);
            const disabled = getEnemyBattleDisabled(enemy, locked);

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
                  <div><span>Gold Reward</span><strong>{formatNumber(estimate.goldReward)}</strong></div>
                  <div><span>XP Reward</span><strong>{formatNumber(estimate.xpReward)}</strong></div>
                </div>
                <button
                  className="chunky-button primary battle-card-button"
                  disabled={disabled}
                  onClick={() => dispatch({ type: "START_BATTLE", enemyId: enemy.id })}
                  type="button"
                >
                  {getEnemyBattleLabel(enemy, locked)}
                </button>
              </div>
            );
          })}
        </div>
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
