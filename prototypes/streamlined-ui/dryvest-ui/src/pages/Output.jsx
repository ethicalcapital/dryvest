import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AUDIENCES,
  DOCS,
  DRIVERS,
  ORGANIZATIONS,
  KEY_POINTS,
  NEXT_STEPS,
  FACTS
} from "../data.js";
import { downloadString, copyToClipboard } from "../utils/download.js";

const ORG_NAMES = Object.fromEntries(ORGANIZATIONS.map((o) => [o.id, o.name]));
const DRIVER_NAMES = Object.fromEntries(DRIVERS.map((d) => [d.id, d.name]));
const AUDIENCE_NAMES = Object.fromEntries(AUDIENCES.map((a) => [a.id, a.name]));
const ALL_ORGS = ORGANIZATIONS.map((o) => o.id);
const ALL_DRIVERS = DRIVERS.map((d) => d.id);
const ALL_AUDIENCES = AUDIENCES.map((a) => a.id);

const ORG_NOTES = {
  corp: {
    why: "ERISA framing, prudence, and reporting controls resonate with corporate pension fiduciaries.",
    move: ["Tie divestment to risk controls and vendor accountability.", "Emphasize tracking-error governance vs. stock picking."]
  },
  public: {
    why: "Public plans weigh legal/compliance optics and coalition pressure.",
    move: ["Show policy clarity reduces reputational risk.", "Cite peer policies for cover."]
  },
  univ: {
    why: "Endowments balance donor values with long-horizon stewardship.",
    move: ["Frame values + academic leadership.", "Offer phased implementation roadmap."]
  },
  foundation: {
    why: "Mission alignment & grantmaking integrity matter.",
    move: ["Connect investment screens to program outcomes.", "Provide simple exclusion governance."]
  },
  ins: {
    why: "ALM + regulatory filing simplicity.",
    move: ["Show low-friction screening in general account.", "Underscore auditability."]
  },
  wealth: {
    why: "Policy coherence and sovereign precedent.",
    move: ["Point to international norms and peer examples."]
  },
  treasury: {
    why: "Procurement-style accountability, transparency.",
    move: ["Publish lists, cadence, and exception handling."]
  },
  central: {
    why: "Reserve policy + systemic risk narratives.",
    move: ["Risk to mandate credibility; cite global standards."]
  },
  individual: {
    why: "Personal values, simple switching costs.",
    move: ["Offer pre-built screened indexes / managers."]
  }
};

function matchScore(item, state) {
  const ctx = item.contexts || {};
  const orgs = ctx.orgs && ctx.orgs.length ? ctx.orgs : ALL_ORGS;
  const drivers = ctx.drivers && ctx.drivers.length ? ctx.drivers : ALL_DRIVERS;
  const audiences = ctx.audiences && ctx.audiences.length ? ctx.audiences : ALL_AUDIENCES;

  let score = 0;
  if (orgs.includes(state.org)) score += 3;
  if (drivers.includes(state.primary)) score += 2;
  if (state.secondary && drivers.includes(state.secondary)) score += 1;
  if (Array.isArray(state.audiences)) {
    const audienceHits = state.audiences.filter((a) => audiences.includes(a));
    score += audienceHits.length * 1.5;
  }
  return score;
}

