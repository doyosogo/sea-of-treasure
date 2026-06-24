import {
  ENEMY_IMAGES,
  LOGO,
  SCENES,
  UI_ICONS
} from "../data/assets.js";
import Tooltip from "../components/Tooltip.jsx";
import { regions } from "../data/regions.js";
import {
  formatNumber,
  generateBoss,
  generateEnemy,
  getCurrentCannon,
  getEffectiveBallsPerBattle,
  getIdleCombatEstimate,
  getRepairCostPerMissingHull,
  getPlayerCombatStats,
  getActiveWorldEvent
} from "../utils/gameEngine.js";
import { enemies } from "../data/enemies.js";
import { bosses } from "../data/bosses.js";

function Battle({ gameState, dispatch }) {
  const currentCannon = getCurrentCannon(gameState);
  const combatStats = getPlayerCombatStats(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const currentBattle = gameState.currentBattle;
  const battleEnemy = currentBattle?.enemy ?? null;
  const selectedEnemyType = enemies.find((enemy) => enemy.id === gameState.selectedEnemyId) ?? enemies[1] ?? enemies[0];
  const lastBattleEnemy = gameState.lastBattleEnemyId
    ? enemies.find((enemy) => enemy.id === gameState.lastBattleEnemyId) ??
      bosses.find((boss) => boss.id === gameState.lastBattleEnemyId) ??
      null
    : null;
  const activeRegion = regions.find((region) => region.id === gameState.activeRegionId) ?? regions[0];
  const activeWorldEvent = getActiveWorldEvent(gameState);
  const activeEnemy = battleEnemy ?? selectedEnemyType ?? lastBattleEnemy;
  const hullProgress = combatStats.maxHull > 0 ? (combatStats.currentHull / combatStats.maxHull) * 100 : 0;
  const enemyHpProgress = battleEnemy ? (battleEnemy.currentHP / battleEnemy.maxHP) * 100 : 0;
  const missingHull = Math.max(0, combatStats.maxHull - combatStats.currentHull);
  const repairCost = Math.floor(missingHull * getRepairCostPerMissingHull(gameState));
  const mainActionDisabled = battleEnemy ? gameState.cannonballs < getEffectiveBallsPerBattle(gameState) : !lastBattleEnemy;
  const mainActionLabel = battleEnemy ? "Fire Volley" : lastBattleEnemy ? "Battle Again" : "Choose an enemy below";

  function handleMainCombatAction() {
    if (battleEnemy) {
      dispatch({ type: "FIRE_VOLLEY" });
      return;
    }

    if (lastBattleEnemy) {
      dispatch(
        lastBattleEnemy.regionId
          ? { type: "START_BOSS_BATTLE", bossId: lastBattleEnemy.id }
          : { type: "START_BATTLE", enemyId: lastBattleEnemy.id }
      );
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

  function getBossBattleDisabled(locked) {
    return locked || gameState.isIdling || Boolean(currentBattle) || combatStats.currentHull <= 0;
  }

  function getBossBattleLabel(boss, locked, region) {
    if (locked) {
      return region ? `Unlocks ${region.name} Lv. ${region.requiredLevel}` : "Locked";
    }

    if (gameState.isIdling) {
      return "Stop idling first";
    }

    if (currentBattle) {
      return "Finish current battle";
    }

    return "Battle Boss";
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

        {activeWorldEvent && (activeWorldEvent.type === "combat" || activeWorldEvent.type === "idle" || activeWorldEvent.type === "high-risk") ? (
          <article className="battle-panel battle-event-banner">
            <div className="panel-heading-row">
              <h2>World Event</h2>
              <span className="resource-counter">{activeWorldEvent.name}</span>
            </div>
            <p className="region-description">{activeWorldEvent.description}</p>
            <p className="battle-event-effects">{describeWorldEventEffects(activeWorldEvent)}</p>
          </article>
        ) : null}

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
                src={activeEnemy ? (ENEMY_IMAGES[activeEnemy.id] ?? ENEMY_IMAGES.cursedWarship ?? ENEMY_IMAGES.smugglerCutter) : ENEMY_IMAGES.smugglerCutter}
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
                      : "Choose an enemy below to begin battle"}
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
                <Metric icon={UI_ICONS.cannonballs} label="Cannonballs" value={formatNumber(gameState.cannonballs)} tooltip="Cannonballs are spent every volley. Keep a reserve for longer fights." />
                <Metric icon={UI_ICONS.gold} label="Volley Damage" value={formatNumber(combatStats.volleyDamage)} tooltip="Volley damage is the total damage of one firing cycle before crits." />
                <Metric icon={UI_ICONS.xp} label="Shots Fired" value={battleEnemy ? formatNumber(currentBattle.shotsFired) : "0"} tooltip="Shots fired counts the number of volleys launched in the current battle." />
                <Metric icon={UI_ICONS.hull} label="Repair Cost" value={formatNumber(repairCost)} tooltip="Repair cost is based on missing hull. Carpenter crew members can reduce it." />
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

        <article className="battle-panel battle-region-panel">
          <div className="panel-heading-row">
            <h2>Region Selection</h2>
            <span className="resource-counter">{activeRegion.name}</span>
          </div>
          <div className="region-card-grid">
            {regions.map((region) => {
              const unlocked = gameState.playerLevel >= region.requiredLevel;
              const selected = gameState.activeRegionId === region.id;

              return (
                <article className={`region-card ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}`} key={region.id}>
                  <div className="region-card-header">
                    <div>
                      <p className="region-kicker">Level {region.requiredLevel}</p>
                      <h3>{region.name}</h3>
                    </div>
                    <span className="region-status">{unlocked ? (selected ? "Active" : "Unlocked") : "Locked"}</span>
                  </div>
                  <p className="region-description">{region.description}</p>
                  <div className="region-stat-grid">
                    <Metric icon={UI_ICONS.gold} label="Gold" value={`${formatNumber((region.goldMultiplier - 1) * 100)}%`} tooltip="Region gold multiplier increases combat and boss gold rewards." />
                    <Metric icon={UI_ICONS.xp} label="XP" value={`${formatNumber((region.xpMultiplier - 1) * 100)}%`} tooltip="Region XP multiplier increases combat and boss XP rewards." />
                    <Metric icon={UI_ICONS.hull} label="Difficulty" value={`${formatNumber(region.backgroundDifficultyModifier * 100)}%`} tooltip="Region difficulty makes enemies tougher and stronger." />
                    <Metric icon={UI_ICONS.cannonballs} label="Ship Req." value={region.recommendedShipLevel} tooltip="Recommended ship level for this region." />
                  </div>
                  <button
                    className="chunky-button primary region-select-button"
                    disabled={!unlocked || selected}
                    onClick={() => dispatch({ type: "SELECT_REGION", regionId: region.id })}
                    type="button"
                  >
                    {selected ? "Current Region" : unlocked ? "Enter Region" : `Unlocks Lv. ${region.requiredLevel}`}
                  </button>
                </article>
              );
            })}
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
                    <Tooltip label="Enemy Difficulty" text="Enemy difficulty reflects the challenge level and usually means more HP and damage.">
                      <span className="enemy-difficulty">{enemy.difficulty}</span>
                    </Tooltip>
                  </div>
                  <div className="battle-enemy-grid-stats">
                      <Metric label="HP" value={formatNumber(estimate.maxHP)} icon={UI_ICONS.hull} tooltip="Estimated enemy hull before combat begins." />
                      <Metric label="Damage" value={formatNumber(estimate.damage)} icon={UI_ICONS.hull} tooltip="Estimated damage dealt back to your hull on a hit." />
                      <Metric label="Gold Reward" value={formatNumber(estimate.goldReward)} icon={UI_ICONS.gold} tooltip="Gold earned when you defeat this enemy." />
                      <Metric label="XP Reward" value={formatNumber(estimate.xpReward)} icon={UI_ICONS.xp} tooltip="XP earned when you defeat this enemy." />
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

          <article className="battle-panel battle-boss-panel">
            <div className="panel-heading-row">
              <h2>Bosses</h2>
              <span className="resource-counter">Regional Challenges</span>
            </div>
            <div className="enemy-card-grid battle-boss-grid">
              {bosses.map((boss) => {
                const region = regions.find((regionData) => regionData.id === boss.regionId);
                const unlocked = gameState.playerLevel >= (region?.requiredLevel ?? 1);
                const selected = currentBattle?.enemy?.id === boss.id || (!currentBattle && gameState.lastBattleEnemyId === boss.id && Boolean(lastBattleEnemy));
                const estimate = generateBoss(gameState, boss);
                const combatRewardMultiplier = activeWorldEvent?.id === "pirateInvasion" ? 1.25 : 1;
                const bossRewardMultiplier = activeWorldEvent?.id === "cursedFog" ? 1.5 : 1;
                const displayedRewardMultiplier = combatRewardMultiplier * bossRewardMultiplier;
                const disabled = getBossBattleDisabled(!unlocked);

                return (
                  <div className={`battle-enemy-card battle-boss-card ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}`} key={boss.id}>
                    <div className="battle-enemy-card-copy">
                      <div className="enemy-card-header battle-enemy-header">
                        <div>
                          <p className="region-kicker">{region?.name ?? "Unknown Region"}</p>
                          <h3>{boss.name}</h3>
                        </div>
                      <Tooltip label="Enemy Difficulty" text="Bosses are regional milestone fights with much larger health and rewards.">
                        <span className="enemy-difficulty">Boss</span>
                      </Tooltip>
                      </div>
                      <p className="region-description">{boss.description}</p>
                      <div className="battle-enemy-grid-stats">
                        <Metric label="HP" value={formatNumber(estimate.maxHP)} icon={UI_ICONS.hull} tooltip="Estimated boss hull before combat begins." />
                        <Metric label="Damage" value={formatNumber(estimate.damage)} icon={UI_ICONS.hull} tooltip="Estimated boss damage per hit." />
                        <Metric label="Gold Reward" value={formatNumber(estimate.goldReward * displayedRewardMultiplier)} icon={UI_ICONS.gold} tooltip="Boss gold reward scales with region and world events." />
                        <Metric label="XP Reward" value={formatNumber(estimate.xpReward * bossRewardMultiplier)} icon={UI_ICONS.xp} tooltip="Boss XP reward scales with region and world events." />
                      </div>
                      <button
                        className="chunky-button primary battle-card-button"
                        disabled={disabled}
                        onClick={() => dispatch({ type: "START_BOSS_BATTLE", bossId: boss.id })}
                        type="button"
                      >
                        {getBossBattleLabel(boss, !unlocked, region)}
                      </button>
                    </div>
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
              <Metric icon={UI_ICONS.xp} label="Kills / Hour" value={formatNumber(idleEstimate.enemiesPerHour)} tooltip="Estimated enemy defeats per hour while idling." />
              <Metric icon={UI_ICONS.gold} label="Gold / Hour" value={formatNumber(idleEstimate.goldPerHour)} tooltip="Estimated gold earned per hour while idling." />
              <Metric icon={UI_ICONS.xp} label="XP / Hour" value={formatNumber(idleEstimate.xpPerHour)} tooltip="Estimated XP earned per hour while idling." />
              <Metric icon={UI_ICONS.cannonballs} label="Cannonballs / Hour" value={formatNumber(idleEstimate.cannonballsPerHour)} tooltip="Estimated cannonballs spent per hour while idling." />
              <Metric icon={UI_ICONS.hull} label="Hull Damage / Hour" value={formatNumber(idleEstimate.hullDamagePerHour)} tooltip="Estimated hull damage taken per hour while idling." />
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

function Metric({ icon, label, value, tooltip }) {
  const content = (
    <div className="battle-metric">
      {icon ? <img alt={label} className="battle-metric-icon" src={icon} /> : null}
      <div className="battle-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );

  return tooltip ? (
    <Tooltip label={label} text={tooltip}>
      {content}
    </Tooltip>
  ) : content;
}

function describeWorldEventEffects(event) {
  const effects = [];

  if ((event.effects?.combatGoldMultiplier ?? 1) > 1) {
    effects.push(`Combat gold +${Math.round((event.effects.combatGoldMultiplier - 1) * 100)}%`);
  }

  if ((event.effects?.hullDamageTakenMultiplier ?? 1) < 1) {
    effects.push(`Hull damage -${Math.round((1 - event.effects.hullDamageTakenMultiplier) * 100)}%`);
  }

  if ((event.effects?.bossRewardMultiplier ?? 1) > 1) {
    effects.push(`Boss rewards +${Math.round((event.effects.bossRewardMultiplier - 1) * 100)}%`);
  }

  if ((event.effects?.bossDamageMultiplier ?? 1) > 1) {
    effects.push(`Boss damage +${Math.round((event.effects.bossDamageMultiplier - 1) * 100)}%`);
  }

  return effects.length > 0 ? effects.join(" • ") : "Temporary world modifiers are active.";
}

export default Battle;
