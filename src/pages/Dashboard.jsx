import { ENEMY_IMAGES, LOGO, RESOURCE_ICONS, SCENES, SHIP_IMAGES, SKILL_ICONS, UI_DOUBLOONS, UI_ICONS } from "../data/assets.js";
import { achievements } from "../data/achievements.js";
import { crewMembers } from "../data/crew.js";
import Tooltip from "../components/Tooltip.jsx";
import {
  formatNumber,
  formatDuration,
  getCurrentCannon,
  getCurrentShip,
  getCrewBonuses,
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
  const crewEntries = Object.entries(gameState.crew ?? {});
  const crewAverageLevel = crewEntries.length > 0
    ? crewEntries.reduce((total, [, crewMember]) => total + (crewMember.level ?? 1), 0) / crewEntries.length
    : 1;
  const highestCrewEntry = crewEntries.reduce((best, entry) => {
    if (!best || (entry[1]?.level ?? 1) > (best[1]?.level ?? 1)) {
      return entry;
    }

    return best;
  }, null);
  const crewBonuses = getCrewBonuses(gameState);
  const highestCrewMember = highestCrewEntry
    ? crewMembers.find((member) => member.id === highestCrewEntry[0]) ?? null
    : null;
  const resourceRows = [
    { label: "Gold", value: gameState.gold, icon: UI_ICONS.gold, tooltip: "Gold is earned from combat, trading, quests, and events. Spend it on ships, cannons, repairs, and upgrades." },
    { label: "Doubloons", value: gameState.doubloons, icon: UI_DOUBLOONS, tooltip: "Doubloons are rare account currency earned from bosses, treasure, quests, and achievements." },
    { label: "Cannonballs", value: gameState.cannonballs, icon: UI_ICONS.cannonballs, tooltip: "Cannonballs are spent when firing volleys in combat. Buy or restock them in the Shop." },
    { label: "Treasure Maps", value: gameState.treasureMaps, icon: UI_ICONS.treasureMaps, tooltip: "Treasure maps are recovered from defeated ships and used to start treasure digs." },
    { label: "Rare Map Pieces", value: gameState.rareMapPieces, icon: RESOURCE_ICONS.rareMapPiece, tooltip: "Rare Map Pieces are very uncommon loot used for later upgrades and progression." },
    { label: "Gunpowder", value: gameState.materials.gunpowder, icon: RESOURCE_ICONS.gunpowder, tooltip: "Gunpowder is produced by Gunnery and used for cannon upgrades, crew, and future crafting." },
    { label: "Cannon Parts", value: gameState.materials.cannonParts, icon: RESOURCE_ICONS.cannonParts, tooltip: "Cannon Parts are produced by Gunnery and used for cannons, crew, and upgrades." },
    { label: "Ancient Relics", value: gameState.materials.ancientRelics, icon: RESOURCE_ICONS.ancientRelics, tooltip: "Ancient Relics come from treasure digs and are used for upgrades and crew training." }
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
            <p className="empty-log">No world event is active right now. The seas are calm until the next event stirs.</p>
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
              <Metric label="Gold" icon={UI_ICONS.gold} value={formatNumber(gameState.gold)} tooltip="Gold is earned from combat, trading, quests, and events. Spend it on ships, cannons, repairs, and upgrades." />
              <Metric label="Doubloons" icon={UI_DOUBLOONS} value={formatNumber(gameState.doubloons)} tooltip="Doubloons are rare account currency earned from bosses, treasure, quests, and achievements." />
              <Metric label="Talent Points" icon={UI_ICONS.talentPoints} value={formatNumber(gameState.talentPoints)} tooltip="Talent Points are spent on permanent talent tree upgrades." />
              <Metric label="Ships Sunk" icon={UI_ICONS.xp} value={formatNumber(gameState.totalShipsSunk)} tooltip="Ships sunk track your combat victories across active, idle, and offline play." />
              <Metric label="Bosses Defeated" icon={UI_ICONS.gold} value={formatNumber(gameState.lifetimeStats?.totalBossesDefeated ?? 0)} tooltip="Bosses are regional milestone fights with large rewards." />
              <Metric label="Achievements" icon={UI_ICONS.xp} value={`${formatNumber((gameState.claimedAchievements ?? []).length)} / ${formatNumber(achievements.length)}`} tooltip="Achievements reward milestones with gold, talent points, and sometimes Doubloons." />
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
              <Metric label="Current Region" icon={UI_ICONS.gold} value={activeRegion.name} tooltip="Your active region changes enemy difficulty and rewards." />
              <Metric label="Hull" icon={UI_ICONS.hull} value={`${formatNumber(gameState.hull.current)} / ${formatNumber(gameState.hull.max)}`} tooltip="Hull is your ship health. If it reaches zero, combat ends." />
              <Metric label="Cannonballs" icon={UI_ICONS.cannonballs} value={formatNumber(gameState.cannonballs)} tooltip="Cannonballs are consumed when firing volleys in combat." />
              <Metric label="Cannon Tier" icon={UI_ICONS.gold} value={`Tier ${currentCannon.tier}`} tooltip="Cannon tier controls your cannon quality and damage multiplier." />
              <Metric label="Cannon Name" icon={UI_ICONS.gold} value={currentCannon.name} tooltip="This is the currently equipped cannon quality." />
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
              <Metric label="Gold / Hour" icon={UI_ICONS.gold} value={formatNumber(idleEstimate.goldPerHour)} tooltip="Estimated gold gained per hour from idling against the selected enemy." />
              <Metric label="XP / Hour" icon={UI_ICONS.xp} value={formatNumber(idleEstimate.xpPerHour)} tooltip="Estimated XP gained per hour from idling against the selected enemy." />
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
                    <Tooltip label={resource.label} text={resource.tooltip}>
                      <span>{resource.label}</span>
                    </Tooltip>
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
              <Metric label="Daily Quests" icon={UI_ICONS.xp} value={`${formatNumber(dailyComplete)} / ${formatNumber((quests.daily ?? []).length)}`} tooltip="Daily quests reset every 24 hours and award small rewards." />
              <Metric label="Weekly Quests" icon={UI_ICONS.xp} value={`${formatNumber(weeklyComplete)} / ${formatNumber((quests.weekly ?? []).length)}`} tooltip="Weekly quests reset every 7 days and award larger rewards." />
              <Metric label="Daily Reset" icon={UI_ICONS.xp} value={formatDuration(dailyResetRemaining)} tooltip="Time remaining before daily quests refresh." />
            </div>
            <button className="chunky-button primary dashboard-action-button" onClick={() => onNavigate?.("quests")} type="button">
              Open Quests
            </button>
          </article>

          <article className="dashboard-panel dashboard-crew-panel">
            <h2>Crew Summary</h2>
            <div className="dashboard-stat-stack">
              <Metric label="Average Crew Level" icon={UI_ICONS.xp} value={crewAverageLevel.toFixed(1)} tooltip="Crew members gain levels from crew upgrades and provide passive account bonuses." />
              <Metric label="Highest Crew Member" icon={UI_ICONS.xp} value={highestCrewEntry ? `${highestCrewMember?.name ?? highestCrewEntry[0]} Lv. ${highestCrewEntry[1].level}` : "None"} tooltip="Your highest-trained officer." />
              <Metric label="Combat Gold Bonus" icon={UI_ICONS.gold} value={`${formatNumber((crewBonuses.combatGoldMultiplier - 1) * 100)}%`} tooltip="Quartermaster levels increase combat gold gains." />
            </div>
            <button className="chunky-button primary dashboard-action-button" onClick={() => onNavigate?.("crew")} type="button">
              Open Crew
            </button>
          </article>

          <article className="dashboard-panel dashboard-tips-panel">
            <h2>New Player Tips</h2>
            <ul className="dashboard-tip-list">
              <li>Fight enemies on Battle page.</li>
              <li>Buy better ships and cannons in Shop.</li>
              <li>Train skills to gather materials.</li>
              <li>Complete quests for Doubloons.</li>
            </ul>
          </article>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, tooltip }) {
  const content = (
    <div className="dashboard-metric">
      {icon ? <img alt={label} className="dashboard-metric-icon" src={icon} /> : null}
      <div className="dashboard-metric-copy">
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
