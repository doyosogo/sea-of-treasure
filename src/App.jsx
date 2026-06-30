import { useCallback, useEffect, useRef, useState } from "react";
import OfflineSummary from "./components/OfflineSummary.jsx";
import NotificationToast from "./components/NotificationToast.jsx";
import SaveConflictModal from "./components/SaveConflictModal.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { NotificationProvider, useNotifications } from "./context/NotificationContext.jsx";
import audioManager from "./services/audioManager.js";
import { getCloudSave, getSaveSummary, uploadCloudSave } from "./services/save.js";
import Dashboard from "./pages/Dashboard.jsx";
import Battle from "./pages/Battle.jsx";
import Landing from "./pages/Landing.jsx";
import MyShip from "./pages/MyShip.jsx";
import Crew from "./pages/Crew.jsx";
import Quests from "./pages/Quests.jsx";
import Skills from "./pages/Skills.jsx";
import Talents from "./pages/Talents.jsx";
import Shop from "./pages/Shop.jsx";
import Port from "./pages/Port.jsx";
import Treasure from "./pages/Treasure.jsx";
import Achievements from "./pages/Achievements.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import TutorialOverlay from "./components/TutorialOverlay.jsx";
import { STORAGE_KEY, useGameState } from "./hooks/useGameState.js";
import { getCaptainRankTitle } from "./utils/gameEngine.js";

const pageRegistry = {
  dashboard: { label: "Dashboard", component: Dashboard, backgroundMusic: "captain-cabin" },
  myShip: { label: "My Ship", component: MyShip, backgroundMusic: "shipyard" },
  crew: { label: "Crew", component: Crew, backgroundMusic: "academy" },
  battle: { label: "Battle", component: Battle, backgroundMusic: "combat" },
  quests: { label: "Quests", component: Quests, backgroundMusic: "orders" },
  skills: { label: "Skills", component: Skills, backgroundMusic: "academy" },
  talents: { label: "Talents", component: Talents, backgroundMusic: "academy" },
  shop: { label: "Shop", component: Shop, backgroundMusic: "market" },
  port: { label: "Port", component: Port, backgroundMusic: "harbour" },
  achievements: { label: "Achievements", component: Achievements, backgroundMusic: "legends" },
  profile: { label: "Profile", component: Profile, backgroundMusic: "captain-cabin" },
  settings: { label: "Settings", component: Settings, backgroundMusic: "captain-cabin" },
  treasure: { label: "Treasure", component: Treasure, backgroundMusic: "treasure" }
};

const navOrder = ["dashboard", "myShip", "battle", "quests", "crew", "skills", "talents", "shop", "port", "achievements", "profile", "settings"];

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { showInfo } = useNotifications();
  const [offlineMode, setOfflineMode] = useState(false);
  const hadAuthenticatedSessionRef = useRef(false);

  useEffect(() => {
    if (user) {
      hadAuthenticatedSessionRef.current = true;
      setOfflineMode(false);
      return;
    }

    if (hadAuthenticatedSessionRef.current) {
      setOfflineMode(true);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user && !offlineMode) {
      audioManager.playMusic("menu", { fadeMs: 450 });
    }
  }, [loading, offlineMode, user]);

  if (loading) {
    return (
      <div className="app-loading-screen">
        <span className="button-loading">
          <span className="button-spinner" aria-hidden="true" />
          <span>Loading Sea of Treasure...</span>
        </span>
      </div>
    );
  }

  if (!user && !offlineMode) {
    return <Landing onPlayOffline={() => { setOfflineMode(true); showInfo("Offline mode entered."); }} />;
  }

  return <GameApp />;
}

