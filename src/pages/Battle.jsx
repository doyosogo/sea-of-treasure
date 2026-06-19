import {
  ENEMY_IMAGES,
  LOGO,
  SCENES,
  UI_ICONS
} from "../data/assets.js";
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
  const currentBattle = gameState.currentBattle;
  const battleEnemy = currentBattle?.enemy ?? null;
  const selectedEnemyType = enemies.find((enemy) => enemy.id === gameState.selectedEnemyId) ?? enemies[1] ?? enemies[0];
  const lastBattleEnemy = gameState.lastBattleEnemyId
    ? enemies.find((enemy) => enemy.id === gameState.lastBattleEnemyId) ?? null
    : null;
  const activeEnemy = battleEnemy ?? selectedEnemyType ?? lastBattleEnemy;
  const hullProgress = combatStats.maxHull > 0 ? (combatStats.currentHull / combatStats.maxHull) * 100 : 0;
  const enemyHpProgress = battleEnemy ? (battleEnemy.currentHP / battleEnemy.maxHP) * 100 : 0;
  const missingHull = Math.max(0, combatStats.maxHull - combatStats.currentHull);
  const repairCost = missingHull * 10;
  const mainActionDisabled = battleEnemy ? gameState.cannonballs < getEffectiveBallsPerBattle(gameState) : !lastBattleEnemy;
  const mainActionLabel = battleEnemy ? "Fire Volley" : lastBattleEnemy ? "Battle Again" : "Choose an enemy below";

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
      return "Stop idling first";
    }

    if (currentBattle) {
      return "Finish current battle";
    }

    return "Battle";
  }

  return (
    <section
      className="battle-page battle-reset battle-scene"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.battle})`
      }}
    >
      <div className="battle-overlay" aria-hidden="true" />

      <div className="battle-shell">
        <header className="battle-topbar">
          <img alt="Sea of Treasure logo" className="battle-logo" src={LOGO} />
          <div className="battle-title-copy">
            <p className="eyebrow">Battle Board</p>
            <h1>Battle Board</h1>
            <p>Engage enemy vessels and plunder their cargo.</p>
          </div>
          <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
            {gameState.isIdling ? "Idling" : battleEnemy ? "In Battle" : "Ready"}
          </div>
        </header>

        <article className="battle-panel battle-active-panel">
          <div className="panel-heading-row battle-panel-heading">
            <h2>Active Battle</h2>
            <span className="resource-counter">{battleEnemy ? battleEnemy.difficulty : "Standby"}</span>
          </div>

          <div className="battle-active-layout">
            <div className="battle-portrait-column">
              <div className="battle-portrait-frame">
                <img
                  alt={activeEnemy?.name ?? "Battle target"}
                  className="battle-portrait-image"
                  src={activeEnemy ? ENEMY_IMAGES[activeEnemy.id] : ENEMY_IMAGES.smugglerCutter}
                />
              </div>
              <div className="battle-name-strip">
                <strong>{battleEnemy ? battleEnemy.name : activeEnemy?.name ?? "Choose an enemy below"}</strong>
                <span>{battleEnemy ? battleEnemy.difficulty : "Standby"}</span>
              </div>
            </div>

            <div className="battle-status-column">
              <div className="battle-meter">
                <div className="level-row">
                  <span>Enemy HP</span>
                  <span>
                    {battleEnemy
                      ? `${formatNumber(battleEnemy.currentHP)} / ${formatNumber(battleEnemy.maxHP)}`
                      : "No active enemy"}
                  </span>
                </div>
                <div className="progress-track enemy-hp-track" aria-label="Enemy hull">
                  <div className="progress-fill enemy-hp-fill" style={{ width: `${battleEnemy ? Math.min(100, enemyHpProgress) : 0}%` }} />
                </div>
              </div>

              <div className="battle-meter">
                <div className="level-row">
                  <span>Player Hull</span>
                  <span>{formatNumber(combatStats.currentHull)} / {formatNumber(combatStats.maxHull)}</span>
                </div>
                <div className="progress-track hull-track" aria-label="Hull integrity">
                  <div className="progress-fill hull-fill" style={{ width: `${Math.min(100, hullProgress)}%` }} />
                </div>
              </div>

              <div className="battle-stat-strip">
                <Metric icon={UI_ICONS.cannonballs} label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
                <Metric icon={UI_ICONS.gold} label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} />
                <Metric icon={UI_ICONS.xp} label="Shots Fired" value={battleEnemy ? formatNumber(currentBattle.shotsFired) : "0"} />
                <Metric icon={UI_ICONS.hull} label="Repair Cost" value={formatNumber(repairCost)} />
              </div>
            </div>
          </div>

          <div className="battle-action-row">
            <button
              className="chunky-button danger battle-main-button"
              disabled={mainActionDisabled}
              onClick={handleMainCombatAction}
              type="button"
            >
              {mainActionLabel}
            </button>
            <button
              className="chunky-button battle-repair-button"
              disabled={missingHull <= 0 || gameState.gold <= 0}
              onClick={() => dispatch({ type: "REPAIR_HULL" })}
              type="button"
            >
              Repair Hull
            </button>
          </div>
        </article>

        <section className="battle-secondary-grid">
          <article className="battle-panel battle-selection-panel">
            <div className="panel-heading-row">
              <h2>Enemy Selection</h2>
              <span className="resource-counter">Choose a target</span>
            </div>
            <div className="enemy-card-grid battle-enemy-grid">
              {enemies.map((enemy) => {
                const locked = gameState.playerLevel < enemy.unlockLevel;
                const selected = gameState.selectedEnemyId === enemy.id;
                const estimate = generateEnemy(gameState, enemy);
                const disabled = getEnemyBattleDisabled(enemy, locked);

                return (
                  <div className={`battle-enemy-card ${selected ? "selected" : ""} ${locked ? "locked" : ""}`} key={enemy.id}>
                    <div className="battle-enemy-art-frame">
                      <img alt={enemy.name} className="battle-enemy-art" src={ENEMY_IMAGES[enemy.id]} />
                    </div>
                    <div className="enemy-card-header battle-enemy-header">
                      <h3>{enemy.name}</h3>
                      <span className="enemy-difficulty">{enemy.difficulty}</span>
                    </div>
                    <div className="battle-enemy-grid-stats">
                      <Metric label="HP" value={formatNumber(estimate.maxHP)} icon={UI_ICONS.hull} />
                      <Metric label="Damage" value={formatNumber(estimate.damage)} icon={UI_ICONS.hull} />
                      <Metric label="Gold Reward" value={formatNumber(estimate.goldReward)} icon={UI_ICONS.gold} />
                      <Metric label="XP Reward" value={formatNumber(estimate.xpReward)} icon={UI_ICONS.xp} />
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

          <article className="battle-panel battle-idle-panel">
            <div className="panel-heading-row">
              <h2>Idle Combat</h2>
              <span className="resource-counter">Selected: {idleEstimate.enemy.name}</span>
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
            <div className="battle-idle-stats">
              <Metric icon={UI_ICONS.xp} label="Kills / Hour" value={formatNumber(idleEstimate.enemiesPerHour)} />
              <Metric icon={UI_ICONS.gold} label="Gold / Hour" value={formatNumber(idleEstimate.goldPerHour)} />
              <Metric icon={UI_ICONS.xp} label="XP / Hour" value={formatNumber(idleEstimate.xpPerHour)} />
              <Metric icon={UI_ICONS.cannonballs} label="Cannonballs / Hour" value={formatNumber(idleEstimate.cannonballsPerHour)} />
              <Metric icon={UI_ICONS.hull} label="Hull Damage / Hour" value={formatNumber(idleEstimate.hullDamagePerHour)} />
            </div>
          </article>
        </section>

        <article className="battle-panel battle-log-panel">
          <div className="panel-heading-row">
            <h2>Combat Log</h2>
            <span className="resource-counter">Latest Reports</span>
          </div>
          {(gameState.activityLog ?? []).slice(0, 8).length > 0 ? (
            <ul className="activity-log battle-activity-log">
              {(gameState.activityLog ?? []).slice(0, 8).map((entry, index) => {
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
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="battle-metric">
      {icon ? <img alt={label} className="battle-metric-icon" src={icon} /> : null}
      <div className="battle-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Battle;
