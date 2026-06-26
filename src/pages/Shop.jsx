import { useState } from "react";
import {
  CANNON_IMAGES,
  LOGO,
  RESOURCE_ICONS,
  SCENES,
  SHIP_IMAGES,
  UI_CANNONBALLS,
  UI_DOUBLOONS,
  UI_GOLD,
  UI_HULL,
  UI_XP
} from "../data/assets.js";
import Tooltip from "../components/Tooltip.jsx";
import { ammunition } from "../data/ammunition.js";
import { cannons } from "../data/cannons.js";
import { ships } from "../data/ships.js";
import { craftableUpgrades } from "../data/crafting.js";
import {
  calcCannonUpgradeCost,
  formatNumber,
  getCannonMaterialUpgradeCost,
  getCannonCapacity,
  getCurrentCannon,
  getCannonInventory,
  getEquippedCannons,
  getCraftingCost,
  getCraftingEffect,
  getNextCannon,
  hasCannonMaterialUpgradeResources,
  getTotalEquippedCannons
} from "../utils/gameEngine.js";

function Shop({ gameState, dispatch }) {
  const [activeCategory, setActiveCategory] = useState("ships");
  const currentCannon = getCurrentCannon(gameState);
  const nextCannon = getNextCannon(gameState);
  const cannonInventory = getCannonInventory(gameState);
  const equippedCannons = getEquippedCannons(gameState);
  const ammoInventory = gameState.ammoInventory ?? {};
  const selectedAmmo = ammunition.find((ammo) => ammo.id === gameState.selectedAmmoId) ?? ammunition[0];
  const totalAmmo = Object.values(ammoInventory).reduce((total, value) => total + (value ?? 0), 0);
  const totalEquippedCannons = getTotalEquippedCannons(gameState);
  const cannonCapacity = getCannonCapacity(gameState);
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
            <p className="shop-note">Doubloon purchases will unlock in a future update.</p>
          </div>
          <div className="shop-top-stats">
            <ShopChip icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} tooltip="Gold is the main currency used for ships, repairs, and most upgrades." />
            <ShopChip icon={UI_DOUBLOONS} label="Doubloons" value={formatNumber(gameState.doubloons)} tooltip="Doubloons are rare premium currency earned from milestones and special rewards." />
            <ShopChip icon={UI_CANNONBALLS} label="Ammo" value={`${selectedAmmo.name} / ${formatNumber(totalAmmo)}`} tooltip="Selected ammo is used in combat. Total ammo shows everything in storage." />
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
              <h2><Tooltip label="Shipyard Inventory" text="Buy ships here and set the active ship for your voyage." position="right">Shipyard Inventory</Tooltip></h2>
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
              <h2><Tooltip label="Cannon Arsenal" text="Purchase individual cannons here and build a loadout from your inventory." position="right">Cannon Arsenal</Tooltip></h2>
              <div className="shop-stat-grid">
                <Metric icon={UI_CANNONBALLS} label="Equipped / Capacity" value={`${formatNumber(totalEquippedCannons)} / ${formatNumber(cannonCapacity)}`} tooltip="Your active loadout cannot exceed the ship's cannon capacity." />
                <Metric icon={UI_GOLD} label="Highest Cannon" value={currentCannon.name} tooltip="This is the strongest cannon tier you currently own." />
                <Metric icon={UI_GOLD} label="Upgrade Tier" value={`Tier ${currentCannon.tier}`} tooltip="This is the cannon tier your upgrade system currently reaches." />
              </div>
              <div className="shop-cannon-inventory-grid">
                {cannons.map((cannon) => {
                  const owned = cannonInventory[cannon.id] ?? 0;
                  const equipped = equippedCannons[cannon.id] ?? 0;
                  const locked = gameState.playerLevel < cannon.unlockLevel;
                  const canBuy1 = gameState.playerLevel >= cannon.unlockLevel && gameState.gold >= cannon.purchaseCost;
                  const canBuy10 = gameState.playerLevel >= cannon.unlockLevel && gameState.gold >= cannon.purchaseCost * 10;

                  return (
                    <article className={locked ? "shop-cannon-card locked" : "shop-cannon-card"} key={cannon.id}>
                      <div className="shop-card-image-frame">
                        <img alt={cannon.name} className="shop-card-image" src={CANNON_IMAGES[cannon.tier]} />
                      </div>
                      <div className="shop-card-header">
                        <div>
                          <p className="shop-kicker">Tier {cannon.tier}</p>
                          <h3>{cannon.name}</h3>
                        </div>
                        <span className="ship-status">{formatNumber(cannon.damageMultiplier)}x damage</span>
                      </div>
                      <div className="shop-card-stats">
                        <Metric icon={UI_GOLD} label="Owned" value={formatNumber(owned)} tooltip="How many cannons of this tier are in your inventory." />
                        <Metric icon={UI_CANNONBALLS} label="Equipped" value={formatNumber(equipped)} tooltip="How many cannons of this tier are currently mounted." />
                        <Metric icon={UI_GOLD} label="Purchase Cost" value={formatNumber(cannon.purchaseCost)} tooltip="Gold cost to buy this cannon from the shop." />
                        <Metric icon={UI_XP} label="Unlock Level" value={cannon.unlockLevel} tooltip="Your player level must meet this requirement to buy the cannon." />
                      </div>
                      <div className="shop-button-row">
                        <button
                          className="chunky-button primary"
                          disabled={!canBuy1}
                          onClick={() => dispatch({ type: "BUY_CANNON", cannonId: cannon.id, quantity: 1 })}
                          type="button"
                        >
                          Buy 1
                        </button>
                        <button
                          className="chunky-button primary"
                          disabled={!canBuy10}
                          onClick={() => dispatch({ type: "BUY_CANNON", cannonId: cannon.id, quantity: 10 })}
                          type="button"
                        >
                          Buy 10
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>

            <article className="shop-panel">
              <h2><Tooltip label="Cannon Upgrades" text="Upgrade the whole cannon system by one tier using gold or materials." position="right">Cannon Upgrades</Tooltip></h2>
              <div className="shop-cannon-art-grid">
                <CannonFrame caption="Current Cannon" image={CANNON_IMAGES[currentCannon.tier]} title={`${currentCannon.name} - Tier ${currentCannon.tier}`} />
                <CannonFrame caption="Next Cannon" image={nextCannon ? CANNON_IMAGES[nextCannon.tier] : null} title={nextCannon ? `${nextCannon.name} - Tier ${nextCannon.tier}` : "Max Tier"} />
              </div>
              <div className="shop-stat-grid">
                <Metric icon={UI_GOLD} label="Current Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} tooltip="Damage multiplier for the current cannon tier." />
                <Metric icon={UI_GOLD} label="Next Damage Multiplier" value={nextCannon ? `${formatNumber(nextCannon.damageMultiplier)}x` : "Complete"} tooltip="The next cannon tier's damage multiplier." />
                <Metric icon={UI_XP} label="Unlock Level" value={nextCannon ? nextCannon.unlockLevel : "Max"} tooltip="The player level required for the next cannon tier." />
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
              <h2><Tooltip label="Supply Store" text="Restock cannonballs here to keep combat going." position="right">Supply Store</Tooltip></h2>
              <div className="shop-supply-grid">
                <Metric icon={UI_CANNONBALLS} label="Selected Ammo" value={selectedAmmo.name} tooltip="This is the ammo type currently used in combat." />
                <Metric icon={UI_CANNONBALLS} label="Total Ammo" value={formatNumber(totalAmmo)} tooltip="All ammo types combined in your inventory." />
              </div>
              <div className="shop-ammo-grid">
                {ammunition.map((ammo) => {
                  const owned = ammoInventory[ammo.id] ?? 0;
                  const purchasable = ammo.purchasable;
                  const canBuy = purchasable && gameState.gold >= ammo.costPer100;
                  return (
                    <article className={ammo.id === gameState.selectedAmmoId ? "shop-ammo-card selected" : "shop-ammo-card"} key={ammo.id}>
                      <div className="shop-card-header">
                        <div>
                          <p className="shop-kicker">{ammo.id === "iron" ? "Standard" : ammo.id === "leviathan" ? "Future" : "Advanced"}</p>
                          <h3>{ammo.name}</h3>
                        </div>
                        <span className="ship-status">{formatNumber(ammo.damageMultiplier)}x damage</span>
                      </div>
                      <div className="shop-card-stats">
                        <Metric icon={UI_CANNONBALLS} label="Owned" value={formatNumber(owned)} tooltip="How much of this ammo type is currently in storage." />
                        <Metric icon={UI_GOLD} label="Cost per 100" value={ammo.purchasable ? formatNumber(ammo.costPer100) : "Locked"} tooltip="Gold cost for 100 units of this ammo type." />
                        <Metric icon={UI_GOLD} label="Multiplier" value={`${formatNumber(ammo.damageMultiplier)}x`} tooltip="Damage multiplier applied when this ammo type is selected." />
                        <Metric icon={UI_XP} label="Source" value={ammo.purchasable ? "Shop" : ammo.source} tooltip="Where this ammo type comes from." />
                      </div>
                      <div className="shop-button-row">
                        {purchasable ? (
                          <button
                            className="chunky-button primary"
                            disabled={!canBuy}
                            onClick={() => dispatch({ type: "BUY_AMMO", ammoId: ammo.id, quantity: 100 })}
                            type="button"
                          >
                            Buy 100
                          </button>
                        ) : (
                          <span className="active-ship-label">Locked</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {activeCategory === "improvements" && (
          <section className="shop-grid">
            <article className="shop-panel">
              <h2><Tooltip label="Ship Improvements" text="Craft Reinforced Hull, Speed Sails, and Cannon Braces with resources." position="right">Ship Improvements</Tooltip></h2>
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
                        <Tooltip label="Current Bonus" text="The bonus this ship improvement currently provides." position="right">
                          <span>Current Bonus</span>
                        </Tooltip>
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

function ShopChip({ icon, label, value, tooltip }) {
  const content = (
    <div className="shop-chip">
      <img alt={label} src={icon} />
      <div>
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

function TabButton({ active, label, onClick }) {
  return (
    <button className={active ? "shop-tab active" : "shop-tab"} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function Metric({ icon, label, value, tooltip }) {
  const content = (
    <div className="shop-metric">
      {icon ? <img alt={label} className="shop-metric-icon" src={icon} /> : null}
      <div className="shop-metric-copy">
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

function CostRow({ icon, label, value, tooltip }) {
  const content = (
    <div className="shop-cost-row">
      <div className="shop-cost-left">
        <img alt={label} className="shop-cost-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );

  return tooltip ? (
    <Tooltip label={label} text={tooltip}>
      {content}
    </Tooltip>
  ) : content;
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
