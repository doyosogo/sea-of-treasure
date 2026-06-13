import { ships } from "../data/ships.js";
import { formatNumber, getCurrentShip } from "../utils/gameEngine.js";

function getShipState(ship, gameState) {
  const isOwned = gameState.ownedShips.includes(ship.id);
  const isActive = gameState.currentShipId === ship.id;
  const levelLocked = gameState.playerLevel < ship.level;
  const unaffordable = gameState.gold < ship.purchaseCost;

  if (isActive) {
    return "active";
  }

  if (isOwned) {
    return "owned";
  }

  if (levelLocked) {
    return "locked";
  }

  if (unaffordable) {
    return "unaffordable";
  }

  return "available";
}

function getStatusLabel(shipState) {
  const labels = {
    active: "Active",
    owned: "Owned",
    available: "Available",
    locked: "Locked by Level",
    unaffordable: "Not Enough Gold"
  };

  return labels[shipState];
}

function Fleet({ gameState, dispatch }) {
  const activeShip = getCurrentShip(gameState);

  return (
    <section className="fleet-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Fleet Command</p>
          <h1>Fleet</h1>
        </div>
        <div className="status-pill active">{formatNumber(gameState.gold)} Gold</div>
      </div>

      <article className="pixel-panel active-ship-panel">
        <div>
          <p className="eyebrow">Current Active Ship</p>
          <h2>{activeShip.name}</h2>
        </div>
        <div className="fleet-stat-grid">
          <div className="stat-box">
            <span>Level Required</span>
            <strong>{activeShip.level}</strong>
          </div>
          <div className="stat-box">
            <span>Map</span>
            <strong>{activeShip.mapName}</strong>
          </div>
          <div className="stat-box">
            <span>Cannons</span>
            <strong>{activeShip.cannons}</strong>
          </div>
          <div className="stat-box">
            <span>Ships / Hour</span>
            <strong>{formatNumber(activeShip.shipsPerHour)}</strong>
          </div>
          <div className="stat-box">
            <span>Gold / Ship</span>
            <strong>{formatNumber(activeShip.goldPerShip)}</strong>
          </div>
          <div className="stat-box">
            <span>Gold / Hour</span>
            <strong>{formatNumber(activeShip.goldPerShip * activeShip.shipsPerHour)}</strong>
          </div>
        </div>
      </article>

      <div className="ship-grid">
        {ships.map((ship) => {
          const shipState = getShipState(ship, gameState);
          const cardClassName = `pixel-panel fleet-ship-card ${shipState}`;
          const canBuy = shipState === "available";
          const canActivate = shipState === "owned";

          return (
            <article className={cardClassName} key={ship.id}>
              <div className="ship-card-header">
                <div>
                  <p className="ship-tier">Level {ship.level}</p>
                  <h2>{ship.name}</h2>
                </div>
                <span className={`ship-status ${shipState}`}>{getStatusLabel(shipState)}</span>
              </div>

              <div className="ship-meta-list">
                <div>
                  <span>Map</span>
                  <strong>{ship.mapName}</strong>
                </div>
                <div>
                  <span>Cannons</span>
                  <strong>{ship.cannons}</strong>
                </div>
                <div>
                  <span>Ships / Hour</span>
                  <strong>{formatNumber(ship.shipsPerHour)}</strong>
                </div>
                <div>
                  <span>Gold / Ship</span>
                  <strong>{formatNumber(ship.goldPerShip)}</strong>
                </div>
                <div>
                  <span>Purchase Cost</span>
                  <strong>{formatNumber(ship.purchaseCost)}</strong>
                </div>
              </div>

              <div className="ship-actions">
                {shipState === "active" ? (
                  <span className="active-ship-label">Active Ship</span>
                ) : (
                  <>
                    {!gameState.ownedShips.includes(ship.id) && (
                      <button
                        className="chunky-button primary"
                        disabled={!canBuy}
                        onClick={() => dispatch({ type: "BUY_SHIP", shipId: ship.id })}
                        type="button"
                      >
                        Buy Ship
                      </button>
                    )}
                    {gameState.ownedShips.includes(ship.id) && (
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
    </section>
  );
}

export default Fleet;
