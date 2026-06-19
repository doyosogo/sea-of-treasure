import { SCENES, SHIP_IMAGES, UI_ICONS } from "../data/assets.js";
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
    <section
      className="fleet-page shipyard-scene shipyard-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.shipyard})`
      }}
    >
      <div className="shipyard-overlay" aria-hidden="true" />
      <div className="shipyard-shell">
        <header className="shipyard-topbar">
          <img alt="Sea of Treasure logo" className="shipyard-logo" src="/assets/logo/LOGO.png" />
          <div className="shipyard-title-copy">
            <p className="eyebrow">Shipyard</p>
            <h1>Shipyard</h1>
            <p>Buy ships, inspect your fleet, and prepare for longer voyages.</p>
          </div>
          <div className="status-pill active">{formatNumber(gameState.gold)} Gold</div>
        </header>

        <section className="shipyard-main-grid">
          <article className="shipyard-panel shipyard-active-panel">
            <div className="panel-heading-row">
              <h2>Current Active Ship</h2>
              <span className="resource-counter">{activeShip.mapName}</span>
            </div>
            <div className="shipyard-active-layout">
              <div className="shipyard-ship-frame">
                <img alt={activeShip.name} className="shipyard-active-image" src={SHIP_IMAGES[activeShip.id]} />
              </div>
              <div className="shipyard-active-copy">
                <h3>{activeShip.name}</h3>
                <p>Fleet is used to buy and activate ships. Use My Ship to inspect your current ship stats and upgrades.</p>
                <div className="shipyard-active-stats">
                  <Metric icon={UI_ICONS.talentPoints} label="Level Required" value={activeShip.level} />
                  <Metric icon={UI_ICONS.cannonballs} label="Cannons" value={formatNumber(activeShip.cannons)} />
                  <Metric icon={UI_ICONS.gold} label="Ships / Hour" value={formatNumber(activeShip.shipsPerHour)} />
                  <Metric icon={UI_ICONS.gold} label="Gold / Ship" value={formatNumber(activeShip.goldPerShip)} />
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="shipyard-grid">
          {ships.map((ship) => {
            const shipState = getShipState(ship, gameState);
            const isOwned = gameState.ownedShips.includes(ship.id);
            const canBuy = shipState === "available";
            const canActivate = shipState === "owned";

            return (
              <article className={`shipyard-card ${shipState}`} key={ship.id}>
                <div className="shipyard-card-image-frame">
                  <img alt={ship.name} className="shipyard-card-image" src={SHIP_IMAGES[ship.id]} />
                </div>
                <div className="ship-card-header shipyard-card-header">
                  <div>
                    <p className="ship-tier">Level {ship.level}</p>
                    <h2>{ship.name}</h2>
                  </div>
                  <span className={`ship-status ${shipState}`}>{getStatusLabel(shipState)}</span>
                </div>

                <div className="shipyard-card-stats">
                  <Metric icon={UI_ICONS.hull} label="Map" value={ship.mapName} />
                  <Metric icon={UI_ICONS.cannonballs} label="Cannons" value={formatNumber(ship.cannons)} />
                  <Metric icon={UI_ICONS.gold} label="Ships / Hour" value={formatNumber(ship.shipsPerHour)} />
                  <Metric icon={UI_ICONS.gold} label="Gold / Ship" value={formatNumber(ship.goldPerShip)} />
                  <Metric icon={UI_ICONS.gold} label="Purchase Cost" value={formatNumber(ship.purchaseCost)} />
                </div>

                <div className="shipyard-actions">
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
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="shipyard-metric">
      {icon ? <img alt={label} className="shipyard-metric-icon" src={icon} /> : null}
      <div className="shipyard-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Fleet;
