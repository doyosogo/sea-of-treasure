import { ENEMY_IMAGES, LOGO, RESOURCE_ICONS, SCENES, SHIP_IMAGES, SKILL_ICONS, UI_DOUBLOONS, UI_ICONS } from "../data/assets.js";
import { achievements } from "../data/achievements.js";
import {
  formatNumber,
  formatDuration,
  getCurrentCannon,
  getCurrentShip,
  getIdleCombatEstimate,
  getActiveRegion,
  getActiveWorldEvent,
  getXpRequired
} from "../utils/gameEngine.js";
import { skills } from "../data/skills.js";

function Dashboard({ gameState, onNavigate }) {
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const activeRegion = getActiveRegion(gameState);
  const activeWorldEvent = getActiveWorldEvent(gameState);
  const idleEstimate = getIdleCombatEstimate(gameState);
  const xpRequired = getXpRequired(gameState.playerLevel);
  const xpProgress = xpRequired === Infinity ? 100 : (gameState.playerXP / xpRequired) * 100;
  const recentLogs = (gameState.activityLog ?? []).slice(0, 5);
  const quests = gameState.quests ?? { daily: [], weekly: [], lastDailyReset: Date.now(), lastWeeklyReset: Date.now() };
  const dailyComplete = (quests.daily ?? []).filter((quest) => (quest.progress ?? 0) >= quest.target).length;
  const weeklyComplete = (quests.weekly ?? []).filter((quest) => (quest.progress ?? 0) >= quest.target).length;
  const dailyResetRemaining = Math.max(0, (quests.lastDailyReset ?? Date.now()) + 24 * 60 * 60 * 1000 - Date.now());
  const resourceRows = [
    { label: "Gold", value: gameState.gold, icon: UI_ICONS.gold },
    { label: "Doubloons", value: gameState.doubloons, icon: UI_DOUBLOONS },
    { label: "Cannonballs", value: gameState.cannonballs, icon: UI_ICONS.cannonballs },
    { label: "Treasure Maps", value: gameState.treasureMaps, icon: UI_ICONS.treasureMaps },
    { label: "Rare Map Pieces", value: gameState.rareMapPieces, icon: RESOURCE_ICONS.rareMapPiece },
    { label: "Gunpowder", value: gameState.materials.gunpowder, icon: RESOURCE_ICONS.gunpowder },
    { label: "Cannon Parts", value: gameState.materials.cannonParts, icon: RESOURCE_ICONS.cannonParts },
    { label: "Ancient Relics", value: gameState.materials.ancientRelics, icon: RESOURCE_ICONS.ancientRelics }
  ];

  const skillCards = skills.map((skill) => {
    const skillState = gameState.skills[skill.id];
    const level = skillState?.level ?? 1;
    const nextXp = skillState ? skill.xpPerLevel[Math.min(level - 1, skill.xpPerLevel.length - 1)] ?? 0 : 0;
    const progress = nextXp > 0 ? Math.min(100, ((skillState?.xp ?? 0) / nextXp) * 100) : 100;

    return {
      ...skill,
      icon: SKILL_ICONS[skill.id],
      level,
      progress
    };
  });

  return (
    <section
      className="dashboard dashboard-cabin dashboard-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.dashboard})`
      }}
    >
      <div className="dashboard-overlay" aria-hidden="true" />
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <img alt="Sea of Treasure logo" className="dashboard-logo" src={LOGO} />
          <div className="dashboard-title-copy">
            <p className="eyebrow">Captain&apos;s Cabin</p>
            <h1>Captain&apos;s Cabin</h1>
            <p>Overview of your voyage, ship, crew and resources.</p>
          </div>
          <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
            {gameState.isIdling ? "Idling" : "Docked"}
          </div>
        </header>

        <section className="dashboard-panel dashboard-event-panel">
          <h2>World Event</h2>
          {activeWorldEvent ? (
            <div className="world-event-card">
              <div className="world-event-header">
                <div>
                  <p className="region-kicker">{activeWorldEvent.type}</p>
                  <h3>{activeWorldEvent.name}</h3>
                </div>
                <span className="resource-counter">{formatDuration(Math.max(0, (activeWorldEvent.endsAt ?? Date.now()) - Date.now()))}</span>
              </div>
              <p className="world-event-description">{activeWorldEvent.description}</p>
              <p className="world-event-effects">
                {describeWorldEventEffects(activeWorldEvent)}
              </p>
            </div>
          ) : (
            <p className="empty-log">No world event active.</p>
          )}
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-panel dashboard-captain-panel">
            <h2>Captain Overview</h2>
            <div className="dashboard-progress">
              <div className="level-row">
                <span>Level {gameState.playerLevel}</span>
                <span>
                  {formatNumber(gameState.playerXP)} / {formatNumber(xpRequired)} XP
                </span>
              </div>
              <div className="progress-track" aria-label="XP progress">
                <div className="progress-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
              </div>
            </div>
            <div className="dashboard-stat-stack">
              <Metric label="Gold" icon={UI_ICONS.gold} value={formatNumber(gameState.gold)} />
              <Metric label="Doubloons" icon={UI_DOUBLOONS} value={formatNumber(gameState.doubloons)} />
              <Metric label="Talent Points" icon={UI_ICONS.talentPoints} value={formatNumber(gameState.talentPoints)} />
              <Metric label="Ships Sunk" icon={UI_ICONS.xp} value={formatNumber(gameState.totalShipsSunk)} />
              <Metric label="Bosses Defeated" icon={UI_ICONS.gold} value={formatNumber(gameState.lifetimeStats?.totalBossesDefeated ?? 0)} />
              <Metric label="Achievements" icon={UI_ICONS.xp} value={`${formatNumber((gameState.claimedAchievements ?? []).length)} / ${formatNumber(achievements.length)}`} />
            </div>
          </article>

          <article className="dashboard-panel dashboard-voyage-panel">
            <h2>Current Voyage</h2>
            <div className="voyage-ship-art">
              <img alt={currentShip.name} className="ship-art-image" src={SHIP_IMAGES[currentShip.id]} />
            </div>
            <div className="voyage-name-row">
              <strong>{currentShip.name}</strong>
              <span>{currentShip.mapName}</span>
            </div>
            <div className="voyage-grid">
              <Metric label="Current Region" icon={UI_ICONS.gold} value={activeRegion.name} />
              <Metric label="Hull" icon={UI_ICONS.hull} value={`${formatNumber(gameState.hull.current)} / ${formatNumber(gameState.hull.max)}`} />
              <Metric label="Cannonballs" icon={UI_ICONS.cannonballs} value={formatNumber(gameState.cannonballs)} />
              <Metric label="Cannon Tier" icon={UI_ICONS.gold} value={`Tier ${currentCannon.tier}`} />
              <Metric label="Cannon Name" icon={UI_ICONS.gold} value={currentCannon.name} />
            </div>
          </article>

          <article className="dashboard-panel dashboard-combat-panel">
            <h2>Combat Summary</h2>
            <div className="combat-portrait-frame">
              <img alt={idleEstimate.enemy.name} className="combat-portrait-image" src={ENEMY_IMAGES[idleEstimate.enemy.id]} />
            </div>
            <div className="voyage-name-row">
              <strong>{idleEstimate.enemy.name}</strong>
              <span>{idleEstimate.enemy.difficulty}</span>
            </div>
            <div className="dashboard-stat-stack">
              <Metric label="Gold / Hour" icon={UI_ICONS.gold} value={formatNumber(idleEstimate.goldPerHour)} />
              <Metric label="XP / Hour" icon={UI_ICONS.xp} value={formatNumber(idleEstimate.xpPerHour)} />
            </div>
            <button className="chunky-button primary dashboard-action-button" onClick={() => onNavigate?.("battle")} type="button">
              Open Battle
            </button>
          </article>
        </section>

        <section className="dashboard-secondary-grid">
          <article className="dashboard-panel dashboard-skills-panel">
            <h2>Skills Summary</h2>
            <div className="skills-icon-grid">
              {skillCards.map((skill) => (
                <div className="skill-summary-card" key={skill.id}>
                  <div className="skill-summary-top">
                    <img alt={skill.name} className="skill-summary-icon" src={skill.icon} />
                    <div>
                      <strong>{skill.name}</strong>
                      <span>Level {skill.level}</span>
                    </div>
                  </div>
                  <div className="progress-track skill-progress-track" aria-label={`${skill.name} XP progress`}>
                    <div className="progress-fill" style={{ width: `${skill.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-resources-panel">
            <h2>Resources Summary</h2>
            <div className="resource-summary-list">
              {resourceRows.map((resource) => (
                <div className="resource-summary-row" key={resource.label}>
                  <div className="resource-summary-left">
                    <img alt={resource.label} className="resource-summary-icon" src={resource.icon} />
                    <span>{resource.label}</span>
                  </div>
                  <strong>{formatNumber(resource.value)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-feed-panel">
            <h2>Activity Feed</h2>
            {recentLogs.length > 0 ? (
              <ul className="dashboard-log-list">
                {recentLogs.map((entry, index) => {
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
              <p className="empty-log">No voyage notes yet.</p>
            )}
          </article>

          <article className="dashboard-panel dashboard-quests-panel">
            <h2>Quest Summary</h2>
            <div className="dashboard-stat-stack">
              <Metric label="Daily Quests" icon={UI_ICONS.xp} value={`${formatNumber(dailyComplete)} / ${formatNumber((quests.daily ?? []).length)}`} />
              <Metric label="Weekly Quests" icon={UI_ICONS.xp} value={`${formatNumber(weeklyComplete)} / ${formatNumber((quests.weekly ?? []).length)}`} />
              <Metric label="Daily Reset" icon={UI_ICONS.xp} value={formatDuration(dailyResetRemaining)} />
            </div>
            <button className="chunky-button primary dashboard-action-button" onClick={() => onNavigate?.("quests")} type="button">
              Open Quests
            </button>
          </article>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="dashboard-metric">
      {icon ? <img alt={label} className="dashboard-metric-icon" src={icon} /> : null}
      <div className="dashboard-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function describeWorldEventEffects(event) {
  const effects = [];

  if ((event.effects?.tradeSellValueMultiplier ?? 1) > 1) {
    effects.push(`Trade sell value +${Math.round((event.effects.tradeSellValueMultiplier - 1) * 100)}%`);
  }

  if ((event.effects?.combatGoldMultiplier ?? 1) > 1) {
    effects.push(`Combat gold +${Math.round((event.effects.combatGoldMultiplier - 1) * 100)}%`);
  }

  if ((event.effects?.treasureMapDropMultiplier ?? 1) > 1) {
    effects.push(`Treasure maps +${Math.round((event.effects.treasureMapDropMultiplier - 1) * 100)}%`);
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

export default Dashboard;
