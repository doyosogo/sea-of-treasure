import { useEffect, useState } from "react";
import { tradeGoods } from "../data/tradeGoods.js";
import {
  formatDuration,
  formatNumber,
  getCargoCapacity,
  getMarketCooldownRemaining,
  getTradeGoodBuyPrice,
  getTradeGoodSellPrice,
  getUsedCargo
} from "../utils/gameEngine.js";

function Port({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const usedCargo = getUsedCargo(gameState);
  const cargoCapacity = getCargoCapacity(gameState);
  const cooldownRemaining = getMarketCooldownRemaining(gameState, now);
  const tradingLevel = gameState.skills.trading?.level ?? 1;
  const tradeAllowanceRemaining = Math.max(0, gameState.marketTradeLimit - gameState.marketTradeUsed);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section className="port-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Port Market</p>
          <h1>Port</h1>
        </div>
        <div className="resource-cluster">
          <span className="resource-counter">{formatNumber(gameState.gold)} Gold</span>
          <span className="resource-counter">
            Cargo {formatNumber(usedCargo)} / {formatNumber(cargoCapacity)}
          </span>
        </div>
      </div>

      <article className="pixel-panel market-overview">
        <h2>Market Cycle</h2>
        <div className="summary-stat-grid">
          <div className="stat-box">
            <span>Trading Level</span>
            <strong>{tradingLevel}</strong>
          </div>
          <div className="stat-box">
            <span>Time Until Next Market Cycle</span>
            <strong>{cooldownRemaining > 0 ? formatDuration(cooldownRemaining) : "Ready"}</strong>
          </div>
          <div className="stat-box">
            <span>Trade Allowance Used</span>
            <strong>
              {formatNumber(gameState.marketTradeUsed)} / {formatNumber(gameState.marketTradeLimit)}
            </strong>
          </div>
          <div className="stat-box">
            <span>Cargo Space</span>
            <strong>{formatNumber(cargoCapacity - usedCargo)}</strong>
          </div>
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

      <div className="market-grid">
        {tradeGoods.map((good) => {
          const buyPrice = getTradeGoodBuyPrice(gameState, good);
          const sellPrice = getTradeGoodSellPrice(gameState, good);
          const owned = gameState.cargo[good.id] ?? 0;
          const freeCargo = cargoCapacity - usedCargo;

          return (
            <article className="pixel-panel market-card" key={good.id}>
              <div className="market-card-header">
                <h2>{good.name}</h2>
                <span className={sellPrice > buyPrice ? "profit-pill positive" : "profit-pill"}>
                  {sellPrice > buyPrice ? "Profit" : "Thin Margin"}
                </span>
              </div>

              <div className="market-price-grid">
                <div className="resource-row">
                  <span>Buy Price</span>
                  <strong>{formatNumber(buyPrice)}</strong>
                </div>
                <div className="resource-row">
                  <span>Sell Price</span>
                  <strong>{formatNumber(sellPrice)}</strong>
                </div>
                <div className="resource-row">
                  <span>Owned</span>
                  <strong>{formatNumber(owned)}</strong>
                </div>
              </div>

              <div className="trade-button-grid">
                <button
                  className="chunky-button buy-button"
                  disabled={gameState.gold < buyPrice || freeCargo < 1 || tradeAllowanceRemaining < 1}
                  onClick={() => dispatch({ type: "BUY_GOODS", goodId: good.id, quantity: 1 })}
                  type="button"
                >
                  Buy 1
                </button>
                <button
                  className="chunky-button buy-button"
                  disabled={gameState.gold < buyPrice * 10 || freeCargo < 10 || tradeAllowanceRemaining < 10}
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
    </section>
  );
}

export default Port;
