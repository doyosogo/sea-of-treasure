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
import { useAuth } from "../context/AuthContext.jsx";
import {
  ACTIVE_COMBAT_GOLD_BONUS_MULTIPLIER,
  BEGINNER_DAMAGE_REDUCTION_MULTIPLIER,
  BOSS_COMBAT_DOUBLOON_CHANCE,
  DEFAULT_COMBAT_DOUBLOON_CHANCE,
  MARKET_CYCLE_DURATION_MS,
  OFFLINE_DOUBLOON_CAP,
  REPAIR_COST_PER_MISSING_HULL,
  QUEST_DAILY_RESET_MS,
  QUEST_WEEKLY_RESET_MS,
  TREASURE_DOUBLOON_CHANCE,
  TREASURE_MAP_DROP_BASE_CHANCE,
  WORLD_EVENT_GENERATION_CHANCE,
  WORLD_EVENT_GENERATION_INTERVAL_MS
} from "../data/balance.js";
import {
  calcOfflineProgress,
  formatDuration,
  formatNumber,
  getCurrentCannon,
  getCurrentShip,
  getAmmoCostPer100,
  getEffectiveBallsPerBattle,
  getIdleCombatEstimate,
  getMaxHull,
  getSelectedAmmo,
  getTotalAmmoCount,
  getSelectedEnemyType,
  getActiveWorldEvent,
  getRepairCostPerMissingHull
} from "../utils/gameEngine.js";
import {
  exportGameSave,
  parseImportedSave,
  replaceLocalSave
} from "../utils/saveTools.js";

const STORAGE_KEY = "sot_save";

