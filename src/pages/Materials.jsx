import {
  formatNumber,
  getCannonMaterialUpgradeCost,
  getNextCannon
} from "../utils/gameEngine.js";

function Materials({ gameState }) {
  const materials = gameState.materials;
  const resources = gameState.resources;
  const nextCannon = getNextCannon(gameState);
  const materialUpgradeCost = getCannonMaterialUpgradeCost(gameState);

  return (
    <section className="materials-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Stores</p>
          <h1>Materials</h1>
        </div>
        <span className="resource-counter">{formatNumber(gameState.rareMapPieces)} Rare Map Pieces</span>
      </div>

      <article className="pixel-panel material-group">
        <h2>Upgrade Materials</h2>
        <p className="shop-note">
          Materials are used for cannon upgrades and future advanced crafting.
        </p>
        {nextCannon && materialUpgradeCost ? (
          <div className="crafting-cost-list">
            {Object.entries(materialUpgradeCost).map(([resourceId, amount]) => (
              <div key={resourceId}>
                <span>{formatResourceName(resourceId)}</span>
                <strong>
                  {formatNumber(getOwnedAmount(gameState, resourceId))} / {formatNumber(amount)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="shop-note">Cannon upgrades are complete.</p>
        )}
      </article>

      <div className="materials-grid">
        <MaterialGroup
          title="Navigation"
          items={[
            ["Navigation Charts", materials.navigationCharts],
            ["Compass Fragments", materials.compassFragments]
          ]}
        />
        <MaterialGroup
          title="Gunnery"
          items={[
            ["Gunpowder", materials.gunpowder],
            ["Cannon Parts", materials.cannonParts]
          ]}
        />
        <MaterialGroup
          title="Trading"
          items={[
            ["Trade Contracts", materials.tradeContracts],
            ["Trade Seals", materials.tradeSeals]
          ]}
        />
        <MaterialGroup
          title="Treasure"
          items={[
            ["Ancient Relics", materials.ancientRelics],
            ["Rare Map Pieces", gameState.rareMapPieces]
          ]}
        />
        <MaterialGroup
          title="Fishing"
          items={[
            ["Fish", resources.fish],
            ["Whale Oil", resources.whaleOil]
          ]}
        />
      </div>
    </section>
  );
}

function MaterialGroup({ title, items }) {
  return (
    <article className="pixel-panel material-group">
      <h2>{title}</h2>
      <div className="material-list">
        {items.map(([label, value]) => (
          <div className="resource-row" key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
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

export default Materials;
