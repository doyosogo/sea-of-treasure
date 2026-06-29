import { useEffect, useMemo, useRef, useState } from "react";
import { LOGO, CANNON_IMAGES, RESOURCE_ICONS, SCENES, SHIP_IMAGES, UI_CANNONBALLS, UI_DOUBLOONS, UI_GOLD, UI_TALENT_POINTS, UI_XP } from "../data/assets.js";
import { ammunition } from "../data/ammunition.js";
import { cannons } from "../data/cannons.js";
import { regions } from "../data/regions.js";
import { ships } from "../data/ships.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { formatDuration, formatNumber, getActiveRegion, getCaptainLevelsRemaining, getCaptainNextPromotionLevel, getCaptainPermanentSlots, getCaptainRankTitle, getCurrentCannon, getCurrentShip, getEquippedCannons, getAmmoInventory, getCannonInventory, getXpRequired } from "../utils/gameEngine.js";
import { exportGameSave, parseImportedSave, replaceLocalSave } from "../utils/saveTools.js";

function Profile({ cloudSync, gameState, onNavigate }) {
  const { user, logout, refreshCurrentUser } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);
  const refreshedAccountRef = useRef(false);
  const currentShip = getCurrentShip(gameState);
  const currentCannon = getCurrentCannon(gameState);
  const currentRegion = getActiveRegion(gameState);
  const preferences = gameState.preferences ?? {};
  const xpRequired = getXpRequired(gameState.playerLevel);
  const xpToNextLevel = xpRequired === Infinity ? 0 : xpRequired;
  const ownedShips = useMemo(() => ships.filter((ship) => (gameState.ownedShips ?? []).includes(ship.id)), [gameState.ownedShips]);
  const ownedCannons = useMemo(() => cannons.map((cannon) => ({
    ...cannon,
    owned: getCannonInventory(gameState)[cannon.id] ?? 0,
    equipped: getEquippedCannons(gameState)[cannon.id] ?? 0
  })), [gameState]);
  const ownedAmmo = useMemo(() => ammunition.map((ammo) => ({
    ...ammo,
    owned: getAmmoInventory(gameState)[ammo.id] ?? 0
  })), [gameState]);
  const regionProgress = useMemo(() => regions.map((region) => ({
    ...region,
    current: region.id === currentRegion.id,
    unlocked: gameState.playerLevel >= region.requiredLevel
  })), [currentRegion.id, gameState.playerLevel]);
  const captainPromotionHistory = useMemo(() => (
    Array.isArray(gameState.captainProgression?.promotionHistory)
      ? [...new Set(gameState.captainProgression.promotionHistory)].sort((left, right) => left - right)
      : []
  ), [gameState.captainProgression?.promotionHistory]);
  const currentCaptainRank = getCaptainRankTitle(gameState.playerLevel);
  const captainPromotionLevel = getCaptainNextPromotionLevel(gameState.playerLevel);
  const captainLevelsRemaining = getCaptainLevelsRemaining(gameState.playerLevel);
  const captainPermanentSlots = getCaptainPermanentSlots(gameState);
  const storedExperience = Math.max(0, gameState.storedExperience ?? 0);
  const lifetimeExperience = Math.max(0, gameState.lifetimeStats?.totalExperienceEarned ?? 0);
  const isMaxLevel = gameState.playerLevel >= 50;

  useEffect(() => {
    if (!user) {
      refreshedAccountRef.current = false;
      return;
    }

    if (refreshedAccountRef.current) {
      return;
    }

    refreshedAccountRef.current = true;
    refreshCurrentUser?.().catch((error) => {
      console.warn("Profile refresh failed.", error);
    });
  }, [refreshCurrentUser, user]);

  function handleExportSave() {
    const json = exportGameSave(gameState);
    setStatus({ type: "success", message: "Save exported." });
    showSuccess("Save exported.");
    return json;
  }

  function handleChooseImportFile() {
    fileInputRef.current?.click();
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setStatus({ type: "error", message: "Import failed: please upload a .json save file." });
      showError("Import failed: please upload a .json save file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setStatus({ type: "error", message: "Import failed: save file could not be read." });
        showError("Import failed: save file could not be read.");
        return;
      }

      const result = parseImportedSave(reader.result);

      if (!result.ok) {
        setStatus({ type: "error", message: result.error });
        showError(result.error);
        return;
      }

      replaceLocalSave(result.save);
      setStatus({ type: "success", message: "Save imported. Reloading..." });
      showSuccess("Save imported.");
      window.setTimeout(() => window.location.reload(), 250);
    };

    reader.onerror = () => {
      setStatus({ type: "error", message: "Import failed: save file could not be read." });
      showError("Import failed: save file could not be read.");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section
      className="profile-page dashboard-cabin dashboard-reset"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 14, 0.45), rgba(5, 8, 14, 0.7)), url(${SCENES.profile})`
      }}
    >
      <div className="dashboard-overlay" aria-hidden="true" />

      <div className="dashboard-shell profile-shell">
        <header className="dashboard-topbar profile-topbar">
          <img alt="Sea of Treasure logo" className="dashboard-logo" src={LOGO} />
          <div className="dashboard-title-copy">
            <p className="eyebrow">{user ? "Captain Profile" : "Offline Profile"}</p>
            <h1>{user ? "Profile" : "Offline Profile"}</h1>
            <p>{user ? "Account details, progression, and voyage statistics." : "Local save details and offline progress."}</p>
          </div>
          <div className={`cloud-save-pill ${cloudSync?.status ?? "offline"}`}>
            <span>Cloud Save</span>
            <strong>{cloudSync?.message ?? "Offline"}</strong>
          </div>
        </header>

        {status ? (
          <div className={`settings-status ${status.type}`} role="status">
            {status.message}
          </div>
        ) : null}

        <section className="profile-grid">
          <article className="dashboard-panel profile-panel">
            <h2>Account Information</h2>
            <div className="summary-stat-grid">
              <Stat label="Username" value={user?.username ?? "Offline Captain"} />
              <Stat label="Email" value={user?.email ?? "Not signed in"} />
              <Stat label="Account Created" value={formatDate(user?.createdAt)} />
              <Stat label="Current Level" value={formatNumber(gameState.playerLevel)} />
              <Stat label="Current Ship" value={currentShip.name} />
              <Stat label="Current Region" value={currentRegion.name} />
              <Stat label="Cloud Save Status" value={cloudSync?.message ?? (user ? "Synced" : "Offline")} />
            </div>
          </article>

          <article className="dashboard-panel profile-panel captain-panel">
            <h2>Captain Progression</h2>
            <div className="summary-stat-grid">
              <Stat label="Captain Rank" value={currentCaptainRank} />
              <Stat label="Current Level" value={formatNumber(gameState.playerLevel)} />
              <Stat label="Permanent Cannon Slots" value={`+${formatNumber(captainPermanentSlots)}`} />
              <Stat label={isMaxLevel ? "Maximum Rank Achieved" : "Next Promotion"} value={isMaxLevel ? currentCaptainRank : `Lv. ${captainPromotionLevel ?? "Max"}`} />
              <Stat label="Levels Remaining" value={isMaxLevel ? "0" : formatNumber(captainLevelsRemaining)} />
              <Stat label="Lifetime XP" value={formatNumber(lifetimeExperience)} />
              <Stat label="Stored XP" value={formatNumber(storedExperience)} />
              <Stat label="Promotion Count" value={formatNumber(captainPromotionHistory.length)} />
            </div>
            <div className="profile-history-card">
              <h3>Promotion History</h3>
              {captainPromotionHistory.length > 0 ? (
                <div className="profile-promotion-history">
                  {captainPromotionHistory.map((level) => (
                    <span className="profile-promotion-pill" key={level}>
                      Lv. {level} - {getCaptainRankTitle(level)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="shop-note">No promotions earned yet.</p>
              )}
            </div>
          </article>

          <article className="dashboard-panel profile-panel">
            <h2>Preferences</h2>
            <div className="summary-stat-grid">
              <Stat label="UI Scale" value={formatPreferenceValue(preferences.uiScale ?? "normal")} />
              <Stat label="Damage Numbers" value={(preferences.showDamageNumbers ?? true) ? "On" : "Off"} />
              <Stat label="Offline Summary" value={(preferences.showOfflineSummary ?? true) ? "On" : "Off"} />
              <Stat label="Autosave Interval" value={`${preferences.autosaveIntervalSeconds ?? 30}s`} />
              <Stat label="Compact Mode" value={(preferences.compactMode ?? false) ? "On" : "Off"} />
            </div>
          </article>

          <article className="dashboard-panel profile-panel">
            <h2>Lifetime Statistics</h2>
            <div className="summary-stat-grid">
              <Stat icon={UI_GOLD} label="Total Gold Earned" value={formatNumber(gameState.lifetimeStats?.totalGoldEarned ?? 0)} />
              <Stat icon={UI_DOUBLOONS} label="Total Doubloons Earned" value={formatNumber(gameState.lifetimeStats?.totalDoubloonsEarned ?? 0)} />
              <Stat icon={UI_XP} label="Ships Sunk" value={formatNumber(gameState.lifetimeStats?.totalShipsSunk ?? 0)} />
              <Stat icon={UI_GOLD} label="Bosses Defeated" value={formatNumber(gameState.lifetimeStats?.totalBossesDefeated ?? 0)} />
              <Stat icon={UI_XP} label="Treasure Maps Completed" value={formatNumber(gameState.lifetimeStats?.treasureDigsCompleted ?? 0)} />
              <Stat icon={UI_XP} label="Treasure Maps Found" value={formatNumber(gameState.lifetimeStats?.treasureMapsFound ?? 0)} />
              <Stat icon={RESOURCE_ICONS.fish} label="Fish Caught" value={formatNumber(gameState.lifetimeStats?.fishCaught ?? 0)} />
              <Stat icon={UI_GOLD} label="Trading Profit" value={formatNumber(gameState.lifetimeStats?.tradingProfit ?? 0)} />
              <Stat icon={UI_XP} label="World Events Completed" value={formatNumber(gameState.lifetimeStats?.worldEventsCompleted ?? 0)} />
              <Stat icon={UI_TALENT_POINTS} label="Crew Levels Purchased" value={formatNumber(gameState.lifetimeStats?.crewLevelsPurchased ?? 0)} />
              <Stat icon={UI_XP} label="Total Play Time" value={formatDuration(gameState.lifetimeStats?.totalPlayTimeMs ?? 0)} />
              <Stat icon={UI_XP} label="Offline Time Earned" value={formatDuration(gameState.lifetimeStats?.offlineTimeEarnedMs ?? 0)} />
            </div>
          </article>

          <article className="dashboard-panel profile-panel">
            <h2>Progress</h2>
            <div className="profile-progress-block">
              <div className="level-row">
                <span>Level {formatNumber(gameState.playerLevel)}</span>
                <span>{xpRequired === Infinity ? "Max Level" : `${formatNumber(gameState.playerXP)} / ${formatNumber(xpToNextLevel)} XP`}</span>
              </div>
              <div className="progress-track" aria-label="Profile XP progress">
                <div className="progress-fill" style={{ width: xpRequired === Infinity ? "100%" : `${Math.min(100, (gameState.playerXP / xpRequired) * 100)}%` }} />
              </div>
            </div>

            <div className="profile-subgrid">
              <div className="profile-list-card">
                <h3>Region Progression</h3>
                <div className="profile-region-list">
                  {regionProgress.map((region) => (
                    <div className={region.current ? "profile-region-item current" : region.unlocked ? "profile-region-item unlocked" : "profile-region-item locked"} key={region.id}>
                      <span>{region.name}</span>
                      <strong>{region.current ? "Current" : region.unlocked ? `Unlocks at Lv. ${region.requiredLevel}` : "Locked"}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-list-card">
                <h3>Owned Ships</h3>
                {ownedShips.length > 0 ? (
                  <div className="profile-owned-grid">
                    {ownedShips.map((ship) => (
                      <ProfileAssetCard
                        key={ship.id}
                        image={SHIP_IMAGES[ship.id]}
                        label={ship.name}
                        detail={`Lv. ${ship.level} • Hull ${formatNumber(ship.hull)}`}
                        active={ship.id === currentShip.id}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="shop-note">No ships owned yet.</p>
                )}
              </div>
            </div>
          </article>

          <article className="dashboard-panel profile-panel">
            <h2>Fleet Inventory</h2>
            <div className="profile-subgrid">
              <div className="profile-list-card">
                <h3>Owned Cannon Types</h3>
                <div className="profile-owned-grid">
                  {ownedCannons.map((cannon) => (
                    <ProfileAssetCard
                      key={cannon.id}
                      image={CANNON_IMAGES[cannon.tier]}
                      label={cannon.name}
                      detail={`Owned ${formatNumber(cannon.owned)} • Equipped ${formatNumber(cannon.equipped)}`}
                      active={currentCannon.id === cannon.id}
                    />
                  ))}
                </div>
              </div>

              <div className="profile-list-card">
                <h3>Owned Ammunition</h3>
                <div className="profile-owned-grid">
                  {ownedAmmo.map((ammo) => (
                    <ProfileAssetCard
                      key={ammo.id}
                      image={UI_CANNONBALLS}
                      label={ammo.name}
                      detail={`Stored ${formatNumber(ammo.owned)} • ${Math.round(ammo.damageMultiplier * 100)}% damage`}
                      active={ammo.id === gameState.selectedAmmoId}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="dashboard-panel profile-panel">
            <h2>Account Actions</h2>
            <div className="button-row profile-action-row">
              {user ? (
                <button className="chunky-button danger" onClick={logout} type="button">
                  Logout
                </button>
              ) : null}
              <button className="chunky-button primary" onClick={handleExportSave} type="button">
                Export Save
              </button>
              <button className="chunky-button primary" onClick={handleChooseImportFile} type="button">
                Import Save
              </button>
              <button className="chunky-button" onClick={() => onNavigate?.("settings")} type="button">
                Open Settings
              </button>
            </div>
            <input
              accept=".json,application/json"
              className="save-file-input"
              hidden
              onChange={handleImportFile}
              ref={fileInputRef}
              type="file"
            />
          </article>
        </section>
      </div>
    </section>
  );
}

function ProfileAssetCard({ image, label, detail, active }) {
  return (
    <div className={active ? "profile-asset-card active" : "profile-asset-card"}>
      <img alt={label} src={image} />
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-box profile-stat-box">
      {icon ? <img alt={label} className="profile-stat-icon" src={icon} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function formatPreferenceValue(value) {
  return value.replace(/^[a-z]/, (letter) => letter.toUpperCase());
}

export default Profile;
