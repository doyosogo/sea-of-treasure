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
    <section className="talents-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Permanent Upgrades</p>
          <h1>Talents</h1>
        </div>
        <span className="resource-counter">{formatNumber(gameState.talentPoints)} Talent Points</span>
      </div>

      <div className="talent-tree-grid">
        {talentTrees.map((tree) => (
          <section className="pixel-panel talent-tree" key={tree.id}>
            <h2>{tree.name}</h2>

            {tiers.map((tier) => {
              const tierTalents = talents.filter((talent) => talent.tree === tree.id && talent.tier === tier);

              return (
                <div className="talent-tier" key={`${tree.id}-${tier}`}>
                  <h3>Tier {tier}</h3>
                  <div className="talent-card-grid">
                    {tierTalents.map((talent) => {
                      const points = gameState.talents[talent.id] ?? 0;
                      const maxed = points >= talent.maxPoints;
                      const requirementsMet = talent.requires.every((requirement) => (
                        (gameState.talents[requirement.id] ?? 0) >= requirement.points
                      ));
                      const canSpend = canSpendTalentPoint(gameState, talent);
                      const cardClassName = [
                        "talent-card",
                        !requirementsMet ? "locked" : "",
                        maxed ? "maxed" : ""
                      ].filter(Boolean).join(" ");

                      return (
                        <article className={cardClassName} key={talent.id}>
                          <div className="talent-card-header">
                            <h4>{talent.name}</h4>
                            <span>{points} / {talent.maxPoints}</span>
                          </div>
                          <p>{talent.description}</p>
                          <div className="talent-requirement">
                            <span>Requires</span>
                            <strong>{getRequirementText(talent)}</strong>
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
    </section>
  );
}

export default Talents;
