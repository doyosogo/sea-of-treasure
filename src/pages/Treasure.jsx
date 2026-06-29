import { useEffect, useState } from "react";
import { LOGO, RESOURCE_ICONS, SCENES, UI_GOLD, UI_TREASURE_MAPS, UI_XP } from "../data/assets.js";
import Tooltip from "../components/Tooltip.jsx";
import { treasureSites } from "../data/treasures.js";
import { formatDuration, formatNumber, getActiveWorldEvent, getTalentBonuses } from "../utils/gameEngine.js";

function Treasure({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const treasureSkill = gameState.skills.treasureHunting;
  const activeSite = treasureSites.find((site) => site.id === gameState.activeTreasureDig?.siteId);
  const activeWorldEvent = getActiveWorldEvent(gameState);
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
            <StatChip icon={UI_TREASURE_MAPS} label="Treasure Maps" value={formatNumber(gameState.treasureMaps)} tooltip="Treasure maps are recovered from combat and used to start treasure digs." />
            <StatChip icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} tooltip="Rare Map Pieces are uncommon loot used for later progression." />
          </div>
        </header>

        {activeWorldEvent?.id === "treasureFleet" ? (
          <article className="treasure-panel treasure-event-banner">
            <div className="panel-heading-row">
              <h2>World Event</h2>
              <span className="resource-counter">{activeWorldEvent.name}</span>
            </div>
            <p className="treasure-empty-text">{activeWorldEvent.description}</p>
            <p className="treasure-empty-text">{describeWorldEventEffects(activeWorldEvent)}</p>
          </article>
        ) : null}

        <section className="treasure-grid treasure-overview-grid">
          <article className="treasure-panel">
            <h2>Treasure Overview</h2>
            <div className="treasure-stat-grid">
              <Metric icon={UI_TREASURE_MAPS} label="Treasure Maps Owned" value={formatNumber(gameState.treasureMaps)} tooltip="Treasure maps are recovered from combat and spent to begin treasure digs." />
              <Metric icon={RESOURCE_ICONS.rareMapPiece} label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} tooltip="Rare Map Pieces are very uncommon loot used for later progression." />
              <Metric icon={UI_XP} label="Treasure Hunting Level" value={formatNumber(treasureSkill.level)} tooltip="Treasure Hunting skill level unlocks longer and more rewarding dig sites." />
              <Metric icon={UI_GOLD} label="Rare Finds" value={formatNumber(treasureCount)} tooltip="Rare finds are special treasures uncovered by your crew." />
            </div>
            {gameState.treasureMaps <= 0 ? (
              <div className="treasure-empty-state treasure-note">
                <strong>No treasure maps on hand.</strong>
                <p>Earn more from combat or events, then return here to start a new dig.</p>
              </div>
            ) : null}
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
                  <Metric icon={UI_TREASURE_MAPS} label="Map Cost" value={activeSite.mapCost} tooltip="Treasure maps are consumed when a dig starts." />
                  <Metric icon={UI_GOLD} label="Gold Range" value={`${formatNumber(activeSite.goldMin)} - ${formatNumber(activeSite.goldMax)}`} tooltip="The amount of gold you can uncover from this dig site." />
                  <Metric icon={UI_XP} label="XP Reward" value={formatNumber(activeSite.xpReward)} tooltip="Treasure Hunting XP awarded when the dig completes." />
                  <Metric icon={UI_GOLD} label="Rare Chance" value={`${formatNumber(activeSite.rareChance * treasureChanceMultiplier * 100)}%`} tooltip="Chance to uncover a rare treasure item at this dig site." />
                </div>
              </div>
            ) : (
              <div className="treasure-empty-state">
                <strong>No active dig</strong>
                <p>Pick a dig site below to send your crew searching for buried fortunes.</p>
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
                      <TreasureRow label="Duration" value={formatDuration(site.durationSeconds * 1000)} tooltip="How long your crew needs to complete this dig." />
                      <TreasureRow label="Map Cost" value={site.mapCost} tooltip="Treasure maps are consumed when the dig starts." />
                      <TreasureRow label="Gold Range" value={`${formatNumber(site.goldMin)} - ${formatNumber(site.goldMax)}`} tooltip="Possible gold range from this site." />
                      <TreasureRow label="XP Reward" value={formatNumber(site.xpReward)} tooltip="Treasure Hunting XP gained when the dig completes." />
                      <TreasureRow label="Rare Chance" value={`${formatNumber(rareChance * 100)}%`} tooltip="Chance to uncover a rare treasure item." />
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
                <strong>No rare finds yet.</strong>
                <p>Rare treasures will appear here once your crew uncovers them.</p>
              </div>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}

function StatChip({ icon, label, value, tooltip }) {
  const content = (
    <div className="treasure-chip">
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

function Metric({ icon, label, value, tooltip }) {
  const content = (
    <div className="treasure-metric">
      {icon ? <img alt={label} className="treasure-metric-icon" src={icon} /> : null}
      <div className="treasure-metric-copy">
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

function TreasureRow({ label, value, tooltip }) {
  const content = (
    <div className="treasure-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  return tooltip ? (
    <Tooltip label={label} text={tooltip}>
      {content}
    </Tooltip>
  ) : content;
}

function describeWorldEventEffects(event) {
  if ((event.effects?.treasureMapDropMultiplier ?? 1) > 1) {
    return `Treasure map drops +${Math.round((event.effects.treasureMapDropMultiplier - 1) * 100)}%`;
  }

  return "Temporary world modifiers are active.";
}

export default Treasure;
