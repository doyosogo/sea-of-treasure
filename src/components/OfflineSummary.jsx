import { formatDuration, formatNumber } from "../utils/gameEngine.js";

const stoppedReasonMessages = {
  offline_cap_reached: "Your crew reached the 24 hour offline cap.",
  out_of_cannonballs: "Your crew ran out of cannonballs, so progress stopped early."
};

function OfflineSummary({ gameState, dispatch }) {
  const rewards = gameState.pendingOfflineRewards;

  if (!gameState.offlineSummaryVisible || !rewards) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="offline-modal pixel-panel" role="dialog" aria-modal="true" aria-labelledby="offline-title">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Idle Report</p>
            <h2 id="offline-title">While You Were Away</h2>
          </div>
        </div>

        <div className="offline-summary-grid">
          <div className="resource-row">
            <span>Time Away</span>
            <strong>{formatDuration(rewards.timeAwayMs)}</strong>
          </div>
          <div className="resource-row">
            <span>Effective Idle Time</span>
            <strong>{formatDuration(rewards.effectiveTimeMs)}</strong>
          </div>
          <div className="resource-row">
            <span>Ships Sunk</span>
            <strong>{formatNumber(rewards.shipsSunk)}</strong>
          </div>
          <div className="resource-row">
            <span>Gold Earned</span>
            <strong>{formatNumber(rewards.goldEarned)}</strong>
          </div>
          <div className="resource-row">
            <span>XP Earned</span>
            <strong>{formatNumber(rewards.xpEarned)}</strong>
          </div>
          <div className="resource-row">
            <span>Cannonballs Used</span>
            <strong>{formatNumber(rewards.cannonballsUsed)}</strong>
          </div>
          <div className="resource-row">
            <span>Maps Found</span>
            <strong>{formatNumber(rewards.mapsFound ?? 0)}</strong>
          </div>
        </div>

        {rewards.stoppedReason && (
          <p className="offline-warning">{stoppedReasonMessages[rewards.stoppedReason]}</p>
        )}

        <div className="button-row">
          <button
            className="chunky-button primary"
            onClick={() => dispatch({ type: "CLAIM_OFFLINE_REWARDS" })}
            type="button"
          >
            Claim Rewards
          </button>
          <button
            className="chunky-button"
            onClick={() => dispatch({ type: "DISMISS_OFFLINE_REWARDS" })}
            type="button"
          >
            Dismiss
          </button>
        </div>
      </section>
    </div>
  );
}

export default OfflineSummary;
