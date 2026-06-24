import { useState } from "react";
import {
  CANNON_IMAGES,
  LOGO,
  RESOURCE_ICONS,
  SCENES,
  SHIP_IMAGES,
  UI_CANNONBALLS,
  UI_GOLD,
  UI_HULL,
  UI_XP
} from "../data/assets.js";
import { ships } from "../data/ships.js";
import { craftableUpgrades } from "../data/crafting.js";
import {
  calcCannonUpgradeCost,
  formatNumber,
  getCannonMaterialUpgradeCost,
  getCurrentCannon,
  getCraftingCost,
  getCraftingEffect,
  getNextCannon,
  hasCannonMaterialUpgradeResources
} from "../utils/gameEngine.js";

function Shop({ gameState, dispatch }) {
  const [activeCategory, setActiveCategory] = useState("ships");
  const currentCannon = getCurrentCannon(gameState);
  const nextCannon = getNextCannon(gameState);
  const goldUpgradeCost = calcCannonUpgradeCost(gameState);
  const materialUpgradeCost = getCannonMaterialUpgradeCost(gameState);
  const canBuyCannonUpgrade =
    Boolean(nextCannon) &&
    gameState.playerLevel >= nextCannon.unlockLevel &&
    gameState.gold >= goldUpgradeCost;
  const canCraftCannonUpgrade =
    Boolean(nextCannon) &&
    gameState.playerLevel >= nextCannon.unlockLevel &&
    hasCannonMaterialUpgradeResources(gameState);

  return (
    <section
      className="shop-page shop-scene shop-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.shop ?? SCENES.harbour})`
      }}
    >
      <div className="shop-overlay" aria-hidden="true" />

      <div className="shop-shell">
        <header className="shop-topbar">
          <img alt="Sea of Treasure logo" className="shop-logo" src={LOGO} />
          <div className="shop-title-copy">
            <p className="eyebrow">Shop</p>
            <h1>Shop</h1>
            <p>Buy ships, upgrade cannons, restock cannonballs, and craft ship improvements.</p>
          </div>
        </header>

        <div className="shop-tabs" role="tablist" aria-label="Shop categories">
          <TabButton active={activeCategory === "ships"} label="Ships" onClick={() => setActiveCategory("ships")} />
          <TabButton active={activeCategory === "cannons"} label="Cannons" onClick={() => setActiveCategory("cannons")} />
          <TabButton active={activeCategory === "cannonballs"} label="Cannonballs" onClick={() => setActiveCategory("cannonballs")} />
          <TabButton active={activeCategory === "improvements"} label="Ship Improvements" onClick={() => setActiveCategory("improvements")} />
        </div>

        {activeCategory === "ships" && (
          <section className="shop-grid">
            <article className="shop-panel">
              <h2>Shipyard Inventory</h2>
              <p className="shop-note">Ships can be bought and activated here. My Ship remains the inspection screen.</p>
              <div className="shop-ship-grid">
                {ships.map((ship) => {
                  const isOwned = gameState.ownedShips.includes(ship.id);
                  const isActive = gameState.currentShipId === ship.id;
                  const locked = gameState.playerLevel < ship.level;
                  const unaffordable = gameState.gold < ship.purchaseCost;
                  const shipState = isActive ? "active" : isOwned ? "owned" : locked ? "locked" : unaffordable ? "unaffordable" : "available";
                  const canBuy = shipState === "available";
                  const canActivate = shipState === "owned";

                  return (
                    <article className={`shop-ship-card ${shipState}`} key={ship.id}>
                      <div className="shop-card-image-frame">
                        <img alt={ship.name} className="shop-card-image" src={SHIP_IMAGES[ship.id]} />
                      </div>
                      <div className="shop-card-header">
                        <div>
                          <p className="shop-kicker">Level {ship.level}</p>
                          <h3>{ship.name}</h3>
                        </div>
                        <span className={`ship-status ${shipState}`}>{getShipStatusLabel(shipState)}</span>
                      </div>
                      <div className="shop-card-stats">
                        <Metric icon={UI_HULL} label="Map" value={ship.mapName} />
                        <Metric icon={UI_CANNONBALLS} label="Cannons" value={formatNumber(ship.cannons)} />
                        <Metric icon={UI_GOLD} label="Ships / Hour" value={formatNumber(ship.shipsPerHour)} />
                        <Metric icon={UI_GOLD} label="Gold / Ship" value={formatNumber(ship.goldPerShip)} />
                        <Metric icon={UI_GOLD} label="Purchase Cost" value={formatNumber(ship.purchaseCost)} />
                      </div>
                      <div className="shop-actions">
                        {shipState === "active" ? (
                          <span className="active-ship-label">Active Ship</span>
                        ) : (
                          <>
                            {!isOwned && (
                              <button
                                className="chunky-button primary"
                                disabled={!canBuy}
                                onClick={() => dispatch({ type: "BUY_SHIP", shipId: ship.id })}
                                type="button"
                              >
                                Buy Ship
                              </button>
                            )}
                            {isOwned && (
                              <button
                                className="chunky-button"
                                disabled={!canActivate}
                                onClick={() => dispatch({ type: "SET_ACTIVE_SHIP", shipId: ship.id })}
                                type="button"
                              >
                                Set Active
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {activeCategory === "cannons" && (
          <section className="shop-grid">
            <article className="shop-panel">
              <h2>Cannon Upgrades</h2>
              <div className="shop-cannon-art-grid">
                <CannonFrame caption="Current Cannon" image={CANNON_IMAGES[currentCannon.tier]} title={`${currentCannon.name} - Tier ${currentCannon.tier}`} />
                <CannonFrame caption="Next Cannon" image={nextCannon ? CANNON_IMAGES[nextCannon.tier] : null} title={nextCannon ? `${nextCannon.name} - Tier ${nextCannon.tier}` : "Max Tier"} />
              </div>
              <div className="shop-stat-grid">
                <Metric icon={UI_GOLD} label="Current Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} />
                <Metric icon={UI_GOLD} label="Next Damage Multiplier" value={nextCannon ? `${formatNumber(nextCannon.damageMultiplier)}x` : "Complete"} />
                <Metric icon={UI_XP} label="Unlock Level" value={nextCannon ? nextCannon.unlockLevel : "Max"} />
              </div>
              <div className="shop-cost-panel">
                <h3>Gold Upgrade Path</h3>
                <p>{nextCannon ? formatNumber(goldUpgradeCost) : "Complete"}</p>
              </div>
              <div className="shop-cost-panel">
                <h3>Material Upgrade Path</h3>
                {materialUpgradeCost ? (
                  <div className="shop-cost-list">
                    {Object.entries(materialUpgradeCost).map(([resourceId, amount]) => (
                      <div key={resourceId}>
                        <span>{formatResourceName(resourceId)}</span>
                        <strong>{formatNumber(amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Cannon tier is fully upgraded.</p>
                )}
              </div>
              <div className="shop-button-row">
                <button className="chunky-button primary" disabled={!canBuyCannonUpgrade} onClick={() => dispatch({ type: "UPGRADE_CANNONS_WITH_GOLD" })} type="button">
                  Buy Upgrade
                </button>
                <button className="chunky-button" disabled={!canCraftCannonUpgrade} onClick={() => dispatch({ type: "UPGRADE_CANNONS_WITH_MATERIALS" })} type="button">
                  Craft Upgrade
                </button>
              </div>
            </article>
          </section>
        )}

        {activeCategory === "cannonballs" && (
          <section className="shop-grid">
            <article className="shop-panel">
              <h2>Supply Store</h2>
              <div className="shop-supply-grid">
                <Metric icon={UI_CANNONBALLS} label="Cannonballs Owned" value={formatNumber(gameState.cannonballs)} />
                <Metric icon={UI_GOLD} label="Cost per 100" value={formatNumber(currentCannon.goldPer100Balls)} />
              </div>
              <button className="chunky-button primary" onClick={() => dispatch({ type: "BUY_CANNONBALLS", quantity: 100 })} type="button">
                Buy 100 Cannonballs
              </button>
            </article>
          </section>
        )}

        {activeCategory === "improvements" && (
          <section className="shop-grid">
            <article className="shop-panel">
              <h2>Ship Improvements</h2>
              <div className="shop-upgrade-grid">
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
                    <article className={maxed ? "shop-upgrade-card maxed" : "shop-upgrade-card"} key={upgrade.id}>
                      <div className="shop-card-header">
                        <div>
                          <p className="shop-kicker">Ship Improvement</p>
                          <h3>{upgrade.name}</h3>
                        </div>
                        <span className="upgrade-level-badge">
                          Lv. {currentLevel} / {upgrade.maxLevel}
                        </span>
                      </div>
                      <p className="shop-note">{upgrade.effect}</p>
                      <div className="shop-bonus-row">
                        <span>Current Bonus</span>
                        <strong>{getCraftingEffect(upgrade.id, currentLevel)}</strong>
                      </div>
                      <div className="shop-cost-list">
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
          </section>
        )}
      </div>
    </section>
  );
}

function getShipStatusLabel(shipState) {
  const labels = {
    active: "Active",
    owned: "Owned",
    available: "Available",
    locked: "Locked by Level",
    unaffordable: "Not Enough Gold"
  };

  return labels[shipState];
}

function ShopChip({ icon, label, value }) {
  return (
    <div className="shop-chip">
      <img alt={label} src={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button className={active ? "shop-tab active" : "shop-tab"} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="shop-metric">
      {icon ? <img alt={label} className="shop-metric-icon" src={icon} /> : null}
      <div className="shop-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CostRow({ icon, label, value }) {
  return (
    <div className="shop-cost-row">
      <div className="shop-cost-left">
        <img alt={label} className="shop-cost-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function CannonFrame({ caption, image, title }) {
  return (
    <div className="shop-frame-card">
      <span className="shop-frame-caption">{caption}</span>
      <div className="shop-frame-image-shell">
        {image ? <img alt={title} src={image} /> : <span className="shop-frame-empty">No cannon available</span>}
      </div>
      <strong>{title}</strong>
    </div>
  );
}

function formatResourceName(resourceId) {
  const names = {
    gold: "Gold",
    fish: "Fish",
    whaleOil: "Whale Oil",
    gunpowder: "Gunpowder",
    cannonParts: "Cannon Parts",
    navigationCharts: "Navigation Charts",
    compassFragments: "Compass Fragments",
    ancientRelics: "Ancient Relics",
    tradeContracts: "Trade Contracts",
    tradeSeals: "Trade Seals",
    rareMapPieces: "Rare Map Pieces"
  };

  return names[resourceId] ?? resourceId;
}

export default Shop;