function pickTop(items, state, limit = 3, fallbackPool = []) {
  const selected = items
    .map((item) => ({ item, score: matchScore(item, state) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);

  if (selected.length) return selected;
  if (fallbackPool.length) return fallbackPool.slice(0, limit);
  return items.slice(0, limit);
}

function pickCentralDocs(state) {
  const chosen = DOCS.filter((d) => state.docs.includes(d.id));
  if (chosen.length) return chosen;
  return pickTop(DOCS, state, 3, DOCS);
}

function describeMatches(item, state) {
  const ctx = item.contexts || {};
  const parts = [];
  if (ctx.orgs?.includes?.(state.org)) {
    parts.push(`Built for ${ORG_NAMES[state.org]}`);
  } else if (ctx.orgs?.length) {
    const preview = ctx.orgs.slice(0, 2).map((id) => ORG_NAMES[id] || id).join(", ");
    parts.push(`Common across ${preview}`);
  }
  const driverHits = [state.primary, state.secondary]
    .filter(Boolean)
    .filter((d) => ctx.drivers?.includes?.(d));
  if (driverHits.length) {
    parts.push(`Supports ${driverHits.map((d) => DRIVER_NAMES[d]).join(" & ")}`);
  }
  if (Array.isArray(state.audiences)) {
    const audienceHits = state.audiences.filter((a) => ctx.audiences?.includes?.(a));
    if (audienceHits.length) {
      parts.push(`Hand-off ready for ${audienceHits.map((a) => AUDIENCE_NAMES[a]).join(", ")}`);
    }
  }
  return parts.length ? parts.join(" • ") : "General-purpose template; pair with your own context.";
}

function buildMarkdown(state, centralDocs, talkingPoints, actionSteps, evidenceFacts) {
  const org = ORGANIZATIONS.find((o) => o.id === state.org);
  const prim = DRIVERS.find((d) => d.id === state.primary);
  const sec = DRIVERS.find((d) => d.id === state.secondary);
  const audNames = state.audiences.map((a) => AUDIENCES.find((x) => x.id === a)?.name ?? a);

  return `# Dryvest — QuickSieve Brief

**Organization:** ${org?.name ?? "—"}  
**Audience:** ${audNames.join(", ") || "—"}  
**Drivers:** Primary — ${prim?.name ?? "—"}; Secondary — ${sec?.name ?? "—"}

---

## Tailored Talking Points

${talkingPoints.length
    ? talkingPoints
        .map((p, idx) => `${idx + 1}. ${p.title}\n   ${p.body.replace(/\n+/g, ' ')}`)
        .join("\n\n")
    : '1. Connect the drivers you selected to fiduciary controls and cite the supporting documents below.'}

## Immediate Moves (30–90 days)
${actionSteps.length
    ? actionSteps.map((step, idx) => `${idx + 1}. ${step.text}`).join("\n")
    : '- Document current exposure and assign an owner to run the policy update.'}

## Central Ask
${centralDocs.length
    ? centralDocs
        .map((d) => `- ${d.title}: ${d.summary}\n  - Why now: ${describeMatches(d, state)}`)
        .join("\n")
    : '- Add supportive model documents from the Dryvest library.'}

## Evidence to Cite
${evidenceFacts.length
    ? evidenceFacts
        .map((fact, idx) => `${idx + 1}. ${fact.claim}\n   ${fact.support}\n   ${fact.citations
            .map((c) => `- ${c.title}${c.url ? ` (${c.url})` : ''}`)
            .join('\n   ')}`)
        .join('\n\n')
    : '- Draw from Dryvest library facts to support this briefing.'}

---
*Educational intelligence; not investment, legal, or tax advice.*`;
}

export default function Output() {
  const nav = useNavigate();
  const { state } = useLocation();

  if (!state || !state.org) {
    return (
      <div className="card">
        <p>We couldn’t find a brief to annotate.</p>
        <Link className="btn primary" to="/brief">Start a brief</Link>
      </div>
    );
  }

  const centralDocs = pickCentralDocs(state);
  const talkingPoints = pickTop(KEY_POINTS, state, 4, KEY_POINTS);
  const actionSteps = pickTop(NEXT_STEPS, state, 4, NEXT_STEPS);
  const evidenceFacts = pickTop(FACTS, state, 3, FACTS);
  const markdown = buildMarkdown(state, centralDocs, talkingPoints, actionSteps, evidenceFacts);
  const orgNote = ORG_NOTES[state.org];

  return (
    <div className="card annot">
      <h2>Annotated Brief</h2>

      <div className="callout">
        <h4>Context recap</h4>
        <div className="meta">
          <strong>Org:</strong> {state.org} · <strong>Audience:</strong> {state.audiences.join(", ") || "—"} · <strong>Drivers:</strong> {state.primary || "—"}
          {state.secondary ? `, ${state.secondary}` : ""}
        </div>
      </div>

      {orgNote && (
        <div className="callout">
          <h4>Why this resonates for your org</h4>
          <p>{orgNote.why}</p>
          <ul>
            {orgNote.move.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="callout">
        <h4>How to use this in the meeting</h4>
        <ul>
          <li>Open with the <strong>driver</strong> they care about most ({state.primary}).</li>
          <li>Show <strong>implementation</strong> first (it reduces fear of change), then the values statement.</li>
          <li>End with a concrete <strong>motion</strong> and reporting cadence.</li>
        </ul>
      </div>

      <div className="callout">
        <h4>Tailored talking points</h4>
        {talkingPoints.length ? (
          <ul>
            {talkingPoints.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong>
                <div className="meta">{describeMatches(p, state)}</div>
                <div>{p.body}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">Pull in key points from the Library to tailor this briefing further.</p>
        )}
      </div>

      <div className="callout">
        <h4>Central ask &amp; supporting documents</h4>
        {centralDocs.length ? (
          <ul>
            {centralDocs.map((doc) => (
              <li key={doc.id}>
                <strong>{doc.title}</strong> — {doc.summary}
                <div className="meta">{describeMatches(doc, state)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">Add model documents from the Library to reinforce your ask.</p>
        )}
      </div>

      <div className="callout">
        <h4>Next moves</h4>
        {actionSteps.length ? (
          <ol>
            {actionSteps.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        ) : (
          <p className="meta">Add next steps to give stakeholders a concrete to-do list.</p>
        )}
      </div>

      <div className="callout">
        <h4>Evidence to cite</h4>
        {evidenceFacts.length ? (
          <ul>
            {evidenceFacts.map((fact) => (
              <li key={fact.id}>
                <strong>{fact.claim}</strong>
                <div>{fact.support}</div>
                <div className="meta">
                  {fact.citations.map((c, idx) => (
                    <div key={idx}>• {c.title}{c.url ? ` — ${c.url}` : ""}</div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">Add facts from the Library to backstop your talking points.</p>
        )}
      </div>

      <div>
        <h3>Brief (Markdown)</h3>
        <div className="codeblock">{markdown}</div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => downloadString("dryvest-brief.md", "text/markdown", markdown)}>
            Download
          </button>
          <button
            className="btn secondary"
            onClick={async () => {
              await copyToClipboard(markdown);
              alert("Copied. ✔️");
            }}
          >
            Copy
          </button>
          <button className="btn ghost" onClick={() => nav("/library")}>
            Open Library
          </button>
          <button className="btn ghost" onClick={() => nav("/brief")}>
            Edit inputs
          </button>
        </div>
      </div>

      <div className="callout">
        <h4>Want community updates?</h4>
        <p className="meta">Low-volume, no hustle. We’ll never sell your data.</p>
        <Link className="btn secondary" to="/brief">
          Manage consent
        </Link>
      </div>
    </div>
  );
}
