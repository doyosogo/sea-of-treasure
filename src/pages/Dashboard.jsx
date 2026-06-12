import { useState } from "react";
import {
  calcGoldPerHour,
  calcXpPerHour,
  formatNumber,
  getCurrentShip,
  getXpRequired
} from "../utils/gameEngine.js";

function Dashboard({ gameState, dispatch }) {
  const [activityLog, setActivityLog] = useState([]);
  const currentShip = getCurrentShip(gameState);
  const xpRequired = getXpRequired(gameState.playerLevel);
  const xpProgress = xpRequired === Infinity ? 100 : (gameState.playerXP / xpRequired) * 100;

  function handleManualSink() {
    dispatch({ type: "GAIN_GOLD", amount: currentShip.goldPerShip });
    dispatch({ type: "GAIN_XP", amount: 5 });
    setActivityLog((entries) => [
      `Sank an enemy ship: +5 XP, +${formatNumber(currentShip.goldPerShip)} gold`,
      ...entries
    ].slice(0, 5));
  }

  return (
    <section className="dashboard">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Idle Pirate Game</p>
          <h1>Sea of Treasure</h1>
        </div>
        <div className={gameState.isIdling ? "status-pill active" : "status-pill"}>
          {gameState.isIdling ? "Idling" : "Docked"}
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="pixel-panel captain-card">
          <h2>Captain</h2>
          <div className="level-row">
            <span>Level {gameState.playerLevel}</span>
            <span>
              {formatNumber(gameState.playerXP)} / {formatNumber(xpRequired)} XP
            </span>
          </div>
          <div className="progress-track" aria-label="XP progress">
            <div className="progress-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
          </div>
          <div className="stat-grid">
            <div className="stat-box">
              <span>Gold</span>
              <strong>{formatNumber(gameState.gold)}</strong>
            </div>
            <div className="stat-box">
              <span>Talent Points</span>
              <strong>{formatNumber(gameState.talentPoints)}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel ship-card">
          <h2>Current Voyage</h2>
          <div className="info-list">
            <div>
              <span>Ship</span>
              <strong>{currentShip.name}</strong>
            </div>
            <div>
              <span>Map</span>
              <strong>{currentShip.mapName}</strong>
            </div>
            <div>
              <span>Cannons</span>
              <strong>{currentShip.cannons}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel rates-card">
          <h2>Idle Rates</h2>
          <div className="stat-grid three-up">
            <div className="stat-box">
              <span>Ships / Hour</span>
              <strong>{formatNumber(currentShip.shipsPerHour)}</strong>
            </div>
            <div className="stat-box">
              <span>Gold / Hour</span>
              <strong>{formatNumber(calcGoldPerHour(gameState))}</strong>
            </div>
            <div className="stat-box">
              <span>XP / Hour</span>
              <strong>{formatNumber(calcXpPerHour(gameState))}</strong>
            </div>
          </div>
        </article>

        <article className="pixel-panel controls-card">
          <h2>Actions</h2>
          <div className="button-row">
            <button
              className="chunky-button primary"
              disabled={gameState.isIdling}
              onClick={() => dispatch({ type: "START_IDLE" })}
              type="button"
            >
              Start Idling
            </button>
            <button
              className="chunky-button"
              disabled={!gameState.isIdling}
              onClick={() => dispatch({ type: "STOP_IDLE" })}
              type="button"
            >
              Stop Idling
            </button>
            <button className="chunky-button danger" onClick={handleManualSink} type="button">
              Sink Enemy Ship
            </button>
          </div>
        </article>

        <article className="pixel-panel log-card">
          <h2>Activity Log</h2>
          {activityLog.length > 0 ? (
            <ul className="activity-log">
              {activityLog.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-log">No ships sunk yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
