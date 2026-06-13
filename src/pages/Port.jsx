import { formatNumber, getCurrentCannon } from "../utils/gameEngine.js";

function Port({ gameState, dispatch }) {
  const currentCannon = getCurrentCannon(gameState);
  const canBuyCannonballs = gameState.gold >= currentCannon.goldPer100Balls;

  return (
    <section className="port-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Harbour Shop</p>
          <h1>Port</h1>
        </div>
        <div className="status-pill active">{formatNumber(gameState.gold)} Gold</div>
      </div>

      <div className="shop-grid">
        <article className="pixel-panel shop-card">
          <h2>Cannonballs</h2>
          <div className="resource-row">
            <span>Owned</span>
            <strong>{formatNumber(gameState.cannonballs)}</strong>
          </div>
          <div className="resource-row">
            <span>Current Cannon</span>
            <strong>{currentCannon.name}</strong>
          </div>
          <div className="resource-row">
            <span>Cost / 100</span>
            <strong>{formatNumber(currentCannon.goldPer100Balls)} Gold</strong>
          </div>
          <button
            className="chunky-button primary"
            disabled={!canBuyCannonballs}
            onClick={() => dispatch({ type: "BUY_CANNONBALLS" })}
            type="button"
          >
            Buy 100 Cannonballs
          </button>
        </article>

        <article className="pixel-panel shop-card">
          <h2>Coming Later</h2>
          <p className="shop-note">More port systems will come later.</p>
        </article>
      </div>
    </section>
  );
}

export default Port;
