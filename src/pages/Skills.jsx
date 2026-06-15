import { useEffect, useState } from "react";
import { skills } from "../data/skills.js";
import { formatDuration, formatNumber } from "../utils/gameEngine.js";

function getSkillXpRequired(skillDefinition, skillState) {
  return skillState.level >= skillDefinition.maxLevel
    ? Infinity
    : skillDefinition.xpPerLevel[skillState.level - 1];
}

function Skills({ gameState, dispatch }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section className="skills-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Crew Training</p>
          <h1>Skills</h1>
        </div>
        <div className="resource-cluster">
          <span className="resource-counter">{formatNumber(gameState.gold)} Gold</span>
          <span className="resource-counter">{formatNumber(gameState.talentPoints)} Talent Points</span>
        </div>
      </div>

      <div className="skill-grid">
        {skills.map((skill) => {
          const skillState = gameState.skills[skill.id];
          const xpRequired = getSkillXpRequired(skill, skillState);
          const xpProgress = xpRequired === Infinity ? 100 : (skillState.xp / xpRequired) * 100;
          const remainingMs = Math.max(0, skillState.finishesAt - now);
          const isFinished = skillState.active && remainingMs <= 0;
          const canStart =
            !skillState.active &&
            skillState.level < skill.maxLevel &&
            gameState.gold >= skill.goldCostPerAction;
          const cardClassName = `pixel-panel skill-card${skillState.active ? " active" : ""}${isFinished ? " complete-ready" : ""}`;

          return (
            <article className={cardClassName} key={skill.id}>
              <div className="skill-card-header">
                <div>
                  <p className="ship-tier">{skill.unlockText}</p>
                  <h2>{skill.name}</h2>
                </div>
                <span className={isFinished ? "ship-status active" : "ship-status"}>
                  Level {skillState.level}
                </span>
              </div>

              <div className="level-row">
                <span>
                  {skillState.level >= skill.maxLevel
                    ? "Max Level"
                    : `${formatNumber(skillState.xp)} / ${formatNumber(xpRequired)} XP`}
                </span>
              </div>
              <div className="progress-track" aria-label={`${skill.name} XP progress`}>
                <div className="progress-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
              </div>

              <p className="skill-description">{skill.description}</p>
              {skill.id === "treasureHunting" && (
                <p className="skill-note">Advanced treasure digs are available in the Treasure section.</p>
              )}

              <div className="ship-meta-list">
                <div>
                  <span>Action</span>
                  <strong>{skill.actionName}</strong>
                </div>
                <div>
                  <span>Gold Cost</span>
                  <strong>{formatNumber(skill.goldCostPerAction)}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{formatDuration(skill.actionTimeSeconds * 1000)}</strong>
                </div>
                <div>
                  <span>Reward</span>
                  <strong>{skill.rewardType}</strong>
                </div>
              </div>

              {skillState.active && (
                <div className={isFinished ? "skill-timer ready" : "skill-timer"}>
                  {isFinished ? "Ready to Complete" : `${formatDuration(remainingMs)} remaining`}
                </div>
              )}

              <div className="skill-actions">
                {!skillState.active && (
                  <button
                    className="chunky-button primary"
                    disabled={!canStart}
                    onClick={() => dispatch({ type: "START_SKILL_ACTION", skillId: skill.id })}
                    type="button"
                  >
                    Start
                  </button>
                )}
                {skillState.active && !isFinished && (
                  <button
                    className="chunky-button danger"
                    onClick={() => dispatch({ type: "CANCEL_SKILL_ACTION", skillId: skill.id })}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
                {isFinished && (
                  <>
                    <button
                      className="chunky-button primary"
                      onClick={() => dispatch({ type: "COMPLETE_SKILL_ACTION", skillId: skill.id })}
                      type="button"
                    >
                      Complete
                    </button>
                    <button
                      className="chunky-button danger"
                      onClick={() => dispatch({ type: "CANCEL_SKILL_ACTION", skillId: skill.id })}
                      type="button"
                    >
                      Cancel
                    </button>
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

export default Skills;
