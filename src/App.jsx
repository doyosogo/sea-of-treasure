import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Fleet from "./pages/Fleet.jsx";
import Skills from "./pages/Skills.jsx";
import Talents from "./pages/Talents.jsx";
import Port from "./pages/Port.jsx";

const pages = {
  dashboard: { label: "Dashboard", component: Dashboard },
  fleet: { label: "Fleet", component: Fleet },
  skills: { label: "Skills", component: Skills },
  talents: { label: "Talents", component: Talents },
  port: { label: "Port", component: Port }
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
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
        <ActivePage />
      </main>
    </div>
  );
}

export default App;
