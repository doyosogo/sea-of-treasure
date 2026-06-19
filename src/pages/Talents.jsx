import { SCENES, TALENT_ICONS, UI_TALENT_POINTS } from "../data/assets.js";
import { talents, talentTrees } from "../data/talents.js";
import { canSpendTalentPoint, formatNumber } from "../utils/gameEngine.js";

function getRequirementText(talent) {
  if (talent.requires.length === 0) {
    return "No requirement";
  }

  return talent.requires
    .map((requirement) => {
      const requiredTalent = talents.find((talentData) => talentData.id === requirement.id);
      return `${requirement.points} points in ${requiredTalent?.name ?? requirement.id}`;
    })
    .join(", ");
}

function Talents({ gameState, dispatch }) {
  const tiers = [1, 2, 3];

  return (
    <section
      className="talents-page academy-scene academy-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.academy})`
      }}
    >
      <div className="academy-overlay" aria-hidden="true" />
      <div className="academy-shell">
        <header className="academy-topbar">
          <img alt="Sea of Treasure logo" className="academy-logo" src="/assets/logo/LOGO.png" />
          <div className="academy-title-copy">
            <p className="eyebrow">Captain Talents</p>
            <h1>Captain Talents</h1>
            <p>Shape your leadership style and unlock powerful bonuses.</p>
          </div>
          <div className="resource-cluster">
            <span className="resource-counter">
              <img alt="Talent Points" className="academy-inline-icon" src={UI_TALENT_POINTS} />
              {formatNumber(gameState.talentPoints)} Talent Points
            </span>
          </div>
        </header>

        <section className="academy-summary-grid">
          <Metric icon={UI_TALENT_POINTS} label="Available Talent Points" value={formatNumber(gameState.talentPoints)} />
        </section>

        <div className="academy-tree-grid">
          {talentTrees.map((tree) => (
            <section className="academy-panel talent-tree" key={tree.id}>
              <h2>{tree.name}</h2>
              {tiers.map((tier) => {
                const tierTalents = talents.filter((talent) => talent.tree === tree.id && talent.tier === tier);

                return (
                  <div className="academy-tier" key={`${tree.id}-${tier}`}>
                    <h3>Tier {tier}</h3>
                    <div className="academy-card-grid">
                      {tierTalents.map((talent) => {
                        const points = gameState.talents[talent.id] ?? 0;
                        const maxed = points >= talent.maxPoints;
                        const requirementsMet = talent.requires.every((requirement) => (
                          (gameState.talents[requirement.id] ?? 0) >= requirement.points
                        ));
                        const canSpend = canSpendTalentPoint(gameState, talent);
                        const icon = TALENT_ICONS[talent.id];
                        const cardClassName = [
                          "academy-card",
                          "talent-academy-card",
                          !requirementsMet ? "locked" : "",
                          maxed ? "maxed" : ""
                        ].filter(Boolean).join(" ");

                        return (
                          <article className={cardClassName} key={talent.id}>
                            <div className="academy-card-hero">
                              <div className="academy-card-icon-frame">
                                {icon ? <img alt={talent.name} className="academy-card-icon" src={icon} /> : <span className="academy-icon-fallback" aria-hidden="true" />}
                              </div>
                              <div className="academy-card-header-copy">
                                <p className="academy-card-kicker">{tree.name} / Tier {tier}</p>
                                <h2>{talent.name}</h2>
                                <div className="academy-card-badges">
                                  <span className="academy-badge">{points} / {talent.maxPoints}</span>
                                  <span className="academy-badge">{talent.bonusType}</span>
                                </div>
                              </div>
                            </div>
                            <p className="academy-card-copy">{talent.description}</p>
                            <div className="academy-detail-grid">
                              <Detail label="Requirement" value={getRequirementText(talent)} />
                              <Detail label="Bonus / Point" value={talent.description} />
                              <Detail label="Status" value={maxed ? "Maxed" : requirementsMet ? "Ready" : "Locked"} />
                            </div>
                            <button
                              className="chunky-button primary"
                              disabled={!canSpend}
                              onClick={() => dispatch({ type: "SPEND_TALENT_POINT", talentId: talent.id })}
                              type="button"
                            >
                              {maxed ? "Maxed" : "Spend Point"}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, value, label }) {
  return (
    <div className="academy-metric">
      {icon ? <img alt={label} className="academy-metric-icon" src={icon} /> : null}
      <div className="academy-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="academy-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Talents;
