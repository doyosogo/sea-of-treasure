import { LOGO, RESOURCE_ICONS, SCENES, UI_DOUBLOONS, UI_GOLD, UI_TALENT_POINTS, UI_XP } from "../data/assets.js";
import { QUEST_DAILY_RESET_MS, QUEST_WEEKLY_RESET_MS } from "../data/balance.js";
import { useNotifications } from "../context/NotificationContext.jsx";
import { formatDuration, formatNumber } from "../utils/gameEngine.js";

function Quests({ gameState, dispatch, onNavigate }) {
  const { showSuccess } = useNotifications();
  const quests = gameState.quests ?? { daily: [], weekly: [], lastDailyReset: Date.now(), lastWeeklyReset: Date.now() };
  const dailyResetRemaining = Math.max(0, (quests.lastDailyReset ?? Date.now()) + QUEST_DAILY_RESET_MS - Date.now());
  const weeklyResetRemaining = Math.max(0, (quests.lastWeeklyReset ?? Date.now()) + QUEST_WEEKLY_RESET_MS - Date.now());

  const dailyComplete = (quests.daily ?? []).filter((quest) => (quest.progress ?? 0) >= quest.target).length;
  const weeklyComplete = (quests.weekly ?? []).filter((quest) => (quest.progress ?? 0) >= quest.target).length;

  return (
    <section
      className="quests-page quest-orders quest-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.harbour})`
      }}
    >
      <div className="quest-overlay" aria-hidden="true" />
      <div className="quest-shell">
        <header className="quest-topbar">
          <img alt="Sea of Treasure logo" className="quest-logo" src={LOGO} />
          <div className="quest-title-copy">
            <p className="eyebrow">Captain&apos;s Orders</p>
            <h1>Captain&apos;s Orders</h1>
            <p>Complete daily and weekly objectives for rare rewards.</p>
          </div>
          <div className="quest-top-stats">
            <QuestChip icon={UI_DOUBLOONS} label="Daily Complete" value={`${formatNumber(dailyComplete)} / ${formatNumber((quests.daily ?? []).length)}`} />
            <QuestChip icon={UI_TALENT_POINTS} label="Weekly Complete" value={`${formatNumber(weeklyComplete)} / ${formatNumber((quests.weekly ?? []).length)}`} />
          </div>
        </header>

        <section className="quest-summary-grid">
          <article className="quest-panel">
            <h2>Legend Timers</h2>
            <div className="quest-timer-grid">
              <TimerRow label="Daily Reset" value={formatDuration(dailyResetRemaining)} />
              <TimerRow label="Weekly Reset" value={formatDuration(weeklyResetRemaining)} />
            </div>
          </article>

          <article className="quest-panel">
            <h2>Quest Rewards</h2>
            <p className="quest-note">Quest rewards are balanced to stay rare, useful, and small enough to preserve the core economy.</p>
            <div className="quest-summary-stats">
              <StatRow icon={UI_GOLD} label="Gold" value="Modest" />
              <StatRow icon={UI_DOUBLOONS} label="Doubloons" value="Rare" />
              <StatRow icon={UI_XP} label="XP" value="Small bonuses" />
            </div>
          </article>
        </section>

        <section className="quest-section">
          <div className="quest-section-header">
            <h2>Daily Quests</h2>
            <span className="quest-section-badge">{formatNumber(dailyComplete)} complete</span>
          </div>
          <QuestList quests={quests.daily ?? []} type="daily" dispatch={dispatch} onClaim={(quest) => showSuccess("Quest Reward Claimed", { detail: `${quest.title} • ${formatQuestReward(quest)}` })} />
        </section>

        <section className="quest-section">
          <div className="quest-section-header">
            <h2>Weekly Quests</h2>
            <span className="quest-section-badge">{formatNumber(weeklyComplete)} complete</span>
          </div>
          <QuestList quests={quests.weekly ?? []} type="weekly" dispatch={dispatch} onClaim={(quest) => showSuccess("Quest Reward Claimed", { detail: `${quest.title} • ${formatQuestReward(quest)}` })} />
        </section>

        <button className="chunky-button quest-back-button" onClick={() => onNavigate?.("dashboard")} type="button">
          Return to Dashboard
        </button>
      </div>
    </section>
  );
}

function QuestList({ quests, type, dispatch, onClaim }) {
  if (quests.length <= 0) {
    return (
      <div className="treasure-empty-state">
        <strong>No {type} quests are active.</strong>
        <p>New orders will arrive with the next reset. Your progress is safe, so you can sail on and come back later.</p>
      </div>
    );
  }

  return (
      <div className="quest-card-grid">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} dispatch={dispatch} onClaim={onClaim} />
      ))}
    </div>
  );
}

