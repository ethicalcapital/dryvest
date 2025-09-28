import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Wizard from "./pages/Wizard.jsx";
import Library from "./pages/Library.jsx";
import Output from "./pages/Output.jsx";
import FactCheck from "./pages/FactCheck.jsx";

function TopNav() {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="Dryvest Home">
          <span className="badge">ETHICAL</span>
          <span className="brand-name">Dryvest</span>
        </Link>
        <nav className="mainnav" aria-label="Primary">
          <NavLink to="/brief" className={({isActive}) => isActive ? "navlink active" : "navlink"}>Build Brief</NavLink>
          <NavLink to="/explore" className={({isActive}) => isActive ? "navlink active" : "navlink"}>Explore</NavLink>
          <NavLink to="/library" className={({isActive}) => isActive ? "navlink active" : "navlink"}>Library</NavLink>
        </nav>
        <div className="cta-area">
          {pathname !== "/brief" && (
            <Link to="/brief" className="btn primary">Get Started</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <TopNav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/brief" element={<Wizard />} />
          <Route path="/output" element={<Output />} />
          <Route path="/library" element={<Library initialTab="docs" />} />
          <Route path="/explore" element={<FactCheck initialType="points" />} />
          <Route path="/facts" element={<FactCheck initialType="facts" />} />
          <Route path="/documents" element={<Library initialTab="docs" />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <small>© {new Date().getFullYear()} Invest Vegan LLC DBA Ethical Capital. Educational intelligence only.</small>
          <div className="foot-links">
            <a href="#" aria-label="Disclosures">Disclosures</a>
            <a href="#" aria-label="Privacy">Privacy</a>
            <a href="#" aria-label="Terms">Terms</a>
            <a href="#" aria-label="Contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
