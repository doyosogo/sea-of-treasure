import { achievements } from "../data/achievements.js";
import {
  formatNumber,
  getAchievementProgress,
  getClaimableAchievements,
  isAchievementUnlocked
} from "../utils/gameEngine.js";

const categories = ["Combat", "Progression", "Fleet", "Economy", "Skills", "Treasure", "Crafting"];

function Achievements({ gameState, dispatch }) {
  const claimedAchievements = gameState.claimedAchievements ?? [];
  const claimableAchievements = getClaimableAchievements(gameState);

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
    <section className="achievements-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Long-Term Goals</p>
          <h1>Achievements</h1>
        </div>
        <div className="resource-cluster">
          <span className="resource-counter">
            {formatNumber(claimedAchievements.length)} / {formatNumber(achievements.length)} Claimed
          </span>
          <span className="resource-counter">
            {formatNumber(claimableAchievements.length)} Claimable
          </span>
        </div>
      </div>

      <article className="pixel-panel achievement-overview">
        <h2>Milestones</h2>
        <div className="summary-stat-grid">
          <div className="stat-box">
            <span>Total Gold Earned</span>
            <strong>{formatNumber(gameState.lifetimeStats?.totalGoldEarned ?? 0)}</strong>
          </div>
          <div className="stat-box">
            <span>Lifetime Ships Sunk</span>
            <strong>{formatNumber(gameState.lifetimeStats?.totalShipsSunk ?? gameState.totalShipsSunk)}</strong>
          </div>
          <div className="stat-box">
            <span>Treasure Digs</span>
            <strong>{formatNumber(gameState.lifetimeStats?.treasureDigsCompleted ?? 0)}</strong>
          </div>
          <div className="stat-box">
            <span>Rare Treasures</span>
            <strong>{formatNumber(gameState.lifetimeStats?.rareTreasuresFound ?? 0)}</strong>
          </div>
          <div className="stat-box">
            <span>Upgrades Crafted</span>
            <strong>{formatNumber(gameState.lifetimeStats?.upgradesCrafted ?? 0)}</strong>
          </div>
        </div>
      </article>

      {categories.map((category) => (
        <section className="achievement-category pixel-panel" key={category}>
          <h2>{category}</h2>
          <div className="achievement-grid">
            {achievements
              .filter((achievement) => achievement.category === category)
              .map((achievement) => {
                const progress = getAchievementProgress(achievement, gameState);
                const status = getStatus(achievement);
                const claimable = status === "Claimable";

                return (
                  <article
                    className={`achievement-card ${status.toLowerCase()}`}
                    key={achievement.id}
                  >
                    <div className="achievement-card-header">
                      <h3>{achievement.name}</h3>
                      <span className={`achievement-status ${status.toLowerCase()}`}>
                        {status}
                      </span>
                    </div>
                    <p>{achievement.description}</p>
                    <div className="level-row">
                      <span>Progress</span>
                      <span>{formatNumber(progress.current)} / {formatNumber(progress.target)}</span>
                    </div>
                    <div className="progress-track" aria-label={`${achievement.name} progress`}>
                      <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                    </div>
                    <div className="reward-row">
                      <span className="reward-badge">{formatNumber(achievement.rewardGold)} Gold</span>
                      <span className="reward-badge">
                        {formatNumber(achievement.rewardTalentPoints)} Talent
                      </span>
                    </div>
                    <button
                      className="chunky-button primary"
                      disabled={!claimable}
                      onClick={() => dispatch({ type: "CLAIM_ACHIEVEMENT", achievementId: achievement.id })}
                      type="button"
                    >
                      {status === "Claimed" ? "Claimed" : "Claim Reward"}
                    </button>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </section>
  );
}

export default Achievements;
