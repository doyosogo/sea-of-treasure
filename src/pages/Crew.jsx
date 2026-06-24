import { LOGO, RESOURCE_ICONS, SCENES, UI_GOLD, UI_XP } from "../data/assets.js";
import { crewMembers } from "../data/crew.js";
import Tooltip from "../components/Tooltip.jsx";
import {
  formatNumber,
  getCrewBonuses,
  getCrewUpgradeCost
} from "../utils/gameEngine.js";

function Crew({ gameState, dispatch }) {
  const crewBonuses = getCrewBonuses(gameState);
  const crewEntries = crewMembers.map((crewMember) => {
    const level = gameState.crew?.[crewMember.id]?.level ?? 1;
    const cost = getCrewUpgradeCost(crewMember, level);
    const maxed = level >= crewMember.maxLevel;
    const canAfford = canAffordUpgrade(gameState, cost);

    return {
      ...crewMember,
      level,
      cost,
      maxed,
      canAfford,
      currentBonus: getCrewBonusText(crewMember, level),
      nextBonus: maxed ? "Max level reached" : getCrewBonusText(crewMember, level + 1)
    };
  });
  const averageLevel = crewEntries.length > 0
    ? crewEntries.reduce((total, entry) => total + entry.level, 0) / crewEntries.length
    : 1;
  const highestCrewMember = crewEntries.reduce((best, entry) => {
    if (!best || entry.level > best.level) {
      return entry;
    }

    return best;
  }, null);

  return (
    <section
      className="crew-page academy-scene academy-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.academy})`
      }}
    >
      <div className="academy-overlay" aria-hidden="true" />
      <div className="academy-shell">
        <header className="academy-topbar">
          <img alt="Sea of Treasure logo" className="academy-logo" src={LOGO} />
          <div className="academy-title-copy">
            <p className="eyebrow">Crew</p>
            <h1>Crew</h1>
            <p>Train your officers and strengthen every part of your voyage.</p>
          </div>
          <div className="resource-cluster">
            <span className="resource-counter">{formatNumber(gameState.gold)} Gold</span>
            <span className="resource-counter">{formatNumber(gameState.talentPoints)} Talent Points</span>
          </div>
        </header>

        <section className="academy-summary-grid">
          <Metric icon={UI_XP} label="Crew Average Level" value={averageLevel.toFixed(1)} tooltip="Crew members gain levels from upgrades and provide passive account bonuses." />
          <Metric
            icon={UI_XP}
            label="Highest Crew Member"
            value={highestCrewMember ? `${highestCrewMember.name} Lv. ${highestCrewMember.level}` : "None"}
            tooltip="Your highest-trained officer."
          />
          <Metric icon={UI_GOLD} label="Combat Gold Bonus" value={`${formatNumber((crewBonuses.combatGoldMultiplier - 1) * 100)}%`} tooltip="Quartermaster levels increase combat gold gains." />
          <Metric icon={UI_GOLD} label="Combat XP Bonus" value={`${formatNumber((crewBonuses.combatXpMultiplier - 1) * 100)}%`} tooltip="Navigator levels increase combat XP gains." />
        </section>

        <section className="academy-card-grid crew-card-grid">
          {crewEntries.map((crewMember) => (
            <article
              className={`academy-card crew-card ${crewMember.maxed ? "maxed" : ""}`}
              key={crewMember.id}
            >
              <div className="academy-card-hero">
                <div className="academy-card-icon-frame">
                  <div className="crew-role-badge">{crewMember.role.slice(0, 1)}</div>
                </div>
                <div className="academy-card-header-copy">
                  <p className="academy-card-kicker">{crewMember.role}</p>
                  <h2>{crewMember.name}</h2>
                  <div className="academy-card-badges">
                    <span className="academy-badge">Lv. {formatNumber(crewMember.level)} / {crewMember.maxLevel}</span>
                    <span className="academy-badge">{crewMember.currentBonus}</span>
                  </div>
                </div>
              </div>

              <p className="academy-card-copy">{crewMember.description}</p>

              <div className="academy-detail-grid crew-detail-grid">
                <Detail label="Current Bonus" value={crewMember.currentBonus} tooltip="The bonus currently provided by this crew member." />
                <Detail label="Next Bonus" value={crewMember.nextBonus} tooltip="The bonus you will gain after the next upgrade." />
                <Detail label="Upgrade Cost" value={`${formatNumber(crewMember.cost.gold)} Gold`} tooltip="Crew upgrades cost gold plus matching materials." />
                <Detail label="Status" value={crewMember.maxed ? "Max Level" : crewMember.canAfford ? "Ready to Upgrade" : "Insufficient Resources"} tooltip="Shows whether this crew member can be upgraded right now." />
              </div>

              <div className="crew-cost-list">
                <CostRow icon={UI_GOLD} label="Gold" value={crewMember.cost.gold} />
                {Object.entries(crewMember.cost)
                  .filter(([resourceId, amount]) => resourceId !== "gold" && amount > 0)
                  .map(([resourceId, amount]) => (
                    <CostRow
                      icon={getCrewCostIcon(resourceId)}
                      key={resourceId}
                      label={formatLabel(resourceId)}
                      value={amount}
                    />
                  ))}
              </div>

              <div className="academy-actions">
                <button
                  className="chunky-button primary"
                  disabled={crewMember.maxed || !crewMember.canAfford}
                  onClick={() => dispatch({ type: "UPGRADE_CREW_MEMBER", crewId: crewMember.id })}
                  type="button"
                >
                  {crewMember.maxed ? "Maxed" : "Upgrade Crew"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}

function canAffordUpgrade(gameState, cost) {
  return (
    gameState.gold >= (cost.gold ?? 0) &&
    (gameState.materials?.navigationCharts ?? 0) >= (cost.navigationCharts ?? 0) &&
    (gameState.materials?.compassFragments ?? 0) >= (cost.compassFragments ?? 0) &&
    (gameState.materials?.gunpowder ?? 0) >= (cost.gunpowder ?? 0) &&
    (gameState.materials?.cannonParts ?? 0) >= (cost.cannonParts ?? 0) &&
    (gameState.materials?.ancientRelics ?? 0) >= (cost.ancientRelics ?? 0) &&
    (gameState.materials?.tradeContracts ?? 0) >= (cost.tradeContracts ?? 0) &&
    (gameState.materials?.tradeSeals ?? 0) >= (cost.tradeSeals ?? 0) &&
    (gameState.resources?.fish ?? 0) >= (cost.fish ?? 0) &&
    (gameState.resources?.whaleOil ?? 0) >= (cost.whaleOil ?? 0) &&
    (gameState.rareMapPieces ?? 0) >= (cost.rareMapPieces ?? 0)
  );
}

function getCrewBonusText(crewMember, level) {
  const bonusValue = Math.max(0, level) * crewMember.bonusPerLevel;

  switch (crewMember.bonusType) {
    case "combatXpMultiplier":
      return `+${formatNumber(bonusValue * 100)}% combat XP`;
    case "volleyDamageMultiplier":
      return `+${formatNumber(bonusValue * 100)}% volley damage`;
    case "repairCostMultiplier":
      return `-${formatNumber(Math.abs(bonusValue) * 100)}% repair cost`;
    case "combatGoldMultiplier":
      return `+${formatNumber(bonusValue * 100)}% combat gold`;
    case "tradeSellMultiplier":
      return `+${formatNumber(bonusValue * 100)}% trade sell value`;
    case "treasureChanceMultiplier":
      return `+${formatNumber(bonusValue * 100)}% treasure chance`;
    default:
      return "No bonus";
  }
}

function getCrewCostIcon(resourceId) {
  switch (resourceId) {
    case "navigationCharts":
      return RESOURCE_ICONS.navigationCharts;
    case "compassFragments":
      return RESOURCE_ICONS.compassFragments;
    case "gunpowder":
      return RESOURCE_ICONS.gunpowder;
    case "cannonParts":
      return RESOURCE_ICONS.cannonParts;
    case "ancientRelics":
      return RESOURCE_ICONS.ancientRelics;
    case "tradeContracts":
      return RESOURCE_ICONS.tradeContracts;
    case "tradeSeals":
      return RESOURCE_ICONS.tradeSeals;
    case "fish":
      return RESOURCE_ICONS.fish;
    case "whaleOil":
      return RESOURCE_ICONS.whaleOil;
    case "rareMapPieces":
      return RESOURCE_ICONS.rareMapPiece;
    default:
      return UI_GOLD;
  }
}

function formatLabel(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function Metric({ icon, label, value, tooltip }) {
  const content = (
    <div className="academy-metric">
      {icon ? <img alt={label} className="academy-metric-icon" src={icon} /> : null}
      <div className="academy-metric-copy">
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

function CostRow({ icon, label, value, tooltip }) {
  const content = (
    <div className="crew-cost-row">
      <div className="crew-cost-left">
        {icon ? <img alt={label} className="crew-cost-icon" src={icon} /> : null}
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );

  return tooltip ? (
    <Tooltip label={label} text={tooltip}>
      {content}
    </Tooltip>
  ) : content;
}

function Detail({ label, value, tooltip }) {
  const content = (
    <div className="academy-detail">
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

export default Crew;
