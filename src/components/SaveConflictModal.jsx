import { formatNumber } from "../utils/gameEngine.js";

function SaveConflictModal({ conflict, onCancel, onUseCloud, onUseLocal }) {
  if (!conflict) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="offline-modal save-conflict-modal pixel-panel" role="dialog" aria-modal="true" aria-labelledby="save-conflict-title">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Save Conflict</p>
            <h2 id="save-conflict-title">Choose Save File</h2>
          </div>
        </div>

        <p className="save-conflict-message">
          We found both a local save and a cloud save. Choose which one you want to continue with.
        </p>

        <div className="save-conflict-grid">
          <article className="save-conflict-card">
            <h3>Local Save</h3>
            <div className="save-conflict-summary">
              <SummaryRow label="Player Level" value={formatNumber(conflict.localSummary?.playerLevel ?? 1)} />
              <SummaryRow label="Gold" value={formatNumber(conflict.localSummary?.gold ?? 0)} />
              <SummaryRow label="Current Ship" value={conflict.localSummary?.currentShipName ?? conflict.localSummary?.currentShipId ?? "Unknown"} />
              <SummaryRow label="Last Seen" value={formatSaveDate(conflict.localSummary?.lastSeen)} />
            </div>
          </article>

          <article className="save-conflict-card">
            <h3>Cloud Save</h3>
            <div className="save-conflict-summary">
              <SummaryRow label="Player Level" value={formatNumber(conflict.cloudSummary?.playerLevel ?? 1)} />
              <SummaryRow label="Gold" value={formatNumber(conflict.cloudSummary?.gold ?? 0)} />
              <SummaryRow label="Current Ship" value={conflict.cloudSummary?.currentShipName ?? conflict.cloudSummary?.currentShipId ?? "Unknown"} />
              <SummaryRow label="Cloud Updated" value={formatSaveDate(conflict.cloudUpdatedAt ?? conflict.cloudSummary?.lastSeen)} />
            </div>
          </article>
        </div>

        <div className="button-row save-conflict-actions">
          <button className="chunky-button primary" onClick={onUseLocal} type="button">
            Use Local Save
          </button>
          <button className="chunky-button primary" onClick={onUseCloud} type="button">
            Use Cloud Save
          </button>
          <button className="chunky-button" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="resource-row save-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatSaveDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default SaveConflictModal;
