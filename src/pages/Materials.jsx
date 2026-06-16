import { formatNumber } from "../utils/gameEngine.js";

function Materials({ gameState }) {
  const materials = gameState.materials;
  const resources = gameState.resources;

  return (
    <section className="materials-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Stores</p>
          <h1>Materials</h1>
        </div>
        <span className="resource-counter">{formatNumber(gameState.rareMapPieces)} Rare Map Pieces</span>
      </div>

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

export default Materials;