function Settings({ cloudSync, dispatch, gameState, onResolveSaveConflict, onSyncNow, saveConflict }) {
  const { user, logout } = useAuth();
  const [exportedJson, setExportedJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resetArmed, setResetArmed] = useState(false);
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const selectedEnemy = getSelectedEnemyType(gameState);
  const activeWorldEvent = getActiveWorldEvent(gameState);
  const selectedAmmo = getSelectedAmmo(gameState);
  const totalAmmo = getTotalAmmoCount(gameState);
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
    const json = exportGameSave(gameState);
    setExportedJson(json);
    setStatus({ type: "success", message: "Save exported." });
    dispatch({ type: "SAVE_EXPORTED" });
  }

  function handleImportSave() {
    importSaveFromJson(importJson);
  }

  function importSaveFromJson(jsonText) {
    const result = parseImportedSave(jsonText);

    if (!result.ok) {
      setStatus({ type: "error", message: result.error });
      return;
    }

    replaceLocalSave(result.save);
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

  function handlePreviewActiveBattles() {
    const estimate = getIdleCombatEstimate(gameState);
    const activeGold = Math.round(estimate.goldPerEnemy * ACTIVE_COMBAT_GOLD_BONUS_MULTIPLIER);
    const netGoldPerBattle = Math.max(0, activeGold - Math.round((getEffectiveBallsPerBattle(gameState) * getAmmoCostPer100(selectedAmmo.id)) / 100));

    setPreview({
      title: "10 Active Battles",
      text: `Preview only: about ${formatNumber(netGoldPerBattle * 10)} net gold, ${formatNumber(estimate.xpPerEnemy * 10)} XP, and ${formatNumber(getEffectiveBallsPerBattle(gameState) * 10)} ammo spent.`,
      type: "info"
    });
    setStatus({ type: "warning", message: "Preview only: active battle estimate generated." });
  }

  function handlePreviewIdleHour() {
    const estimate = getIdleCombatEstimate(gameState);

    setPreview({
      title: "1 Hour Idle Combat",
      text: `Preview only: about ${formatNumber(estimate.goldPerHour)} gold, ${formatNumber(estimate.xpPerHour)} XP, ${formatNumber(estimate.cannonballsPerHour)} ammo, and ${formatNumber(estimate.hullDamagePerHour)} hull damage.`,
      type: "info"
    });
    setStatus({ type: "warning", message: "Preview only: idle combat estimate generated." });
  }

  function handlePreviewOfflineClaim() {
    const previewAway = Date.now() - 24 * 60 * 60 * 1000;
    const offlinePreview = calcOfflineProgress(previewAway, Date.now(), gameState);

    setPreview({
      title: "24 Hour Offline Claim",
      text: offlinePreview
        ? `Preview only: about ${formatNumber(offlinePreview.goldEarned)} gold, ${formatNumber(offlinePreview.xpEarned)} XP, ${formatNumber(offlinePreview.mapsFound)} maps, and ${formatNumber(offlinePreview.doubloonsEarned)} Doubloons.`
        : "Preview only: no offline rewards would be generated yet.",
      type: "info"
    });
    setStatus({ type: "warning", message: "Preview only: offline claim estimate generated." });
  }

  return (
    <section
      className="settings-page settings-scene"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.72)), url(${SCENES.harbour})`
      }}
    >
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
        <h2>Account</h2>
        {user ? (
          <>
            <div className="summary-stat-grid">
              <Stat label="Username" value={user.username} />
              <Stat label="Email" value={user.email} />
              <Stat label="Cloud Status" value={cloudSync?.message ?? "Offline"} />
              <Stat label="Cloud Updated" value={cloudSync?.lastUpdated ? new Date(cloudSync.lastUpdated).toLocaleString() : "Not synced yet"} />
            </div>
            <p className="shop-note">Cloud save backup is enabled. Local browser storage remains unchanged.</p>
            <div className="button-row">
              {saveConflict?.unresolved ? (
                <button className="chunky-button" onClick={onResolveSaveConflict} type="button">
                  Resolve Save Conflict
                </button>
              ) : null}
              <button className="chunky-button primary" disabled={cloudSync?.status === "syncing"} onClick={onSyncNow} type="button">
                Sync Now
              </button>
              <button className="chunky-button danger" onClick={logout} type="button">
                Logout
              </button>
            </div>
          </>
        ) : (
          <p className="shop-note">Playing offline. Login to enable cloud saves later.</p>
        )}
      </article>

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

        <article className="settings-subpanel">
          <h3>Balance Overview</h3>
          <div className="summary-stat-grid">
            <Stat label="Active Combat Bonus" value={`${formatNumber((ACTIVE_COMBAT_GOLD_BONUS_MULTIPLIER - 1) * 100)}%`} />
            <Stat label="Repair Cost / Hull" value={formatNumber(REPAIR_COST_PER_MISSING_HULL)} />
            <Stat label="Beginner Damage Reduction" value={`${formatNumber((1 - BEGINNER_DAMAGE_REDUCTION_MULTIPLIER) * 100)}%`} />
            <Stat label="Doubloon Drop Rate" value={`Combat ${formatNumber(DEFAULT_COMBAT_DOUBLOON_CHANCE * 100)}% / Boss ${formatNumber(BOSS_COMBAT_DOUBLOON_CHANCE * 100)}%`} />
            <Stat label="Treasure Map Drop Rate" value={`${formatNumber(TREASURE_MAP_DROP_BASE_CHANCE * 100)}%`} />
            <Stat label="Treasure Doubloons" value={`${formatNumber(TREASURE_DOUBLOON_CHANCE * 100)}%`} />
            <Stat label="Offline Doubloon Cap" value={formatNumber(OFFLINE_DOUBLOON_CAP)} />
            <Stat label="Quest Resets" value={`${formatDuration(QUEST_DAILY_RESET_MS)} / ${formatDuration(QUEST_WEEKLY_RESET_MS)}`} />
            <Stat label="Market Cycle" value={formatDuration(MARKET_CYCLE_DURATION_MS)} />
            <Stat label="World Event Check" value={`${formatDuration(WORLD_EVENT_GENERATION_INTERVAL_MS)} @ ${formatNumber(WORLD_EVENT_GENERATION_CHANCE * 100)}%`} />
          </div>
        </article>

        <article className="settings-subpanel">
          <h3>Economy Summary</h3>
          <div className="summary-stat-grid">
            <Stat label="Active Combat Net Gold" value={formatNumber(Math.max(0, Math.round(getIdleCombatEstimate(gameState).goldPerEnemy * ACTIVE_COMBAT_GOLD_BONUS_MULTIPLIER - (getEffectiveBallsPerBattle(gameState) * getAmmoCostPer100(selectedAmmo.id)) / 100)))} />
            <Stat label="Idle Gold / Hour" value={formatNumber(getIdleCombatEstimate(gameState).goldPerHour)} />
            <Stat label="Repair Cost Estimate" value={`${formatNumber(getRepairCostPerMissingHull(gameState) * Math.max(0, getMaxHull(gameState) - gameState.hull.current))} Gold`} />
            <Stat label="Ammo Cost / Hour" value={formatNumber(getIdleCombatEstimate(gameState).cannonballsPerHour)} />
          </div>
        </article>

        <article className="settings-subpanel">
          <h3>Preview Only</h3>
          <p className="shop-note">These buttons calculate estimates only. They do not change your save.</p>
          <div className="button-row debug-button-row">
            <button className="chunky-button" onClick={handlePreviewActiveBattles} type="button">
              Simulate 10 Active Battles
            </button>
            <button className="chunky-button" onClick={handlePreviewIdleHour} type="button">
              Simulate 1 Hour Idle Combat
            </button>
            <button className="chunky-button" onClick={handlePreviewOfflineClaim} type="button">
              Simulate 24 Hour Offline Claim Preview
            </button>
          </div>
          {preview ? (
            <div className={`settings-status ${preview.type}`}>
              <strong>{preview.title}</strong>
              <span>{preview.text}</span>
            </div>
          ) : null}
        </article>

        <div className="summary-stat-grid">
          <Stat label="Player Level" value={gameState.playerLevel} />
          <Stat label="Gold" value={formatNumber(gameState.gold)} />
          <Stat label="Doubloons" value={formatNumber(gameState.doubloons)} />
          <Stat label="XP" value={formatNumber(gameState.playerXP)} />
          <Stat label="Hull" value={`${formatNumber(gameState.hull.current)} / ${formatNumber(getMaxHull(gameState))}`} />
          <Stat label="Selected Ammo" value={selectedAmmo.name} />
          <Stat label="Ammo Stock" value={formatNumber(totalAmmo)} />
          <Stat label="Current Ship" value={currentShip.name} />
          <Stat label="Cannon Tier" value={`Tier ${currentCannon.tier}`} />
          <Stat label="Selected Enemy" value={selectedEnemy.name} />
          <Stat label="Talent Points" value={formatNumber(gameState.talentPoints)} />
          <Stat label="Total Ships Sunk" value={formatNumber(gameState.totalShipsSunk)} />
          <Stat label="Total Gold Earned" value={formatNumber(gameState.lifetimeStats.totalGoldEarned)} />
          <Stat label="Rare Map Pieces" value={formatNumber(gameState.rareMapPieces)} />
          <Stat label="World Events Seen" value={formatNumber(gameState.lifetimeStats?.worldEventsSeen ?? 0)} />
          <Stat label="Cursed Fog Seen" value={formatNumber(gameState.lifetimeStats?.cursedFogEventsSeen ?? 0)} />
          <Stat label="Active World Event" value={activeWorldEvent ? activeWorldEvent.name : "None"} />
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
            Add Basic Ammo Bundle
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
          <button className="chunky-button" onClick={() => dispatch({ type: "TRIGGER_RANDOM_WORLD_EVENT" })} type="button">
            Trigger Random World Event
          </button>
          <button className="chunky-button" onClick={() => dispatch({ type: "CLEAR_ACTIVE_WORLD_EVENT" })} type="button">
            Clear Active World Event
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

function Stat({ label, value }) {
  return (
    <div className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResourceList({ title, values }) {
  const entries = Object.entries(values ?? {});

  return (
    <div className="resource-market-card">
      <h2>{title}</h2>
      {entries.length > 0 ? (
        entries.map(([key, value]) => (
          <div className="resource-row" key={key}>
            <span>{formatLabel(key)}</span>
            <strong>{formatNumber(value)}</strong>
          </div>
        ))
      ) : (
        <p className="shop-note">No entries are present in this save section.</p>
      )}
    </div>
  );
}

function formatLabel(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export default Settings;