function GameApp() {
  const { user, accessToken } = useAuth();
  const { showError, showInfo, showSuccess } = useNotifications();
  const [activePage, setActivePage] = useState("dashboard");
  const [saveConflict, setSaveConflict] = useState(null);
  const [cloudSync, setCloudSync] = useState({
    status: user ? "syncing" : "offline",
    message: user ? "Checking cloud save..." : "Playing offline.",
    lastUpdated: null,
    ready: false
  });
  const uploadTimerRef = useRef(null);
  const latestSaveRef = useRef(null);
  const uploadInFlightRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const localSaveAtLoginRef = useRef(null);
  const activeWorldEventIdRef = useRef(null);
  const worldEventWatcherReadyRef = useRef(false);
  const captainPromotionHistoryLengthRef = useRef(null);
  const tutorialCompletedRef = useRef(null);
  const previousBattleStateRef = useRef(null);
  const previousPlayerLevelRef = useRef(null);
  const previousActivityLogRef = useRef(null);
  const previousTreasureCountRef = useRef(null);

  if (user && localSaveAtLoginRef.current === null) {
    localSaveAtLoginRef.current = Boolean(localStorage.getItem(STORAGE_KEY));
  }

  useEffect(() => {
    if (!user) {
      localSaveAtLoginRef.current = null;
      setSaveConflict(null);
    }
  }, [user]);

  const syncSaveNow = useCallback(async (saveData = latestSaveRef.current, options = {}) => {
    const force = Boolean(options.force);

    if (!user || !accessToken || !saveData) {
      setCloudSync((state) => ({
        ...state,
        status: "offline",
        message: "Playing offline."
      }));
      return;
    }

    if (!force && saveConflict?.unresolved) {
      setCloudSync((state) => ({
        ...state,
        status: "conflict",
        message: "Conflict unresolved.",
        ready: false
      }));
      return;
    }

    if (uploadInFlightRef.current) {
      return;
    }

    uploadInFlightRef.current = true;
    setCloudSync((state) => ({
      ...state,
      status: "syncing",
      message: "Syncing..."
    }));

    try {
      const result = await uploadCloudSave(saveData, accessToken);
      showSuccess("Cloud save synced.");
      audioManager.playSfx("cloud-sync-success");
      setCloudSync({
        status: "synced",
        message: "Synced",
        lastUpdated: result.save?.updatedAt ?? new Date().toISOString(),
        ready: true
      });
    } catch (error) {
      console.warn("Cloud save upload failed.", error);
      showError("Cloud save failed.");
      audioManager.playSfx("cloud-sync-failure");
      setCloudSync((state) => ({
        ...state,
        status: "error",
        message: "Cloud sync failed. Will retry on next save.",
        ready: true
      }));
    } finally {
      uploadInFlightRef.current = false;
    }
  }, [accessToken, saveConflict?.unresolved, showError, showSuccess, user]);

  const handlePersist = useCallback((saveData) => {
    latestSaveRef.current = saveData;

    if (!user || !accessToken || !cloudReadyRef.current || saveConflict?.unresolved) {
      return;
    }

    window.clearTimeout(uploadTimerRef.current);
    const autosaveDelayMs = Math.max(0, (saveData.preferences?.autosaveIntervalSeconds ?? 30) * 1000);
    uploadTimerRef.current = window.setTimeout(() => {
      syncSaveNow(saveData);
    }, autosaveDelayMs);
  }, [accessToken, saveConflict?.unresolved, syncSaveNow, user]);

  const { gameState, dispatch, applyCloudSave } = useGameState({ onPersist: handlePersist });
  const ActivePage = pageRegistry[activePage].component;
  const activeMusicTrack = pageRegistry[activePage]?.backgroundMusic ?? null;
  const audioPreferences = gameState.preferences ?? {};
  const uiScaleClass = `ui-scale-${gameState.preferences?.uiScale ?? "normal"}`;
  const compactModeClass = gameState.preferences?.compactMode ? " compact-mode" : "";

  useEffect(() => {
    latestSaveRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    audioManager.setMusicVolume(audioPreferences.musicVolume ?? 70);
    audioManager.setSfxVolume(audioPreferences.sfxVolume ?? 70);
    audioManager.setMusicMuted(Boolean(audioPreferences.muteMusic));
    audioManager.setSfxMuted(Boolean(audioPreferences.muteSfx));
    audioManager.setMasterMute(Boolean(audioPreferences.masterMute));

    if (!audioPreferences.masterMute) {
      if (activeMusicTrack) {
        audioManager.playMusic(activeMusicTrack, { fadeMs: 400 });
      } else {
        audioManager.stopMusic({ fadeMs: 250 });
      }
    }
  }, [
    activeMusicTrack,
    audioPreferences.masterMute,
    audioPreferences.musicVolume,
    audioPreferences.muteMusic,
    audioPreferences.muteSfx,
    audioPreferences.sfxVolume
  ]);

  useEffect(() => {
    const activeWorldEventId = gameState.activeWorldEvent?.id ?? null;

    if (worldEventWatcherReadyRef.current && activeWorldEventId && activeWorldEventIdRef.current !== activeWorldEventId) {
      showInfo("World event began.", { detail: gameState.activeWorldEvent?.name ?? "A new event is active." });
    }

    activeWorldEventIdRef.current = activeWorldEventId;
    worldEventWatcherReadyRef.current = true;
  }, [gameState.activeWorldEvent?.id, gameState.activeWorldEvent?.name, showInfo]);

  useEffect(() => {
    const promotionHistory = gameState.captainProgression?.promotionHistory ?? [];

    if (captainPromotionHistoryLengthRef.current === null) {
      captainPromotionHistoryLengthRef.current = promotionHistory.length;
      return;
    }

    const previousLength = captainPromotionHistoryLengthRef.current;

    if (promotionHistory.length > previousLength) {
      const newPromotions = promotionHistory.slice(previousLength);

      for (const promotionLevel of newPromotions) {
        const rankTitle = getCaptainRankTitle(promotionLevel);
        showSuccess({
          title: "PROMOTION",
          message: "Congratulations!",
          detail: `You have been promoted to:\n${rankTitle}\n\nReward:\n+1 Permanent Cannon Slot`
        });
        audioManager.playSfx("captain-promotion");
      }
    }

    captainPromotionHistoryLengthRef.current = promotionHistory.length;
  }, [gameState.captainProgression?.promotionHistory, showSuccess]);

  useEffect(() => {
    const tutorial = gameState.tutorial ?? { completed: true };
    const isCompleted = Boolean(tutorial.completed);

    if (tutorialCompletedRef.current === null) {
      tutorialCompletedRef.current = isCompleted;
      return;
    }

    if (!tutorialCompletedRef.current && isCompleted) {
      showSuccess({
        title: "Tutorial Complete",
        message: "The Admiralty is pleased with your progress.",
        detail: "Gold, ammo, and a Doubloon have been awarded."
      });
    }

    tutorialCompletedRef.current = isCompleted;
  }, [gameState.tutorial?.completed, showSuccess]);

  useEffect(() => {
    const battleActive = Boolean(gameState.currentBattle);

    if (previousBattleStateRef.current === null) {
      previousBattleStateRef.current = battleActive;
      return;
    }

    if (!previousBattleStateRef.current && battleActive) {
      audioManager.playSfx("battle-start");
    }

    if (previousBattleStateRef.current && !battleActive) {
      const latestMessage = gameState.activityLog?.[0]?.message ?? "";

      if (latestMessage.startsWith("Victory:")) {
        audioManager.playSfx("victory");
      } else if (latestMessage.includes("Battle lost")) {
        audioManager.playSfx("defeat");
      }
    }

    previousBattleStateRef.current = battleActive;
  }, [gameState.activityLog, gameState.currentBattle]);

  useEffect(() => {
    const currentLevel = gameState.playerLevel ?? 1;

    if (previousPlayerLevelRef.current === null) {
      previousPlayerLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > previousPlayerLevelRef.current) {
      audioManager.playSfx("level-up");
    }

    previousPlayerLevelRef.current = currentLevel;
  }, [gameState.playerLevel]);

  useEffect(() => {
    const currentLogMessage = gameState.activityLog?.[0]?.message ?? null;

    if (previousActivityLogRef.current === null) {
      previousActivityLogRef.current = currentLogMessage;
      return;
    }

    if (currentLogMessage && currentLogMessage !== previousActivityLogRef.current) {
      if (currentLogMessage.startsWith("Bought ") || currentLogMessage.startsWith("Crafted ")) {
        audioManager.playSfx("purchase");
      } else if (currentLogMessage.startsWith("Quest completed:")) {
        audioManager.playSfx("quest-complete");
      } else if (currentLogMessage.startsWith("Achievement claimed:")) {
        audioManager.playSfx("achievement-claimed");
      } else if (currentLogMessage.includes("Idle combat defeated")) {
        audioManager.playSfx("victory");
      } else if (currentLogMessage.includes("Idle combat stopped")) {
        audioManager.playSfx("defeat");
      } else if (
        currentLogMessage.includes("treasure map") ||
        currentLogMessage.includes("Rare Map Piece") ||
        currentLogMessage.includes("treasure dig complete")
      ) {
        audioManager.playSfx("treasure-found");
      }
    }

    previousActivityLogRef.current = currentLogMessage;
  }, [gameState.activityLog]);

  useEffect(() => {
    const currentTreasureCount = gameState.treasureInventory?.length ?? 0;

    if (previousTreasureCountRef.current === null) {
      previousTreasureCountRef.current = currentTreasureCount;
      return;
    }

    if (currentTreasureCount > previousTreasureCountRef.current) {
      audioManager.playSfx("treasure-found");
    }

    previousTreasureCountRef.current = currentTreasureCount;
  }, [gameState.treasureInventory?.length]);

  useEffect(() => {
    function handleClick(event) {
      const target = event.target instanceof Element ? event.target.closest("button") : null;

      if (!target || target.disabled) {
        return;
      }

      audioManager.playSfx("ui-click");
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    cloudReadyRef.current = false;
    window.clearTimeout(uploadTimerRef.current);
    setSaveConflict(null);

    if (!user || !accessToken) {
      setCloudSync({
        status: "offline",
        message: "Playing offline.",
        lastUpdated: null,
        ready: false
      });
      return undefined;
    }

    let cancelled = false;

    async function loadCloudSave() {
      setCloudSync({
        status: "syncing",
        message: "Checking cloud save...",
        lastUpdated: null,
        ready: false
      });

      try {
        const result = await getCloudSave(accessToken);

        if (cancelled) {
          return;
        }

        if (!result.save) {
          cloudReadyRef.current = true;
          showInfo("No cloud save found.");
          setCloudSync({
            status: "synced",
            message: "No cloud save found.",
            lastUpdated: null,
            ready: true
          });
          return;
        }

        if (!localSaveAtLoginRef.current) {
          applyCloudSave(result.save.data, { persistLocalStorage: true });
          cloudReadyRef.current = true;
          showSuccess("Cloud save loaded.");
          setCloudSync({
            status: "synced",
            message: "Cloud save loaded.",
            lastUpdated: result.save.updatedAt,
            ready: true
          });
          return;
        }

        setSaveConflict({
          localSummary: getSaveSummary(latestSaveRef.current),
          cloudSummary: getSaveSummary(result.save.data),
          cloudSave: result.save.data,
          cloudUpdatedAt: result.save.updatedAt,
          unresolved: true,
          open: true
        });
        setCloudSync({
          status: "conflict",
          message: "Conflict unresolved.",
          lastUpdated: result.save.updatedAt,
          ready: false
        });
      } catch (error) {
        console.warn("Cloud save download failed.", error);

        if (!cancelled) {
          cloudReadyRef.current = true;
          showError("Cloud save unavailable.");
          setCloudSync({
            status: "error",
            message: "Cloud save unavailable.",
            lastUpdated: null,
            ready: true
          });
        }
      }
    }

    loadCloudSave();

    return () => {
      cancelled = true;
      window.clearTimeout(uploadTimerRef.current);
    };
  }, [accessToken, applyCloudSave, user]);

  async function handleResolveSaveConflict(choice) {
    if (!saveConflict) {
      return;
    }

    if (choice === "local") {
      setSaveConflict((current) => (current ? { ...current, open: false, unresolved: false } : current));
      cloudReadyRef.current = true;
      await syncSaveNow(gameState, { force: true });
      showSuccess("Conflict resolved.", { detail: "Using local save." });
      return;
    }

    if (choice === "cloud") {
      applyCloudSave(saveConflict.cloudSave, { persistLocalStorage: true });
      cloudReadyRef.current = true;
      setSaveConflict(null);
      showSuccess("Conflict resolved.", { detail: "Using cloud save." });
      setCloudSync({
        status: "synced",
        message: "Synced",
        lastUpdated: saveConflict.cloudUpdatedAt,
        ready: true
      });
      return;
    }

    setSaveConflict((current) => (current ? { ...current, open: false, unresolved: true } : current));
    setCloudSync((current) => ({
      ...current,
      status: "conflict",
      message: "Conflict unresolved.",
      ready: false
    }));
  }

  return (
    <div className={`app-shell ${uiScaleClass}${compactModeClass}`}>
      <header className="topbar">
        <div className="brand">Sea of Treasure</div>
        <nav className="main-nav" aria-label="Primary navigation">
          {navOrder.map((pageId) => (
            <button
              className={getNavClass(pageId, activePage)}
              key={pageId}
              onClick={() => setActivePage(pageId)}
              type="button"
            >
              {pageRegistry[pageId].label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-frame">
        <ActivePage
          cloudSync={cloudSync}
          dispatch={dispatch}
          gameState={gameState}
          onNavigate={setActivePage}
          onResolveSaveConflict={() => setSaveConflict((current) => (current ? { ...current, open: true } : current))}
          onSyncNow={() => syncSaveNow(gameState)}
          saveConflict={saveConflict}
        />
      </main>

      <TutorialOverlay
        activePage={activePage}
        dispatch={dispatch}
        gameState={gameState}
        onNavigate={setActivePage}
      />

      <SaveConflictModal
        conflict={saveConflict?.open ? saveConflict : null}
        onCancel={() => handleResolveSaveConflict("cancel")}
        onUseCloud={() => handleResolveSaveConflict("cloud")}
        onUseLocal={() => handleResolveSaveConflict("local")}
      />
      <OfflineSummary gameState={gameState} dispatch={dispatch} />
      <NotificationToast />
    </div>
  );
}

function getNavClass(pageId, activePage) {
  const baseClass = pageId === "battle" ? "nav-link battle-nav" : "nav-link";
  return activePage === pageId ? `${baseClass} active` : baseClass;
}

export default App;
