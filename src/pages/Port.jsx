import { useEffect, useState } from "react";
import { LOGO, RESOURCE_ICONS, SCENES, UI_CANNONBALLS, UI_GOLD } from "../data/assets.js";
import { tradeGoods } from "../data/tradeGoods.js";
import Tooltip from "../components/Tooltip.jsx";
import {
  getActiveWorldEvent,
  formatDuration,
  formatNumber,
  getCargoCapacity,
  getFishSellValue,
  getMarketCooldownRemaining,
  getSelectedAmmo,
  getTotalAmmoCount,
  getTradeGoodBuyPrice,
  getTradeGoodSellPrice,
  getUsedCargo,
  getWhaleOilSellValue
} from "../utils/gameEngine.js";

function Port({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const activeWorldEvent = getActiveWorldEvent(gameState);
  const usedCargo = getUsedCargo(gameState);
  const cargoCapacity = getCargoCapacity(gameState);
  const selectedAmmo = getSelectedAmmo(gameState);
  const totalAmmo = getTotalAmmoCount(gameState);
  const cooldownRemaining = getMarketCooldownRemaining(gameState, now);
  const tradingLevel = gameState.skills.trading?.level ?? 1;
  const tradeAllowanceRemaining = Math.max(0, gameState.marketTradeLimit - gameState.marketTradeUsed);

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
            <p>Trade goods, restock supplies, and manage your warehouse.</p>
          </div>
          <div className="harbour-top-stats">
            <HarbourChip icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} tooltip="Gold is your main currency for trade, ships, repairs, and upgrades." />
            <HarbourChip icon={UI_CANNONBALLS} label="Ammo" value={`${selectedAmmo.name} / ${formatNumber(totalAmmo)}`} tooltip="Selected ammo is used in combat. Total ammo shows all ammo in storage." />
          </div>
        </header>

        {activeWorldEvent?.id === "merchantConvoy" ? (
          <article className="harbour-panel harbour-event-banner">
            <div className="panel-heading-row">
              <h2>World Event</h2>
              <span className="resource-counter">{activeWorldEvent.name}</span>
            </div>
            <p className="harbour-note">{activeWorldEvent.description}</p>
            <p className="harbour-note">{describeWorldEventEffects(activeWorldEvent)}</p>
          </article>
        ) : null}

        <section className="harbour-grid harbour-overview-grid">
          <article className="harbour-panel">
            <h2>Harbour Overview</h2>
            <div className="harbour-stat-grid">
              <Metric icon={UI_GOLD} label="Gold" value={formatNumber(gameState.gold)} />
              <Metric icon={UI_CANNONBALLS} label="Selected Ammo" value={selectedAmmo.name} />
              <Metric icon={UI_CANNONBALLS} label="Ammo Stock" value={formatNumber(totalAmmo)} />
              <Metric icon={UI_CANNONBALLS} label="Cargo Used / Capacity" value={`${formatNumber(usedCargo)} / ${formatNumber(cargoCapacity)}`} />
              <Metric icon={UI_GOLD} label="Trading Level" value={formatNumber(tradingLevel)} />
            </div>
          </article>

          <article className="harbour-panel">
            <h2>Market Cycle</h2>
            <div className="harbour-stat-grid">
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
            <p className="harbour-note">Some resources are better kept for crafting.</p>
            <div className="harbour-resource-grid">
              <ResourceMarketCard
                icon={RESOURCE_ICONS.fish}
                label="Fish"
                value={formatNumber(gameState.resources.fish)}
                sellValue={formatNumber(getFishSellValue(gameState))}
                buttons={[
                  { label: "Sell 1", disabled: gameState.resources.fish < 1, onClick: () => dispatch({ type: "SELL_FISH", quantity: 1 }) },
                  { label: "Sell 10", disabled: gameState.resources.fish < 10, onClick: () => dispatch({ type: "SELL_FISH", quantity: 10 }) },
                  { label: "Sell All", disabled: gameState.resources.fish < 1, onClick: () => dispatch({ type: "SELL_FISH", quantity: "all" }) }
                ]}
              />

              <ResourceMarketCard
                icon={RESOURCE_ICONS.whaleOil}
                label="Whale Oil"
                value={formatNumber(gameState.resources.whaleOil)}
                sellValue={formatNumber(getWhaleOilSellValue(gameState))}
                buttons={[
                  { label: "Sell 1", disabled: gameState.resources.whaleOil < 1, onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: 1 }) },
                  { label: "Sell 5", disabled: gameState.resources.whaleOil < 5, onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: 5 }) },
                  { label: "Sell All", disabled: gameState.resources.whaleOil < 1, onClick: () => dispatch({ type: "SELL_WHALE_OIL", quantity: "all" }) }
                ]}
              />
            </div>
          </article>
        </section>

        <section className="harbour-grid harbour-warehouse-grid">
          <article className="harbour-panel">
            <h2>Warehouse</h2>
            <p className="harbour-note">Track resources, crafting materials, and rare discoveries.</p>
            <div className="harbour-warehouse-grid">
              <WarehouseGroup
                title="Fishing"
                items={[
                  [RESOURCE_ICONS.fish, "Fish", gameState.resources.fish],
                  [RESOURCE_ICONS.whaleOil, "Whale Oil", gameState.resources.whaleOil]
                ]}
              />
              <WarehouseGroup
                title="Navigation"
                items={[
                  [RESOURCE_ICONS.navigationCharts, "Navigation Charts", gameState.materials.navigationCharts],
                  [RESOURCE_ICONS.compassFragments, "Compass Fragments", gameState.materials.compassFragments]
                ]}
              />
              <WarehouseGroup
                title="Gunnery"
                items={[
                  [RESOURCE_ICONS.gunpowder, "Gunpowder", gameState.materials.gunpowder],
                  [RESOURCE_ICONS.cannonParts, "Cannon Parts", gameState.materials.cannonParts]
                ]}
              />
              <WarehouseGroup
                title="Trading"
                items={[
                  [RESOURCE_ICONS.tradeContracts, "Trade Contracts", gameState.materials.tradeContracts],
                  [RESOURCE_ICONS.tradeSeals, "Trade Seals", gameState.materials.tradeSeals]
                ]}
              />
              <WarehouseGroup
                title="Treasure"
                items={[
                  [RESOURCE_ICONS.ancientRelics, "Ancient Relics", gameState.materials.ancientRelics],
                  [RESOURCE_ICONS.rareMapPiece, "Rare Map Pieces", gameState.rareMapPieces]
                ]}
              />
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

function HarbourChip({ icon, label, value, tooltip }) {
  const content = (
    <div className="harbour-chip">
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
      <div className="harbour-resource-title">
        <img alt={label} className="harbour-resource-icon" src={icon} />
        <div>
          <h3>{label}</h3>
          <p>Sell price {sellValue} Gold</p>
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

function describeWorldEventEffects(event) {
  if ((event.effects?.tradeSellValueMultiplier ?? 1) > 1) {
    return `Trade sell value +${Math.round((event.effects.tradeSellValueMultiplier - 1) * 100)}%`;
  }

  return "Temporary world modifiers are active.";
}

function WarehouseGroup({ title, items }) {
  return (
    <article className="harbour-warehouse-card">
      <h3>{title}</h3>
      <div className="harbour-warehouse-list">
        {items.map(([icon, label, value]) => (
          <div className="harbour-warehouse-row" key={label}>
            <div className="harbour-warehouse-left">
              <img alt={label} className="harbour-warehouse-icon" src={icon} />
              <span>{label}</span>
            </div>
            <strong>{formatNumber(value)}</strong>
          </div>
        ))}
      </div>
    </article>
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

export default Port;
