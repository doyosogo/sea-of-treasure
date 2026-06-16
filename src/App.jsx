import { useState } from "react";
import OfflineSummary from "./components/OfflineSummary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Fleet from "./pages/Fleet.jsx";
import Skills from "./pages/Skills.jsx";
import Talents from "./pages/Talents.jsx";
import Port from "./pages/Port.jsx";
import Treasure from "./pages/Treasure.jsx";
import Shipwright from "./pages/Shipwright.jsx";
import Achievements from "./pages/Achievements.jsx";
import Materials from "./pages/Materials.jsx";
import { useGameState } from "./hooks/useGameState.js";

const pages = {
  dashboard: { label: "Dashboard", component: Dashboard },
  fleet: { label: "Fleet", component: Fleet },
  treasure: { label: "Treasure", component: Treasure },
  shipwright: { label: "Shipwright", component: Shipwright },
  materials: { label: "Materials", component: Materials },
  achievements: { label: "Achievements", component: Achievements },
  skills: { label: "Skills", component: Skills },
  talents: { label: "Talents", component: Talents },
  port: { label: "Port", component: Port }
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const { gameState, dispatch } = useGameState();
  const ActivePage = pages[activePage].component;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Sea of Treasure</div>
        <nav className="main-nav" aria-label="Primary navigation">
          {Object.entries(pages).map(([pageId, page]) => (
            <button
              className={activePage === pageId ? "nav-link active" : "nav-link"}
              key={pageId}
              onClick={() => setActivePage(pageId)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-frame">
        <ActivePage gameState={gameState} dispatch={dispatch} />
      </main>

      <OfflineSummary gameState={gameState} dispatch={dispatch} />
    </div>
  );
}

export default App;
