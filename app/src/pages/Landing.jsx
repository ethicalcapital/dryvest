import { Link } from "react-router-dom";
import { DOCS } from "../data.js";
import { downloadString } from "../utils/download.js";

const FEATURED_DOCS = DOCS.slice(0, 3);

export default function Landing() {
  return (
    <div className="grid" style={{gap:24}}>
      <section className="hero" role="region" aria-label="Welcome">
        <div>
          <h1>Make divestment so boring it happens.</h1>
          <p>
            Dryvest translates moral demands into implementable investment policy.
            Start with a quick brief, then export the talking points, model documents, and facts you need.
          </p>
          <div className="cta">
            <Link to="/brief" className="btn primary">Get Started</Link>
            <Link to="/explore" className="btn secondary" aria-label="Open dataset explorer">
              Explore Key Points
            </Link>
            <Link to="/library" className="btn ghost" aria-label="Open library">
              Browse Library
            </Link>
          </div>
          <div style={{marginTop:12, color:"#b3bed1"}}>
            <span className="kbd">Pro tip</span> Warm up in the <Link to="/explore">Explore</Link> deck before locking in your brief.
          </div>
        </div>
        <div className="card">
          <div className="section">
            <h2>How it works</h2>
            <p>Answer 3 quick questions. We’ll tailor the brief to your investor profile and priorities.</p>
          </div>
          <ol className="list">
            <li className="list-row" style={{gridTemplateColumns:"24px 1fr"}}>
              <div className="tag">1</div>
              <div><strong>Pick the organization type</strong> (e.g. Public Pension, Endowment, Foundation).</div>
            </li>
            <li className="list-row" style={{gridTemplateColumns:"24px 1fr"}}>
              <div className="tag">2</div>
              <div><strong>Choose who must say yes</strong> (board, committee, staff).</div>
            </li>
            <li className="list-row" style={{gridTemplateColumns:"24px 1fr"}}>
              <div className="tag">3</div>
              <div><strong>Rank campaign drivers</strong> (regulatory, internal, external). Export your brief.</div>
            </li>
          </ol>
        </div>
      </section>

      <section className="card" aria-label="Featured documents">
        <div className="section" style={{marginTop:0}}>
          <h2>Model documents ready to go</h2>
          <p className="meta">These open instantly from the landing page so you can skim before building a brief.</p>
        </div>
        <div className="grid cols-3">
          {FEATURED_DOCS.map((doc) => (
            <article key={doc.id} className="card" style={{display:"grid", gap:10}}>
              <div>
                <h3 style={{margin:"0 0 6px"}}>{doc.title}</h3>
                <p className="meta">{doc.summary}</p>
              </div>
              <div className="codeblock" style={{maxHeight:140, overflowY:"auto"}}>
                {doc.body.slice(0, 320)}{doc.body.length > 320 ? " …" : ""}
              </div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {doc.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                <Link className="btn secondary" to={`/library#${doc.id}`}>Open in library</Link>
                <button
                  className="btn ghost"
                  onClick={() => {
                    const preview = `# Preview — ${doc.title}\n\n${doc.body}`;
                    downloadString(`${doc.id}-preview.md`, "text/markdown", preview);
                  }}
                >
                  Download preview
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
