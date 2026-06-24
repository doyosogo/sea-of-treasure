import { useEffect, useState } from "react";
import { SCENES, SKILL_ICONS, UI_XP, UI_TALENT_POINTS } from "../data/assets.js";
import { skills } from "../data/skills.js";
import { formatDuration, formatNumber } from "../utils/gameEngine.js";

function getSkillXpRequired(skillDefinition, skillState) {
  return skillState.level >= skillDefinition.maxLevel ? Infinity : skillDefinition.xpPerLevel[skillState.level - 1];
}

function Skills({ gameState, dispatch, onNavigate }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <section
      className="skills-page academy-scene academy-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.academy})`
      }}
    >
      <div className="academy-overlay" aria-hidden="true" />
      <div className="academy-shell">
        <header className="academy-topbar">
          <img alt="Sea of Treasure logo" className="academy-logo" src="/assets/logo/LOGO.png" />
          <div className="academy-title-copy">
            <p className="eyebrow">Crew Academy</p>
            <h1>Crew Academy</h1>
            <p>Train your crew and improve their mastery.</p>
          </div>
          <div className="resource-cluster">
            <span className="resource-counter">{formatNumber(gameState.gold)} Gold</span>
            <span className="resource-counter">{formatNumber(gameState.talentPoints)} Talent Points</span>
          </div>
        </header>

        <section className="academy-summary-grid">
          <Metric icon={UI_XP} label="Training XP" value={formatNumber(gameState.playerXP)} />
          <Metric icon={UI_TALENT_POINTS} label="Talent Points" value={formatNumber(gameState.talentPoints)} />
        </section>

        <article className="academy-panel academy-note-panel">
          <p className="academy-note">
            If you run out of gold, train Fishing to gather Fish and sell them at Port.
          </p>
        </article>

        <section className="academy-grid">
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
            const cardClassName = `academy-card skill-academy-card${skillState.active ? " active" : ""}${isFinished ? " ready" : ""}`;

            return (
              <article className={cardClassName} key={skill.id}>
                <div className="academy-card-hero">
                  <div className="academy-card-icon-frame">
                    <img alt={skill.name} className="academy-card-icon" src={SKILL_ICONS[skill.id]} />
                  </div>
                  <div className="academy-card-header-copy">
                    <p className="academy-card-kicker">{skill.actionName}</p>
                    <h2>{skill.name}</h2>
                    <div className="academy-card-badges">
                      <span className="academy-badge">Level {skillState.level}</span>
                      <span className="academy-badge">{skill.rewardType}</span>
                    </div>
                  </div>
                </div>

                <div className="academy-progress-block">
                  <div className="level-row">
                    <span>
                      {skillState.level >= skill.maxLevel
                        ? "Max Level"
                        : `${formatNumber(skillState.xp)} / ${formatNumber(xpRequired)} XP`}
                    </span>
                    <span>Duration {formatDuration(skill.actionTimeSeconds * 1000)}</span>
                  </div>
                  <div className="progress-track" aria-label={`${skill.name} XP progress`}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
                  </div>
                </div>

                <p className="academy-card-copy">{skill.description}</p>
                {skill.id === "treasureHunting" && (
                  <>
                    <p className="academy-note">Advanced treasure digs are available in the Treasure section.</p>
                    <button className="chunky-button" onClick={() => onNavigate?.("treasure")} type="button">
                      Open Treasure Vault
                    </button>
                  </>
                )}

                <div className="academy-detail-grid">
                  <Detail label="Gold Cost" value={skill.goldCostPerAction === 0 ? "Free" : formatNumber(skill.goldCostPerAction)} />
                  <Detail label="Rewards" value={skill.rewardType} />
                  <Detail label="Current Action" value={skillState.active ? skill.actionName : "Idle"} />
                  <Detail label="Countdown" value={skillState.active ? (isFinished ? "Ready to complete" : formatDuration(remainingMs)) : "Not active"} />
                </div>

                <div className="academy-actions">
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
        </section>
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

export default Skills;
