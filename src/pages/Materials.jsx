import { LOGO, RESOURCE_ICONS, SCENES, UI_GOLD, UI_XP } from "../data/assets.js";
import { formatNumber, getCannonMaterialUpgradeCost, getNextCannon } from "../utils/gameEngine.js";

function Materials({ gameState }) {
  const nextCannon = getNextCannon(gameState);
  const materialUpgradeCost = getCannonMaterialUpgradeCost(gameState);

  return (
    <section
      className="materials-page treasure-scene treasure-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.treasure})`
      }}
    >
      <div className="treasure-overlay" aria-hidden="true" />

      <div className="treasure-shell">
        <header className="treasure-topbar">
          <img alt="Sea of Treasure logo" className="treasure-logo" src={LOGO} />
          <div className="treasure-title-copy">
            <p className="eyebrow">Warehouse</p>
            <h1>Warehouse</h1>
            <p>Track resources, crafting materials, and rare discoveries.</p>
          </div>
          <div className="treasure-top-stats">
            <StatChip icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
            <StatChip icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} />
          </div>
        </header>

        <section className="treasure-grid treasure-overview-grid">
          <article className="treasure-panel">
            <h2>Upgrade Readiness</h2>
            <p className="treasure-note">Materials are used for cannon upgrades and future advanced crafting.</p>
            {nextCannon && materialUpgradeCost ? (
              <div className="treasure-contract-grid upgrade-grid">
                {Object.entries(materialUpgradeCost).map(([resourceId, amount]) => (
                  <TreasureRow key={resourceId} label={formatResourceName(resourceId)} value={`${formatNumber(getOwnedAmount(gameState, resourceId))} / ${formatNumber(amount)}`} />
                ))}
              </div>
            ) : (
              <div className="treasure-empty-state">
                <strong>Cannon upgrades are complete.</strong>
                <p>No further cannon materials are required right now.</p>
              </div>
            )}
          </article>

          <article className="treasure-panel">
            <h2>Key Storage</h2>
            <div className="treasure-stat-grid">
              <Metric icon={RESOURCE_ICONS.fish} label="Fish" value={formatNumber(gameState.resources.fish)} />
              <Metric icon={RESOURCE_ICONS.whaleOil} label="Whale Oil" value={formatNumber(gameState.resources.whaleOil)} />
              <Metric icon={RESOURCE_ICONS.navigationCharts} label="Navigation Charts" value={formatNumber(gameState.materials.navigationCharts)} />
              <Metric icon={RESOURCE_ICONS.compassFragments} label="Compass Fragments" value={formatNumber(gameState.materials.compassFragments)} />
              <Metric icon={RESOURCE_ICONS.gunpowder} label="Gunpowder" value={formatNumber(gameState.materials.gunpowder)} />
              <Metric icon={RESOURCE_ICONS.cannonParts} label="Cannon Parts" value={formatNumber(gameState.materials.cannonParts)} />
              <Metric icon={RESOURCE_ICONS.ancientRelics} label="Ancient Relics" value={formatNumber(gameState.materials.ancientRelics)} />
              <Metric icon={RESOURCE_ICONS.tradeContracts} label="Trade Contracts" value={formatNumber(gameState.materials.tradeContracts)} />
              <Metric icon={RESOURCE_ICONS.tradeSeals} label="Trade Seals" value={formatNumber(gameState.materials.tradeSeals)} />
              <Metric icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
            </div>
          </article>
        </section>

        <section className="treasure-grid treasure-sites-grid">
          <CategoryPanel title="Fishing" items={[
            [RESOURCE_ICONS.fish, "Fish", gameState.resources.fish],
            [RESOURCE_ICONS.whaleOil, "Whale Oil", gameState.resources.whaleOil]
          ]} />
          <CategoryPanel title="Navigation" items={[
            [RESOURCE_ICONS.navigationCharts, "Navigation Charts", gameState.materials.navigationCharts],
            [RESOURCE_ICONS.compassFragments, "Compass Fragments", gameState.materials.compassFragments]
          ]} />
          <CategoryPanel title="Gunnery" items={[
            [RESOURCE_ICONS.gunpowder, "Gunpowder", gameState.materials.gunpowder],
            [RESOURCE_ICONS.cannonParts, "Cannon Parts", gameState.materials.cannonParts]
          ]} />
          <CategoryPanel title="Trading" items={[
            [RESOURCE_ICONS.tradeContracts, "Trade Contracts", gameState.materials.tradeContracts],
            [RESOURCE_ICONS.tradeSeals, "Trade Seals", gameState.materials.tradeSeals]
          ]} />
          <CategoryPanel title="Treasure" items={[
            [RESOURCE_ICONS.ancientRelics, "Ancient Relics", gameState.materials.ancientRelics],
            [RESOURCE_ICONS.rareMapPiece, "Rare Map Pieces", gameState.rareMapPieces]
          ]} />
        </section>
      </div>
    </section>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="treasure-chip">
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
    <div className="treasure-metric">
      {icon ? <img alt={label} className="treasure-metric-icon" src={icon} /> : null}
      <div className="treasure-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function TreasureRow({ label, value }) {
  return (
    <div className="treasure-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CategoryPanel({ title, items }) {
  return (
    <article className="treasure-panel">
      <h2>{title}</h2>
      <div className="treasure-category-list">
        {items.map(([icon, label, value]) => (
          <div className="treasure-category-row" key={label}>
            <div className="treasure-category-left">
              <img alt={label} className="treasure-category-icon" src={icon} />
              <span>{label}</span>
            </div>
            <strong>{formatNumber(value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatResourceName(resourceId) {
  const names = {
    gold: "Gold",
    gunpowder: "Gunpowder",
    cannonParts: "Cannon Parts",
    navigationCharts: "Navigation Charts",
    compassFragments: "Compass Fragments",
    ancientRelics: "Ancient Relics",
    tradeSeals: "Trade Seals",
    rareMapPieces: "Rare Map Pieces",
    whaleOil: "Whale Oil"
  };

  return names[resourceId] ?? resourceId;
}

function getOwnedAmount(gameState, resourceId) {
  if (resourceId === "gold") {
    return gameState.gold;
  }

  if (resourceId === "rareMapPieces") {
    return gameState.rareMapPieces;
  }

  if (resourceId === "whaleOil") {
    return gameState.resources.whaleOil;
  }

  return gameState.materials[resourceId] ?? 0;
}

export default Materials;
