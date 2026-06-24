import { useState } from "react";
import OfflineSummary from "./components/OfflineSummary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Battle from "./pages/Battle.jsx";
import Fleet from "./pages/Fleet.jsx";
import MyShip from "./pages/MyShip.jsx";
import Quests from "./pages/Quests.jsx";
import Skills from "./pages/Skills.jsx";
import Talents from "./pages/Talents.jsx";
import Shop from "./pages/Shop.jsx";
import Port from "./pages/Port.jsx";
import Treasure from "./pages/Treasure.jsx";
import Shipwright from "./pages/Shipwright.jsx";
import Achievements from "./pages/Achievements.jsx";
import Materials from "./pages/Materials.jsx";
import Settings from "./pages/Settings.jsx";
import { useGameState } from "./hooks/useGameState.js";

const pageRegistry = {
  dashboard: { label: "Dashboard", component: Dashboard },
  myShip: { label: "My Ship", component: MyShip },
  battle: { label: "Battle", component: Battle },
  quests: { label: "Quests", component: Quests },
  skills: { label: "Skills", component: Skills },
  talents: { label: "Talents", component: Talents },
  shop: { label: "Shop", component: Shop },
  port: { label: "Port", component: Port },
  achievements: { label: "Achievements", component: Achievements },
  settings: { label: "Settings", component: Settings },
  fleet: { label: "Fleet", component: Fleet },
  shipwright: { label: "Shipwright", component: Shipwright },
  materials: { label: "Materials", component: Materials },
  treasure: { label: "Treasure", component: Treasure }
};

const navOrder = ["dashboard", "myShip", "battle", "quests", "skills", "talents", "shop", "port", "achievements", "settings"];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const { gameState, dispatch } = useGameState();
  const ActivePage = pageRegistry[activePage].component;

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
        <ActivePage gameState={gameState} dispatch={dispatch} onNavigate={setActivePage} />
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
