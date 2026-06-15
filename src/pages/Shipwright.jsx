import { craftableUpgrades } from "../data/crafting.js";
import {
  formatNumber,
  getCraftingBonuses,
  getCraftingCost,
  getCraftingEffect
} from "../utils/gameEngine.js";

function Shipwright({ gameState, dispatch }) {
  const shipwrightSkill = gameState.skills.shipwright;
  const craftingBonuses = getCraftingBonuses(gameState);

  return (
    <section className="shipwright-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Crafting Yard</p>
          <h1>Shipwright</h1>
        </div>
        <div className="resource-cluster">
          <span className="resource-counter">{formatNumber(gameState.gold)} Gold</span>
          <span className="resource-counter">{formatNumber(gameState.resources.fish)} Fish</span>
          <span className="resource-counter">{formatNumber(gameState.resources.whaleOil)} Whale Oil</span>
        </div>
      </div>

      <article className="pixel-panel market-overview">
        <h2>Shipwright Skill</h2>
        <div className="summary-stat-grid">
          <div className="stat-box">
            <span>Level</span>
            <strong>{shipwrightSkill.level}</strong>
          </div>
          <div className="stat-box">
            <span>XP</span>
            <strong>{formatNumber(shipwrightSkill.xp)}</strong>
          </div>
          <div className="stat-box">
            <span>Hull Bonus</span>
            <strong>{formatNumber((craftingBonuses.hullMultiplier - 1) * 100)}%</strong>
          </div>
          <div className="stat-box">
            <span>Ships / Hour Bonus</span>
            <strong>{formatNumber((craftingBonuses.shipsPerHourMultiplier - 1) * 100)}%</strong>
          </div>
          <div className="stat-box">
            <span>Cannonball Reduction</span>
            <strong>{formatNumber((1 - craftingBonuses.cannonballUseMultiplier) * 100)}%</strong>
          </div>
        </div>
      </article>

      <div className="crafting-grid">
        {craftableUpgrades.map((upgrade) => {
          const currentLevel = gameState.craftedUpgrades[upgrade.id] ?? 0;
          const maxed = currentLevel >= upgrade.maxLevel;
          const cost = getCraftingCost(upgrade, currentLevel);
          const canCraft =
            !maxed &&
            gameState.gold >= cost.gold &&
            gameState.resources.fish >= cost.fish &&
            gameState.resources.whaleOil >= cost.whaleOil;

          return (
            <article className={maxed ? "pixel-panel crafting-card maxed" : "pixel-panel crafting-card"} key={upgrade.id}>
              <div className="market-card-header">
                <h2>{upgrade.name}</h2>
                <span className="upgrade-level-badge">
                  Lv. {currentLevel} / {upgrade.maxLevel}
                </span>
              </div>
              <p className="skill-description">{upgrade.effect}</p>
              <div className="resource-row">
                <span>Current Bonus</span>
                <strong>{getCraftingEffect(upgrade.id, currentLevel)}</strong>
              </div>
              <div className="crafting-cost-list">
                <div><span>Gold</span><strong>{formatNumber(cost.gold)}</strong></div>
                <div><span>Fish</span><strong>{formatNumber(cost.fish)}</strong></div>
                <div><span>Whale Oil</span><strong>{formatNumber(cost.whaleOil)}</strong></div>
                <div><span>Shipwright XP</span><strong>{formatNumber(cost.shipwrightXp)}</strong></div>
              </div>
              <button
                className="chunky-button primary"
                disabled={!canCraft}
                onClick={() => dispatch({ type: "CRAFT_UPGRADE", upgradeId: upgrade.id })}
                type="button"
              >
                {maxed ? "Maxed" : "Craft Upgrade"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Shipwright;