function QuestCard({ quest, dispatch, onClaim }) {
  const progress = Math.min(quest.target, quest.progress ?? 0);
  const status = quest.claimed ? "Claimed" : progress >= quest.target ? "Complete" : "In Progress";
  const statusClass = status === "In Progress" ? "in-progress" : status.toLowerCase();
  const canClaim = status === "Complete";

  return (
    <article className={`quest-card ${statusClass}`}>
      <div className="quest-card-header">
        <div>
          <p className="quest-kicker">{quest.type === "weekly" ? "Weekly" : "Daily"}</p>
          <h3>{quest.title}</h3>
        </div>
        <span className={`quest-status ${statusClass}`}>{status}</span>
      </div>

      <p className="quest-description">{quest.description}</p>

      <div className="quest-progress-row">
        <span>Progress</span>
        <strong>{formatNumber(progress)} / {formatNumber(quest.target)}</strong>
      </div>
      <div className="progress-track quest-progress-track" aria-label={`${quest.title} progress`}>
        <div className="progress-fill" style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }} />
      </div>

      <div className="quest-reward-grid">
        <RewardRow icon={UI_GOLD} label="Gold" value={quest.rewardGold} />
        <RewardRow icon={UI_DOUBLOONS} label="Doubloons" value={quest.rewardDoubloons ?? 0} />
        {(quest.rewardTalentPoints ?? 0) > 0 && (
          <RewardRow icon={UI_TALENT_POINTS} label="Talent Points" value={quest.rewardTalentPoints} />
        )}
        {quest.rewardMaterials && Object.entries(quest.rewardMaterials).map(([materialId, amount]) => (
          <RewardRow key={materialId} icon={getRewardIcon(materialId)} label={formatMaterialName(materialId)} value={amount} />
        ))}
      </div>

      <button
        className="chunky-button primary"
        disabled={!canClaim}
        onClick={() => {
          dispatch({ type: "CLAIM_QUEST_REWARD", questId: quest.id });
          onClaim?.(quest);
        }}
        type="button"
      >
        {quest.claimed ? "Claimed" : "Claim Reward"}
      </button>
    </article>
  );
}

function RewardRow({ icon, label, value }) {
  return (
    <div className="quest-reward-row">
      <div className="quest-reward-left">
        <img alt={label} className="quest-reward-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function QuestChip({ icon, label, value }) {
  return (
    <div className="quest-chip">
      <img alt={label} src={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function TimerRow({ label, value }) {
  return (
    <div className="quest-timer-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="quest-stat-row">
      <div className="quest-stat-left">
        <img alt={label} className="quest-stat-icon" src={icon} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function getRewardIcon(materialId) {
  const icons = {
    fish: RESOURCE_ICONS.fish,
    whaleOil: RESOURCE_ICONS.whaleOil,
    navigationCharts: RESOURCE_ICONS.navigationCharts,
    compassFragments: RESOURCE_ICONS.compassFragments,
    gunpowder: RESOURCE_ICONS.gunpowder,
    cannonParts: RESOURCE_ICONS.cannonParts,
    ancientRelics: RESOURCE_ICONS.ancientRelics,
    tradeContracts: RESOURCE_ICONS.tradeContracts,
    tradeSeals: RESOURCE_ICONS.tradeSeals,
    rareMapPieces: RESOURCE_ICONS.rareMapPiece
  };

  return icons[materialId] ?? UI_XP;
}

function formatMaterialName(materialId) {
  const names = {
    fish: "Fish",
    whaleOil: "Whale Oil",
    navigationCharts: "Navigation Charts",
    compassFragments: "Compass Fragments",
    gunpowder: "Gunpowder",
    cannonParts: "Cannon Parts",
    ancientRelics: "Ancient Relics",
    tradeContracts: "Trade Contracts",
    tradeSeals: "Trade Seals",
    rareMapPieces: "Rare Map Pieces"
  };

  return names[materialId] ?? materialId;
}

function formatQuestReward(quest) {
  const parts = [];

  if ((quest.rewardGold ?? 0) > 0) {
    parts.push(`+${formatNumber(quest.rewardGold)} Gold`);
  }

  if ((quest.rewardDoubloons ?? 0) > 0) {
    parts.push(`+${formatNumber(quest.rewardDoubloons)} Doubloons`);
  }

  if ((quest.rewardTalentPoints ?? 0) > 0) {
    parts.push(`+${formatNumber(quest.rewardTalentPoints)} Talent Points`);
  }

  if (quest.rewardMaterials) {
    parts.push(
      Object.entries(quest.rewardMaterials)
        .map(([materialId, amount]) => `${formatNumber(amount)} ${formatMaterialName(materialId)}`)
        .join(", ")
    );
  }

  return parts.filter(Boolean).join(" • ") || "Reward claimed";
}

export default Quests;
