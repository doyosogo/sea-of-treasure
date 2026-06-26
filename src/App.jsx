import { useCallback, useEffect, useRef, useState } from "react";
import OfflineSummary from "./components/OfflineSummary.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { getCloudSave, uploadCloudSave } from "./services/save.js";
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
import Settings from "./pages/Settings.jsx";
import { useGameState } from "./hooks/useGameState.js";

const pageRegistry = {
  dashboard: { label: "Dashboard", component: Dashboard },
  myShip: { label: "My Ship", component: MyShip },
  crew: { label: "Crew", component: Crew },
  battle: { label: "Battle", component: Battle },
  quests: { label: "Quests", component: Quests },
  skills: { label: "Skills", component: Skills },
  talents: { label: "Talents", component: Talents },
  shop: { label: "Shop", component: Shop },
  port: { label: "Port", component: Port },
  achievements: { label: "Achievements", component: Achievements },
  settings: { label: "Settings", component: Settings },
  treasure: { label: "Treasure", component: Treasure }
};

const navOrder = ["dashboard", "myShip", "battle", "quests", "crew", "skills", "talents", "shop", "port", "achievements", "settings"];

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="app-loading-screen">
        <span>Loading Sea of Treasure...</span>
      </div>
    );
  }

  if (!user && !offlineMode) {
    return <Landing onPlayOffline={() => setOfflineMode(true)} />;
  }

  return <GameApp />;
}

function GameApp() {
  const { user, accessToken } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
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

  const syncSaveNow = useCallback(async (saveData = latestSaveRef.current) => {
    if (!user || !accessToken || !saveData) {
      setCloudSync((state) => ({
        ...state,
        status: "offline",
        message: "Playing offline."
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
      setCloudSync({
        status: "synced",
        message: "Synced",
        lastUpdated: result.save?.updatedAt ?? new Date().toISOString(),
        ready: true
      });
    } catch (error) {
      console.warn("Cloud save upload failed.", error);
      setCloudSync((state) => ({
        ...state,
        status: "error",
        message: "Cloud sync failed. Will retry on next save.",
        ready: true
      }));
    } finally {
      uploadInFlightRef.current = false;
    }
  }, [accessToken, user]);

  const handlePersist = useCallback((saveData) => {
    latestSaveRef.current = saveData;

    if (!user || !accessToken || !cloudReadyRef.current) {
      return;
    }

    window.clearTimeout(uploadTimerRef.current);
    uploadTimerRef.current = window.setTimeout(() => {
      syncSaveNow(saveData);
    }, 1500);
  }, [accessToken, syncSaveNow, user]);

  const { gameState, dispatch, applyCloudSave } = useGameState({ onPersist: handlePersist });
  const ActivePage = pageRegistry[activePage].component;

  useEffect(() => {
    latestSaveRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    cloudReadyRef.current = false;
    window.clearTimeout(uploadTimerRef.current);

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
          setCloudSync({
            status: "synced",
            message: "No cloud save found.",
            lastUpdated: null,
            ready: true
          });
          return;
        }

        applyCloudSave(result.save.data);
        cloudReadyRef.current = true;
        setCloudSync({
          status: "synced",
          message: "Cloud save loaded.",
          lastUpdated: result.save.updatedAt,
          ready: true
        });
      } catch (error) {
        console.warn("Cloud save download failed.", error);

        if (!cancelled) {
          cloudReadyRef.current = true;
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

  return (
    <div className="app-shell">
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
          onSyncNow={() => syncSaveNow(gameState)}
        />
      </main>

      <OfflineSummary gameState={gameState} dispatch={dispatch} />
    </div>
  );
}

function getNavClass(pageId, activePage) {
  const baseClass = pageId === "battle" ? "nav-link battle-nav" : "nav-link";
  return activePage === pageId ? `${baseClass} active` : baseClass;
}

export default App;
