import { useEffect, useState } from "react";
import { LOGO, RESOURCE_ICONS, SCENES, UI_GOLD, UI_TREASURE_MAPS, UI_XP } from "../data/assets.js";
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
  const treasureChanceMultiplier = getTalentBonuses(gameState).treasureChanceMultiplier ?? 1;
  const treasureCount = gameState.treasureInventory?.length ?? 0;

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section
      className="treasure-page treasure-scene treasure-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.68)), url(${SCENES.treasure})`
      }}
    >
      <div className="treasure-overlay" aria-hidden="true" />

      <div className="treasure-shell">
        <header className="treasure-topbar">
          <img alt="Sea of Treasure logo" className="treasure-logo" src={LOGO} />
          <div className="treasure-title-copy">
            <p className="eyebrow">Treasure Vault</p>
            <h1>Treasure Vault</h1>
            <p>Spend treasure maps, recover rare relics, and uncover forgotten fortunes.</p>
          </div>
          <div className="treasure-top-stats">
            <StatChip icon={UI_TREASURE_MAPS} label="Treasure Maps" value={formatNumber(gameState.treasureMaps)} />
            <StatChip icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
          </div>
        </header>

        <section className="treasure-grid treasure-overview-grid">
          <article className="treasure-panel">
            <h2>Treasure Overview</h2>
            <div className="treasure-stat-grid">
              <Metric icon={UI_TREASURE_MAPS} label="Treasure Maps Owned" value={formatNumber(gameState.treasureMaps)} />
              <Metric icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
              <Metric icon={UI_XP} label="Treasure Hunting Level" value={formatNumber(treasureSkill.level)} />
              <Metric icon={UI_GOLD} label="Rare Finds" value={formatNumber(treasureCount)} />
            </div>
          </article>

          <article className="treasure-panel treasure-active-panel">
            <h2>Active Dig</h2>
            {activeSite ? (
              <div className="treasure-active-layout">
                <div className="treasure-active-contract">
                  <span className="treasure-contract-label">{activeSite.name}</span>
                  <strong>{isReady ? "Ready to complete" : formatDuration(remainingMs)}</strong>
                  <p>{isReady ? "Your crew is waiting on your command." : "The crew is still digging through the sand."}</p>
                </div>
                <div className="treasure-active-stats">
                  <Metric icon={UI_TREASURE_MAPS} label="Map Cost" value={activeSite.mapCost} />
                  <Metric icon={UI_GOLD} label="Gold Range" value={`${formatNumber(activeSite.goldMin)} - ${formatNumber(activeSite.goldMax)}`} />
                  <Metric icon={UI_XP} label="XP Reward" value={formatNumber(activeSite.xpReward)} />
                  <Metric icon={UI_GOLD} label="Rare Chance" value={`${formatNumber(activeSite.rareChance * treasureChanceMultiplier * 100)}%`} />
                </div>
              </div>
            ) : (
              <div className="treasure-empty-state">
                <strong>No active dig</strong>
                <p>Select a dig site below and send your crew searching for buried fortunes.</p>
              </div>
            )}
            <div className="treasure-button-row">
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
        </section>

        <section className="treasure-grid treasure-sites-grid">
          <article className="treasure-panel treasure-contracts-panel">
            <h2>Dig Sites</h2>
            <div className="treasure-site-grid">
              {treasureSites.map((site) => {
                const locked = treasureSkill.level < site.requiredSkillLevel;
                const notEnoughMaps = gameState.treasureMaps < site.mapCost;
                const hasActiveDig = Boolean(gameState.activeTreasureDig);
                const rareChance = site.rareChance * treasureChanceMultiplier;

                return (
                  <article className={locked ? "treasure-site-card locked" : "treasure-site-card"} key={site.id}>
                    <div className="treasure-card-heading">
                      <h3>{site.name}</h3>
                      <span className={locked ? "ship-status locked" : "ship-status active"}>
                        Level {site.requiredSkillLevel}
                      </span>
                    </div>
                    <div className="treasure-contract-grid">
                      <TreasureRow label="Duration" value={formatDuration(site.durationSeconds * 1000)} />
                      <TreasureRow label="Map Cost" value={site.mapCost} />
                      <TreasureRow label="Gold Range" value={`${formatNumber(site.goldMin)} - ${formatNumber(site.goldMax)}`} />
                      <TreasureRow label="XP Reward" value={formatNumber(site.xpReward)} />
                      <TreasureRow label="Rare Chance" value={`${formatNumber(rareChance * 100)}%`} />
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
          </article>

          <article className="treasure-panel treasure-finds-panel">
            <h2>Rare Finds</h2>
            {treasureCount > 0 ? (
              <div className="rare-item-grid">
                {gameState.treasureInventory.map((item) => (
                  <div className="rare-item-card" key={item.id}>
                    <strong>{item.name}</strong>
                    <span>{item.rarity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="treasure-empty-state chest-state">
                <strong>An empty chest rests here.</strong>
                <p>Rare treasures will appear here once your crew uncovers them.</p>
              </div>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="treasure-chip">
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
    <div className="treasure-metric">
      {icon ? <img alt={label} className="treasure-metric-icon" src={icon} /> : null}
      <div className="treasure-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function TreasureRow({ label, value }) {
  return (
    <div className="treasure-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Treasure;
