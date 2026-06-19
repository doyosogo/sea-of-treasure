import { CANNON_IMAGES, LOGO, RESOURCE_ICONS, SCENES, SHIP_IMAGES, UI_GOLD, UI_HULL, UI_XP } from "../data/assets.js";
import { craftableUpgrades } from "../data/crafting.js";
import {
  formatNumber,
  getCurrentCannon,
  getCurrentShip,
  getCraftingBonuses,
  getCraftingCost,
  getCraftingEffect
} from "../utils/gameEngine.js";

function Shipwright({ gameState, dispatch }) {
  const shipwrightSkill = gameState.skills.shipwright;
  const craftingBonuses = getCraftingBonuses(gameState);
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);

  return (
    <section
      className="shipwright-page shipwright-scene shipwright-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.shipyard})`
      }}
    >
      <div className="shipwright-overlay" aria-hidden="true" />

      <div className="shipwright-shell">
        <header className="shipwright-topbar">
          <img alt="Sea of Treasure logo" className="shipwright-logo" src={LOGO} />
          <div className="shipwright-title-copy">
            <p className="eyebrow">Shipwright</p>
            <h1>Shipwright</h1>
            <p>Craft upgrades, strengthen your hull, and improve your ship systems.</p>
          </div>
          <div className="shipwright-top-stats">
            <StatChip icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} />
            <StatChip icon={RESOURCE_ICONS.fish} label="Fish" value={formatNumber(gameState.resources.fish)} />
            <StatChip icon={RESOURCE_ICONS.whaleOil} label="Whale Oil" value={formatNumber(gameState.resources.whaleOil)} />
          </div>
        </header>

        <section className="shipwright-grid shipwright-overview-grid">
          <article className="shipwright-panel shipwright-overview-panel">
            <h2>Shipwright Overview</h2>
            <div className="shipwright-overview-layout">
              <div className="shipwright-visual-stack">
                <FrameCard
                  caption="Current Ship"
                  image={SHIP_IMAGES[currentShip.id]}
                  title={`${currentShip.name} - Level ${currentShip.level}`}
                />
                <FrameCard
                  caption="Current Cannon"
                  image={CANNON_IMAGES[currentCannon.tier]}
                  title={`${currentCannon.name} - Tier ${currentCannon.tier}`}
                />
              </div>
              <div className="shipwright-overview-copy">
                <div className="shipwright-stat-grid">
                  <Metric icon={UI_XP} label="Shipwright Level" value={formatNumber(shipwrightSkill.level)} />
                  <Metric icon={UI_XP} label="Shipwright XP" value={formatNumber(shipwrightSkill.xp)} />
                  <Metric
                    icon={UI_HULL}
                    label="Hull Bonus"
                    value={`${formatNumber((craftingBonuses.hullMultiplier - 1) * 100)}% future durability`}
                  />
                  <Metric
                    icon={UI_GOLD}
                    label="Ships / Hour Bonus"
                    value={`${formatNumber((craftingBonuses.shipsPerHourMultiplier - 1) * 100)}%`}
                  />
                  <Metric
                    icon={UI_GOLD}
                    label="Cannonball Refund Chance"
                    value={`${formatNumber(craftingBonuses.cannonballRefundChance * 100)}%`}
                  />
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="shipwright-grid shipwright-crafting-grid">
          <article className="shipwright-panel shipwright-crafted-panel">
            <h2>Crafted Upgrades</h2>
            <div className="shipwright-card-grid">
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
                  <article className={maxed ? "shipwright-card maxed" : "shipwright-card"} key={upgrade.id}>
                    <div className="shipwright-card-header">
                      <div>
                        <p className="shipwright-kicker">Workbench Order</p>
                        <h3>{upgrade.name}</h3>
                      </div>
                      <span className="upgrade-level-badge">
                        Lv. {currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>

                    <p className="shipwright-effect">{upgrade.effect}</p>

                    <div className="shipwright-bonus-row">
                      <span>Current Bonus</span>
                      <strong>{getCraftingEffect(upgrade.id, currentLevel)}</strong>
                    </div>

                    <div className="shipwright-cost-list">
                      <CostRow icon={UI_GOLD} label="Gold" value={cost.gold} />
                      <CostRow icon={RESOURCE_ICONS.fish} label="Fish" value={cost.fish} />
                      <CostRow icon={RESOURCE_ICONS.whaleOil} label="Whale Oil" value={cost.whaleOil} />
                      <CostRow icon={UI_XP} label="Shipwright XP" value={cost.shipwrightXp} />
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
          </article>

          <article className="shipwright-panel shipwright-materials-panel">
            <h2>Required Materials</h2>
            <div className="shipwright-material-grid">
              <MaterialRow icon={RESOURCE_ICONS.fish} label="Fish" value={formatNumber(gameState.resources.fish)} />
              <MaterialRow icon={RESOURCE_ICONS.whaleOil} label="Whale Oil" value={formatNumber(gameState.resources.whaleOil)} />
              <MaterialRow icon={RESOURCE_ICONS.gunpowder} label="Gunpowder" value={formatNumber(gameState.materials.gunpowder)} />
              <MaterialRow icon={RESOURCE_ICONS.cannonParts} label="Cannon Parts" value={formatNumber(gameState.materials.cannonParts)} />
              <MaterialRow icon={RESOURCE_ICONS.navigationCharts} label="Navigation Charts" value={formatNumber(gameState.materials.navigationCharts)} />
              <MaterialRow icon={RESOURCE_ICONS.compassFragments} label="Compass Fragments" value={formatNumber(gameState.materials.compassFragments)} />
              <MaterialRow icon={RESOURCE_ICONS.ancientRelics} label="Ancient Relics" value={formatNumber(gameState.materials.ancientRelics)} />
              <MaterialRow icon={RESOURCE_ICONS.tradeContracts} label="Trade Contracts" value={formatNumber(gameState.materials.tradeContracts)} />
              <MaterialRow icon={RESOURCE_ICONS.tradeSeals} label="Trade Seals" value={formatNumber(gameState.materials.tradeSeals)} />
              <MaterialRow icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
            </div>
          </article>

          <article className="shipwright-panel shipwright-effects-panel">
            <h2>Upgrade Effects</h2>
            <div className="shipwright-effect-grid">
              <Metric icon={UI_HULL} label="Reinforced Hull" value={`${formatNumber(gameState.craftedUpgrades.reinforcedHull)} Lv. - ${getCraftingEffect("reinforcedHull", gameState.craftedUpgrades.reinforcedHull)}`} />
              <Metric icon={UI_GOLD} label="Speed Sails" value={`${formatNumber(gameState.craftedUpgrades.speedSails)} Lv. - ${getCraftingEffect("speedSails", gameState.craftedUpgrades.speedSails)}`} />
              <Metric icon={UI_GOLD} label="Cannon Braces" value={`${formatNumber(gameState.craftedUpgrades.cannonBraces)} Lv. - ${getCraftingEffect("cannonBraces", gameState.craftedUpgrades.cannonBraces)}`} />
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="shipwright-chip">
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
    <div className="shipwright-metric">
      {icon ? <img alt={label} className="shipwright-metric-icon" src={icon} /> : null}
      <div className="shipwright-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CostRow({ icon, label, value }) {
  return (
    <div className="shipwright-cost-row">
      <div className="shipwright-cost-left">
        <img alt={label} className="shipwright-cost-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function MaterialRow({ icon, label, value }) {
  return (
    <div className="shipwright-material-row">
      <div className="shipwright-cost-left">
        <img alt={label} className="shipwright-cost-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function FrameCard({ caption, image, title }) {
  return (
    <div className="shipwright-frame-card">
      <span className="shipwright-frame-caption">{caption}</span>
      <div className="shipwright-frame-image-shell">
        {image ? <img alt={title} src={image} /> : <span className="shipwright-frame-empty">No image available</span>}
      </div>
      <strong>{title}</strong>
    </div>
  );
}

export default Shipwright;
