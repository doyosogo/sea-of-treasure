import { useMemo, useState } from "react";
import {
  CANNON_IMAGES,
  ENEMY_IMAGES,
  LOGO,
  RESOURCE_ICONS,
  SCENES,
  SHIP_IMAGES,
  SKILL_ICONS,
  TALENT_ICONS,
  UI_ICONS
} from "../data/assets.js";
import {
  formatNumber,
  getCurrentCannon,
  getCurrentShip,
  getMaxHull,
  getSelectedEnemyType
} from "../utils/gameEngine.js";

const STORAGE_KEY = "sot_save";

function Settings({ gameState, dispatch }) {
  const [exportedJson, setExportedJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [status, setStatus] = useState(null);
  const [resetArmed, setResetArmed] = useState(false);
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const selectedEnemy = getSelectedEnemyType(gameState);
  const debugJson = useMemo(() => JSON.stringify(gameState, null, 2), [gameState]);
  const assetRegistrySummary = useMemo(() => ({
    ships: Object.keys(SHIP_IMAGES).length,
    enemies: Object.keys(ENEMY_IMAGES).length,
    skills: Object.keys(SKILL_ICONS).length,
    cannons: Object.keys(CANNON_IMAGES).length,
    resources: Object.keys(RESOURCE_ICONS).length,
    ui: Object.keys(UI_ICONS).length,
    scenes: Object.keys(SCENES).length,
    talents: Object.keys(TALENT_ICONS).length
  }), []);

  function handleExportSave() {
    const json = JSON.stringify(gameState, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sea-of-treasure-save.json";
    link.click();
    URL.revokeObjectURL(url);
    setExportedJson(json);
    setStatus({ type: "success", message: "Save exported." });
    dispatch({ type: "SAVE_EXPORTED" });
  }

  function handleImportSave() {
    importSaveFromJson(importJson);
  }

  function importSaveFromJson(jsonText) {
    let parsedSave;

    try {
      parsedSave = JSON.parse(jsonText);
    } catch {
      setStatus({ type: "error", message: "Import failed: save JSON is not valid." });
      return;
    }

    if (!isValidSaveShape(parsedSave)) {
      setStatus({ type: "error", message: "Import failed: save is missing required fields." });
      return;
    }

    const importedSave = {
      ...parsedSave,
      activityLog: [
        { message: "Save imported.", type: "info" },
        ...(Array.isArray(parsedSave.activityLog) ? parsedSave.activityLog : [])
      ].slice(0, 8),
      lastSeen: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(importedSave));
    setStatus({ type: "success", message: "Save imported. Reloading..." });
    window.location.reload();
  }

  function handleUploadSaveFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setStatus({ type: "error", message: "Import failed: please upload a .json save file." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setStatus({ type: "error", message: "Import failed: save file could not be read." });
        return;
      }

      setImportJson(reader.result);
      importSaveFromJson(reader.result);
    };

    reader.onerror = () => {
      setStatus({ type: "error", message: "Import failed: save file could not be read." });
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function handleResetSave() {
    if (!resetArmed) {
      setResetArmed(true);
      setStatus({ type: "warning", message: "Click Reset Save again to permanently erase this save." });
      dispatch({ type: "SAVE_RESET_REQUESTED" });
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  return (
    <section className="settings-page">
      <div className="hero-panel pixel-panel">
        <div>
          <p className="eyebrow">Save Tools</p>
          <h1>Settings</h1>
        </div>
        <span className="resource-counter">Local Save</span>
      </div>

      {status && (
        <div className={`settings-status ${status.type}`} role="status">
          {status.message}
        </div>
      )}

      <article className="pixel-panel settings-panel">
        <h2>Export Save</h2>
        <p className="shop-note">Download your current save or copy the JSON manually.</p>
        <button className="chunky-button primary" onClick={handleExportSave} type="button">
          Export Save
        </button>
        <textarea
          className="save-textarea"
          readOnly
          placeholder="Exported save JSON appears here."
          value={exportedJson}
        />
      </article>

      <article className="pixel-panel settings-panel">
        <h2>Import Save</h2>
        <p className="warning-box">
          Importing a save replaces the current local save after validation.
        </p>
        <label className="file-upload-label" htmlFor="save-file-upload">
          Upload Save File
        </label>
        <p className="shop-note">Upload a previously exported sea-of-treasure-save.json file.</p>
        <input
          accept=".json,application/json"
          className="save-file-input"
          id="save-file-upload"
          onChange={handleUploadSaveFile}
          type="file"
        />
        <textarea
          className="save-textarea"
          onChange={(event) => setImportJson(event.target.value)}
          placeholder="Paste Save JSON"
          value={importJson}
        />
        <button className="chunky-button primary" onClick={handleImportSave} type="button">
          Import Save
        </button>
      </article>

      <article className="pixel-panel settings-panel">
        <h2>Reset Save</h2>
        <p className="warning-box">
          Resetting removes `sot_save` from localStorage and reloads the game. This cannot be undone without an export.
        </p>
        <button className="chunky-button danger" onClick={handleResetSave} type="button">
          {resetArmed ? "Confirm Reset Save" : "Reset Save"}
        </button>
      </article>

      <details className="pixel-panel settings-panel debug-panel">
        <summary>Developer Balance Tools</summary>
        <p className="warning-box">
          Developer tools modify the save directly and are not normal gameplay.
        </p>

        <div className="summary-stat-grid">
          <Stat label="Player Level" value={gameState.playerLevel} />
          <Stat label="Gold" value={formatNumber(gameState.gold)} />
          <Stat label="XP" value={formatNumber(gameState.playerXP)} />
          <Stat label="Hull" value={`${formatNumber(gameState.hull.current)} / ${formatNumber(getMaxHull(gameState))}`} />
          <Stat label="Cannonballs" value={formatNumber(gameState.cannonballs)} />
          <Stat label="Current Ship" value={currentShip.name} />
          <Stat label="Cannon Tier" value={`Tier ${currentCannon.tier}`} />
          <Stat label="Selected Enemy" value={selectedEnemy.name} />
          <Stat label="Talent Points" value={formatNumber(gameState.talentPoints)} />
          <Stat label="Total Ships Sunk" value={formatNumber(gameState.totalShipsSunk)} />
          <Stat label="Total Gold Earned" value={formatNumber(gameState.lifetimeStats.totalGoldEarned)} />
          <Stat label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
        </div>

        <div className="debug-resource-grid">
          <ResourceList title="Materials" values={gameState.materials} />
          <ResourceList title="Resources" values={gameState.resources} />
        </div>

        <div className="button-row debug-button-row">
          <button className="chunky-button" onClick={() => dispatch({ type: "DEBUG_ADD_GOLD" })} type="button">
            Add 10,000 Gold
          </button>
          <button className="chunky-button" onClick={() => dispatch({ type: "DEBUG_ADD_CANNONBALLS" })} type="button">
            Add 100 Cannonballs
          </button>
          <button className="chunky-button" onClick={() => dispatch({ type: "DEBUG_ADD_TALENT_POINTS" })} type="button">
            Add 10 Talent Points
          </button>
          <button className="chunky-button" onClick={() => dispatch({ type: "DEBUG_ADD_MATERIALS_BUNDLE" })} type="button">
            Add Basic Materials Bundle
          </button>
          <button className="chunky-button" onClick={() => dispatch({ type: "DEBUG_REPAIR_FULL" })} type="button">
            Repair Hull to Full
          </button>
        </div>

        <textarea className="save-textarea debug-json" readOnly value={debugJson} />
      </details>

      {import.meta.env.DEV && (
        <article className="pixel-panel settings-panel">
          <h2>Visual Asset System Ready</h2>
          <div className="summary-stat-grid">
            <Stat label="Logo Loaded" value="Yes" />
            <Stat label="Scene Count" value={assetRegistrySummary.scenes} />
            <Stat label="Icon Count" value={assetRegistrySummary.ui + assetRegistrySummary.resources + assetRegistrySummary.skills + assetRegistrySummary.cannons} />
          </div>
        </article>
      )}

      {import.meta.env.DEV && (
        <article className="pixel-panel settings-panel">
          <h2>Asset Registry Check</h2>
          <p className="shop-note">
            Central registry for shared artwork. Logo asset: <code>{LOGO}</code>
          </p>
          <div className="summary-stat-grid">
            <Stat label="Ships registered" value={assetRegistrySummary.ships} />
            <Stat label="Enemies registered" value={assetRegistrySummary.enemies} />
            <Stat label="Skills registered" value={assetRegistrySummary.skills} />
            <Stat label="Cannons registered" value={assetRegistrySummary.cannons} />
            <Stat label="Resources registered" value={assetRegistrySummary.resources} />
            <Stat label="UI icons registered" value={assetRegistrySummary.ui} />
            <Stat label="Scenes registered" value={assetRegistrySummary.scenes} />
            <Stat label="Talent icon entries" value={assetRegistrySummary.talents} />
          </div>
        </article>
      )}
    </section>
  );
}

function isValidSaveShape(save) {
  return (
    save &&
    typeof save === "object" &&
    Number.isFinite(save.playerLevel) &&
    Number.isFinite(save.gold) &&
    Number.isFinite(save.currentShipId)
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResourceList({ title, values }) {
  return (
    <div className="resource-market-card">
      <h2>{title}</h2>
      {Object.entries(values).map(([key, value]) => (
        <div className="resource-row" key={key}>
          <span>{formatLabel(key)}</span>
          <strong>{formatNumber(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function formatLabel(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export default Settings;
