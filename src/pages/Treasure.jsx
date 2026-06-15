import { useEffect, useState } from "react";
import { treasureSites } from "../data/treasures.js";
import { formatDuration, formatNumber, getTalentBonuses } from "../utils/gameEngine.js";

function Treasure({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const treasureSkill = gameState.skills.treasureHunting;
  const activeSite = treasureSites.find((site) => site.id === gameState.activeTreasureDig?.siteId);
  const remainingMs = gameState.activeTreasureDig
    ? Math.max(0, gameState.activeTreasureDig.finishesAt - now)
    : 0;
  const isReady = Boolean(gameState.activeTreasureDig && remainingMs <= 0);
  const talentBonuses = getTalentBonuses(gameState);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section className="treasure-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Buried Riches</p>
          <h1>Treasure</h1>
        </div>
        <div className="resource-cluster">
          <span className="resource-counter">{formatNumber(gameState.treasureMaps)} Maps</span>
          <span className="resource-counter">Treasure Hunting Level {treasureSkill.level}</span>
        </div>
      </div>

      <article className="pixel-panel active-dig-panel">
        <p className="shop-note">
          Treasure maps are recovered from defeated ships. Sink enemies manually, idle at sea,
          or return from offline voyages to find more.
        </p>
      </article>

      <article className="pixel-panel active-dig-panel">
        <div>
          <h2>Active Dig</h2>
          {activeSite ? (
            <p className="shop-note">
              {activeSite.name} - {isReady ? "Ready to complete" : `${formatDuration(remainingMs)} remaining`}
            </p>
          ) : (
            <p className="shop-note">No treasure dig underway.</p>
          )}
        </div>
        <div className="button-row">
          <button
            className="chunky-button primary"
            disabled={!isReady}
            onClick={() => dispatch({ type: "COMPLETE_TREASURE_DIG" })}
            type="button"
          >
            Complete Dig
          </button>
          <button
            className="chunky-button danger"
            disabled={!gameState.activeTreasureDig}
            onClick={() => dispatch({ type: "CANCEL_TREASURE_DIG" })}
            type="button"
          >
            Cancel Dig
          </button>
        </div>
      </article>

      <div className="treasure-site-grid">
        {treasureSites.map((site) => {
          const locked = treasureSkill.level < site.requiredSkillLevel;
          const notEnoughMaps = gameState.treasureMaps < site.mapCost;
          const hasActiveDig = Boolean(gameState.activeTreasureDig);
          const rareChance = site.rareChance * talentBonuses.treasureChanceMultiplier;

          return (
            <article className={locked ? "pixel-panel treasure-site-card locked" : "pixel-panel treasure-site-card"} key={site.id}>
              <div className="market-card-header">
                <h2>{site.name}</h2>
                <span className={locked ? "ship-status locked" : "ship-status active"}>
                  Level {site.requiredSkillLevel}
                </span>
              </div>
              <div className="ship-meta-list">
                <div>
                  <span>Duration</span>
                  <strong>{formatDuration(site.durationSeconds * 1000)}</strong>
                </div>
                <div>
                  <span>Map Cost</span>
                  <strong>{site.mapCost}</strong>
                </div>
                <div>
                  <span>Gold Range</span>
                  <strong>{formatNumber(site.goldMin)}-{formatNumber(site.goldMax)}</strong>
                </div>
                <div>
                  <span>XP Reward</span>
                  <strong>{formatNumber(site.xpReward)}</strong>
                </div>
                <div>
                  <span>Rare Chance</span>
                  <strong>{formatNumber(rareChance * 100)}%</strong>
                </div>
              </div>
              <button
                className="chunky-button primary"
                disabled={locked || notEnoughMaps || hasActiveDig}
                onClick={() => dispatch({ type: "START_TREASURE_DIG", siteId: site.id })}
                type="button"
              >
                Start Dig
              </button>
            </article>
          );
        })}
      </div>

      <article className="pixel-panel treasure-inventory-panel">
        <h2>Rare Finds</h2>
        {gameState.treasureInventory.length > 0 ? (
          <div className="rare-item-grid">
            {gameState.treasureInventory.map((item) => (
              <div className="rare-item-card" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.rarity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="shop-note">No rare treasures found yet.</p>
        )}
      </article>
    </section>
  );
}

export default Treasure;
