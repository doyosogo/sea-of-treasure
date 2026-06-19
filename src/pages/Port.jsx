import { useEffect, useState } from "react";
import { CANNON_IMAGES, LOGO, RESOURCE_ICONS, SCENES, UI_CANNONBALLS, UI_GOLD } from "../data/assets.js";
import { tradeGoods } from "../data/tradeGoods.js";
import {
  calcCannonUpgradeCost,
  formatDuration,
  formatNumber,
  getCargoCapacity,
  getCannonMaterialUpgradeCost,
  getCurrentCannon,
  getFishSellValue,
  getMarketCooldownRemaining,
  getNextCannon,
  getTradeGoodBuyPrice,
  getTradeGoodSellPrice,
  getUsedCargo,
  hasCannonMaterialUpgradeResources,
  getWhaleOilSellValue
} from "../utils/gameEngine.js";

function Port({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const usedCargo = getUsedCargo(gameState);
  const cargoCapacity = getCargoCapacity(gameState);
  const cooldownRemaining = getMarketCooldownRemaining(gameState, now);
  const tradingLevel = gameState.skills.trading?.level ?? 1;
  const tradeAllowanceRemaining = Math.max(0, gameState.marketTradeLimit - gameState.marketTradeUsed);
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

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section
      className="port-page harbour-scene harbour-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.harbour})`
      }}
    >
      <div className="harbour-overlay" aria-hidden="true" />

      <div className="harbour-shell">
        <header className="harbour-topbar">
          <img alt="Sea of Treasure logo" className="harbour-logo" src={LOGO} />
          <div className="harbour-title-copy">
            <p className="eyebrow">Harbour</p>
            <h1>Harbour</h1>
            <p>Trade goods, restock supplies, and upgrade your cannons.</p>
          </div>
          <div className="harbour-top-stats">
            <IconChip icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} />
            <IconChip icon={UI_CANNONBALLS} label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
          </div>
        </header>

        <section className="harbour-grid harbour-overview-grid">
          <article className="harbour-panel">
            <h2>Harbour Overview</h2>
            <div className="harbour-stat-grid">
              <Metric icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} />
              <Metric icon={UI_CANNONBALLS} label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
              <Metric icon={UI_GOLD} label="Cargo Used / Capacity" value={`${formatNumber(usedCargo)} / ${formatNumber(cargoCapacity)}`} />
              <Metric icon={UI_GOLD} label="Current Cannon Tier" value={`Tier ${currentCannon.tier} - ${currentCannon.name}`} />
            </div>
          </article>

          <article className="harbour-panel">
            <h2>Market Cycle</h2>
            <div className="harbour-stat-grid">
              <Metric icon={UI_GOLD} label="Trading Level" value={formatNumber(tradingLevel)} />
              <Metric
                icon={UI_GOLD}
                label="Time Until Next Market Cycle"
                value={cooldownRemaining > 0 ? formatDuration(cooldownRemaining) : "Ready"}
              />
              <Metric
                icon={UI_GOLD}
                label="Trade Allowance Used"
                value={`${formatNumber(gameState.marketTradeUsed)} / ${formatNumber(gameState.marketTradeLimit)}`}
              />
              <Metric icon={UI_GOLD} label="Allowance Remaining" value={formatNumber(tradeAllowanceRemaining)} />
            </div>
            <button
              className="chunky-button primary"
              disabled={cooldownRemaining > 0}
              onClick={() => dispatch({ type: "REFRESH_MARKET" })}
              type="button"
            >
              {cooldownRemaining > 0 ? "Refresh Market" : "Start New Market Cycle"}
            </button>
          </article>
        </section>

        <section className="harbour-grid harbour-trade-grid">
          <article className="harbour-panel harbour-trade-panel">
            <h2>Trade Goods</h2>
            <div className="harbour-card-grid">
              {tradeGoods.map((good) => {
                const buyPrice = getTradeGoodBuyPrice(gameState, good);
                const sellPrice = getTradeGoodSellPrice(gameState, good);
                const owned = gameState.cargo[good.id] ?? 0;
                const freeCargo = cargoCapacity - usedCargo;
                const buyDisabled = gameState.gold < buyPrice || freeCargo < 1 || tradeAllowanceRemaining < 1;
                const buy10Disabled = gameState.gold < buyPrice * 10 || freeCargo < 10 || tradeAllowanceRemaining < 10;

                return (
                  <article className="harbour-item-card" key={good.id}>
                    <div className="harbour-item-heading">
                      <h3>{good.name}</h3>
                      <span className={sellPrice > buyPrice ? "profit-pill positive" : "profit-pill"}>
                        {sellPrice > buyPrice ? "Profit" : "Thin Margin"}
                      </span>
                    </div>

                    <div className="harbour-item-stats">
                      <ResourceRow label="Owned" value={formatNumber(owned)} />
                      <ResourceRow label="Buy Price" value={formatNumber(buyPrice)} />
                      <ResourceRow label="Sell Price" value={formatNumber(sellPrice)} />
                    </div>

                    <div className="harbour-button-grid">
                      <button
                        className="chunky-button buy-button"
                        disabled={buyDisabled}
                        onClick={() => dispatch({ type: "BUY_GOODS", goodId: good.id, quantity: 1 })}
                        type="button"
                      >
                        Buy 1
                      </button>
                      <button
                        className="chunky-button buy-button"
                        disabled={buy10Disabled}
                        onClick={() => dispatch({ type: "BUY_GOODS", goodId: good.id, quantity: 10 })}
                        type="button"
                      >
                        Buy 10
                      </button>
                      <button
                        className="chunky-button sell-button"
                        disabled={owned < 1}
                        onClick={() => dispatch({ type: "SELL_GOODS", goodId: good.id, quantity: 1 })}
                        type="button"
                      >
                        Sell 1
                      </button>
                      <button
                        className="chunky-button sell-button"
                        disabled={owned < 10}
                        onClick={() => dispatch({ type: "SELL_GOODS", goodId: good.id, quantity: 10 })}
                        type="button"
                      >
                        Sell 10
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="harbour-panel">
            <h2>Resource Market</h2>
            <p className="harbour-note">
              Some resources are better kept for crafting.
            </p>
            <div className="harbour-resource-grid">
              <ResourceMarketCard
                icon={RESOURCE_ICONS.fish}
                label="Fish"
                value={formatNumber(gameState.resources.fish)}
                sellValue={formatNumber(getFishSellValue(gameState))}
                buttons={[
                  {
                    label: "Sell 1",
                    disabled: gameState.resources.fish < 1,
                    onClick: () => dispatch({ type: "SELL_FISH", quantity: 1 })
                  },
                  {
                    label: "Sell 10",
                    disabled: gameState.resources.fish < 10,
                    onClick: () => dispatch({ type: "SELL_FISH", quantity: 10 })
                  },
                  {
                    label: "Sell All",
                    disabled: gameState.resources.fish < 1,
                    onClick: () => dispatch({ type: "SELL_FISH", quantity: "all" })
                  }
                ]}
              />

              <ResourceMarketCard
                icon={RESOURCE_ICONS.whaleOil}
                label="Whale Oil"
                value={formatNumber(gameState.resources.whaleOil)}
                sellValue={formatNumber(getWhaleOilSellValue(gameState))}
                buttons={[
                  {
                    label: "Sell 1",
                    disabled: gameState.resources.whaleOil < 1,
                    onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: 1 })
                  },
                  {
                    label: "Sell 5",
                    disabled: gameState.resources.whaleOil < 5,
                    onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: 5 })
                  },
                  {
                    label: "Sell All",
                    disabled: gameState.resources.whaleOil < 1,
                    onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: "all" })
                  }
                ]}
              />
            </div>
          </article>
        </section>

        <section className="harbour-grid harbour-cannon-grid">
          <article className="harbour-panel harbour-cannon-panel">
            <h2>Cannon Upgrades</h2>
            <div className="harbour-cannon-art-grid">
              <CannonFrame
                caption="Current Cannon"
                image={CANNON_IMAGES[currentCannon.tier]}
                title={`${currentCannon.name} - Tier ${currentCannon.tier}`}
              />
              <CannonFrame
                caption="Next Cannon"
                image={nextCannon ? CANNON_IMAGES[nextCannon.tier] : null}
                title={nextCannon ? `${nextCannon.name} - Tier ${nextCannon.tier}` : "Max Tier"}
              />
            </div>

            <div className="harbour-stat-grid">
              <Metric icon={UI_GOLD} label="Current Tier" value={`Tier ${currentCannon.tier}`} />
              <Metric icon={UI_GOLD} label="Damage Multiplier" value={`${formatNumber(currentCannon.damageMultiplier)}x`} />
              <Metric icon={UI_GOLD} label="Next Tier" value={nextCannon ? `Tier ${nextCannon.tier}` : "Max"} />
              <Metric icon={UI_GOLD} label="Next Damage Multiplier" value={nextCannon ? `${formatNumber(nextCannon.damageMultiplier)}x` : "Complete"} />
              <Metric icon={UI_GOLD} label="Unlock Level" value={nextCannon ? nextCannon.unlockLevel : "Max"} />
            </div>

            <div className="harbour-cost-panel">
              <h3>Gold Upgrade Cost</h3>
              <p>{nextCannon ? formatNumber(goldUpgradeCost) : "Complete"}</p>
            </div>

            <div className="harbour-cost-panel">
              <h3>Material Upgrade Cost</h3>
              {materialUpgradeCost ? (
                <div className="harbour-cost-list">
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

            <div className="harbour-button-row">
              <button
                className="chunky-button primary"
                disabled={!canBuyCannonUpgrade}
                onClick={() => dispatch({ type: "UPGRADE_CANNONS_WITH_GOLD" })}
                type="button"
              >
                Buy Upgrade
              </button>
              <button
                className="chunky-button"
                disabled={!canCraftCannonUpgrade}
                onClick={() => dispatch({ type: "UPGRADE_CANNONS_WITH_MATERIALS" })}
                type="button"
              >
                Craft Upgrade
              </button>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

function IconChip({ icon, label, value }) {
  return (
    <div className="harbour-chip">
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
    <div className="harbour-metric">
      {icon ? <img alt={label} className="harbour-metric-icon" src={icon} /> : null}
      <div className="harbour-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ResourceRow({ label, value }) {
  return (
    <div className="harbour-resource-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResourceMarketCard({ icon, label, value, sellValue, buttons }) {
  return (
    <article className="harbour-resource-card">
      <div className="harbour-item-heading">
        <div className="harbour-resource-title">
          <img alt={label} className="harbour-resource-icon" src={icon} />
          <div>
            <h3>{label}</h3>
            <p>Sell price {sellValue} Gold</p>
          </div>
        </div>
      </div>
      <ResourceRow label="Owned" value={value} />
      <div className="harbour-button-grid">
        {buttons.map((button) => (
          <button
            className="chunky-button sell-button"
            disabled={button.disabled}
            key={button.label}
            onClick={button.onClick}
            type="button"
          >
            {button.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function CannonFrame({ caption, image, title }) {
  return (
    <div className="harbour-cannon-frame">
      <span className="harbour-frame-caption">{caption}</span>
      <div className="harbour-frame-image-shell">
        {image ? <img alt={title} src={image} /> : <span className="harbour-frame-empty">No cannon available</span>}
      </div>
      <strong>{title}</strong>
    </div>
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

export default Port;
