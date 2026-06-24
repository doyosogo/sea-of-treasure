import { LOGO, SCENES, UI_DOUBLOONS, UI_GOLD, UI_TALENT_POINTS, UI_XP } from "../data/assets.js";
import { achievements } from "../data/achievements.js";
import {
  formatNumber,
  getAchievementProgress,
  getClaimableAchievements,
  isAchievementUnlocked
} from "../utils/gameEngine.js";

const categories = ["Combat", "World", "Progression", "Fleet", "Economy", "Skills", "Treasure", "Crafting"];

function Achievements({ gameState, dispatch }) {
  const claimedAchievements = gameState.claimedAchievements ?? [];
  const claimableAchievements = getClaimableAchievements(gameState);
  const totalShipsSunk = gameState.lifetimeStats?.totalShipsSunk ?? gameState.totalShipsSunk ?? 0;
  const totalGoldEarned = gameState.lifetimeStats?.totalGoldEarned ?? 0;

  function getStatus(achievement) {
    if (claimedAchievements.includes(achievement.id)) {
      return "Claimed";
    }

    if (isAchievementUnlocked(achievement, gameState)) {
      return "Claimable";
    }

    return "Locked";
  }

  return (
    <section
      className="achievements-page legends-scene legends-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.achievements})`
      }}
    >
      <div className="legends-overlay" aria-hidden="true" />

      <div className="legends-shell">
        <header className="legends-topbar">
          <img alt="Sea of Treasure logo" className="legends-logo" src={LOGO} />
          <div className="legends-title-copy">
            <p className="eyebrow">Hall of Legends</p>
            <h1>Hall of Legends</h1>
            <p>Claim milestones, honour your victories, and track your legacy.</p>
          </div>
          <div className="legends-top-stats">
            <StatChip icon={UI_GOLD} label="Claimed / Total" value={`${formatNumber(claimedAchievements.length)} / ${formatNumber(achievements.length)}`} />
            <StatChip icon={UI_TALENT_POINTS} label="Claimable" value={formatNumber(claimableAchievements.length)} />
          </div>
        </header>

        <section className="legends-grid legends-overview-grid">
          <article className="legends-panel">
            <h2>Legend Overview</h2>
            <div className="legends-stat-grid">
              <Metric icon={UI_GOLD} label="Claimed / Total" value={`${formatNumber(claimedAchievements.length)} / ${formatNumber(achievements.length)}`} />
              <Metric icon={UI_TALENT_POINTS} label="Claimable Count" value={formatNumber(claimableAchievements.length)} />
              <Metric icon={UI_XP} label="Total Ships Sunk" value={formatNumber(totalShipsSunk)} />
              <Metric icon={UI_GOLD} label="Total Gold Earned" value={formatNumber(totalGoldEarned)} />
            </div>
          </article>

          <article className="legends-panel">
            <h2>Legacy Progress</h2>
            <div className="legends-stat-grid">
              <Metric icon={UI_XP} label="Treasure Digs" value={formatNumber(gameState.lifetimeStats?.treasureDigsCompleted ?? 0)} />
              <Metric icon={UI_GOLD} label="Rare Treasures Found" value={formatNumber(gameState.lifetimeStats?.rareTreasuresFound ?? 0)} />
              <Metric icon={UI_TALENT_POINTS} label="Upgrades Crafted" value={formatNumber(gameState.lifetimeStats?.upgradesCrafted ?? 0)} />
            </div>
          </article>
        </section>

        <section className="legends-grid legends-claimable-grid">
          <article className="legends-panel">
            <h2>Claimable Achievements</h2>
            {claimableAchievements.length > 0 ? (
              <div className="legend-card-grid">
                {claimableAchievements.map((achievement) => (
                  <AchievementCard
                    achievement={achievement}
                    gameState={gameState}
                    status="Claimable"
                    dispatch={dispatch}
                    key={achievement.id}
                  />
                ))}
              </div>
            ) : (
              <div className="legend-empty-state">
                <strong>No claimable achievements right now.</strong>
                <p>Keep sailing to unlock your next honours.</p>
              </div>
            )}
          </article>
        </section>

        <section className="legends-grid legends-categories-grid">
          <article className="legends-panel">
            <h2>Achievement Categories</h2>
            <div className="legend-category-stack">
              {categories.map((category) => (
                <div className="legend-category-block" key={category}>
                  <h3>{category}</h3>
                  <div className="legend-card-grid">
                    {achievements
                      .filter((achievement) => achievement.category === category)
                      .map((achievement) => {
                        const status = getStatus(achievement);
                        return (
                          <AchievementCard
                            achievement={achievement}
                            gameState={gameState}
                            status={status}
                            dispatch={dispatch}
                            key={achievement.id}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

function AchievementCard({ achievement, gameState, status, dispatch }) {
  const progress = getAchievementProgress(achievement, gameState);
  const claimable = status === "Claimable";
  const claimed = status === "Claimed";

  return (
    <article className={`legend-card ${status.toLowerCase()}`}>
      <div className="legend-card-header">
        <div>
          <p className="legend-kicker">{achievement.category}</p>
          <h3>{achievement.name}</h3>
        </div>
        <span className={`legend-status ${status.toLowerCase()}`}>{status}</span>
      </div>

      <p className="legend-description">{achievement.description}</p>

      <div className="legend-progress-row">
        <span>Progress</span>
        <strong>
          {formatNumber(progress.current)} / {formatNumber(progress.target)}
        </strong>
      </div>
      <div className="progress-track legend-progress-track" aria-label={`${achievement.name} progress`}>
        <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
      </div>

      <div className="legend-reward-grid">
        <RewardRow icon={UI_GOLD} label="Gold" value={achievement.rewardGold} />
        <RewardRow icon={UI_TALENT_POINTS} label="Talent Points" value={achievement.rewardTalentPoints} />
        {(achievement.rewardDoubloons ?? 0) > 0 && (
          <RewardRow icon={UI_DOUBLOONS} label="Doubloons" value={achievement.rewardDoubloons} />
        )}
      </div>

      <button
        className="chunky-button primary"
        disabled={!claimable}
        onClick={() => dispatch({ type: "CLAIM_ACHIEVEMENT", achievementId: achievement.id })}
        type="button"
      >
        {claimed ? "Claimed" : "Claim Reward"}
      </button>
    </article>
  );
}

function RewardRow({ icon, label, value }) {
  return (
    <div className="legend-reward-row">
      <div className="legend-reward-left">
        <img alt={label} className="legend-reward-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="legend-chip">
      <img alt={label} src={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="legend-metric">
      {icon ? <img alt={label} className="legend-metric-icon" src={icon} /> : null}
      <div className="legend-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Achievements;
