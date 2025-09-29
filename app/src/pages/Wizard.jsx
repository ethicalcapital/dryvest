import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ORGANIZATIONS, AUDIENCES, DRIVERS, DOCS } from "../data.js";
import { downloadString } from "../utils/download.js";
import ConsentGate from "../components/ConsentGate.jsx";
import { getConsent } from "../utils/consent.js";
import { track } from "../utils/analytics.js";

const MODES = [
  { id: "quick", name: "QuickSieve (recommended)" },
  { id: "custom", name: "Custom Builder" },
  { id: "compare", name: "Compare" },
  { id: "facts", name: "Fact Check" }
];

const DATASET_VERSION = "2025-09-27";

const ALL_ORGS = ORGANIZATIONS.map((o) => o.id);
const ALL_DRIVERS = DRIVERS.map((d) => d.id);
const ALL_AUDIENCES = AUDIENCES.map((a) => a.id);

function ModeMini({ mode, onChange, onClose }) {
  return (
    <div className="card section mode-panel">
      <div className="mode-panel-header">
        <h2>Choose a workspace</h2>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
      <div className="grid cols-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`option ${mode === m.id ? "selected" : ""}`}
            aria-pressed={mode === m.id}
          >
            <strong>{m.name}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepOrg({ value, onChange }) {
  return (
    <div className="section">
      <h2 className="step-title">Which organization are you influencing?</h2>
      <p className="helper">Pick the sponsoring entity that ultimately owns the assets.</p>
      <div className="grid cols-3">
        {ORGANIZATIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`option ${value === o.id ? "selected" : ""}`}
            aria-pressed={value === o.id}
          >
            <strong>{o.name}</strong>
            <div className="meta">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepAudience({ values, onToggle }) {
  return (
    <div className="section">
      <h2 className="step-title">Who signs off?</h2>
      <p className="helper">Toggle everyone who has to endorse the change. Multiple selections are fine—this just tunes the talking points.</p>
      <div className="grid cols-3 audience-grid">
        {AUDIENCES.map((audience) => {
          const checked = values.includes(audience.id);
          return (
            <button
              key={audience.id}
              className={`option audience ${checked ? "selected" : ""}`}
              aria-pressed={checked}
              onClick={() => onToggle(audience.id)}
            >
              <span className="audience-indicator" aria-hidden="true">{checked ? "✓" : ""}</span>
              <div>
                <strong>{audience.name}</strong>
                <div className="meta">{audience.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDrivers({ primary, secondary, onPrimary, onSecondarySet, onSecondaryClear }) {
  return (
    <div className="section">
      <h2 className="step-title">What motivation or pressure will move them?</h2>
      <p className="helper">Lead with one driver, then optionally layer a supporting pressure to frame the follow-up materials.</p>
      <div className="grid cols-3 drivers">
        {DRIVERS.map((driver) => {
          const isPrimary = primary === driver.id;
          const isSecondary = secondary === driver.id && !isPrimary;
          return (
            <button
              key={driver.id}
              className={`driver-card ${isPrimary ? "selected" : ""}`}
              aria-pressed={isPrimary}
              onClick={() => onPrimary(driver.id)}
            >
              <div className="driver-header">
                <span className="driver-label">{isPrimary ? "Primary signal" : "Tap to make primary"}</span>
                {isSecondary && <span className="driver-tag">Supporting</span>}
              </div>
              <strong>{driver.name}</strong>
              <p className="meta">{driver.desc}</p>
              <div className="driver-actions">
                {isSecondary ? (
                  <button
                    type="button"
                    className="driver-clear"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSecondaryClear();
                    }}
                  >
                    Remove supporting pressure
                  </button>
                ) : (
                  <button
                    type="button"
                    className="driver-secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSecondarySet(driver.id);
                    }}
                  >
                    {isPrimary ? "Layer supporting pressure" : "Use as supporting pressure"}
                  </button>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function scoreDoc(doc, state) {
  const ctx = doc.contexts || {};
  const orgs = ctx.orgs && ctx.orgs.length ? ctx.orgs : ALL_ORGS;
  const drivers = ctx.drivers && ctx.drivers.length ? ctx.drivers : ALL_DRIVERS;
  const audiences = ctx.audiences && ctx.audiences.length ? ctx.audiences : ALL_AUDIENCES;

  let score = 0;
  if (orgs.includes(state.org)) score += 3;
  if (drivers.includes(state.primary)) score += 2;
  if (state.secondary && drivers.includes(state.secondary)) score += 1;
  if (Array.isArray(state.audiences)) {
    const hits = state.audiences.filter((a) => audiences.includes(a));
    score += hits.length * 1.5;
  }
  return score;
}

function recommendDocs(state) {
  const chosen = (state.docs || []).length ? DOCS.filter((d) => state.docs.includes(d.id)) : [];
  if (chosen.length) return chosen;
  const scored = DOCS
    .map((doc) => ({ doc, score: scoreDoc(doc, state) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length) {
    return scored.slice(0, 3).map(({ doc }) => doc);
  }

  return DOCS.slice(0, 3);
}

const DOC_PLAYBOOK = {
  fiduciary_playbook: {
    stage: "Set the guardrails",
    why: "Frames prudence for fiduciaries before the policy discussion.",
  },
  policy_framework: {
    stage: "Draft the policy",
    why: "Provides the language trustees can vote on immediately.",
  },
  conduct_risk_control_framework: {
    stage: "Show the operational plan",
    why: "Explains how staff will monitor and report once the policy passes.",
  },
  divestment_exposure_assessment: {
    stage: "Quantify the impact",
    why: "Gives consultants the analytics pack for tracking error + reporting.",
  },
};

function describeDoc(doc) {
  return DOC_PLAYBOOK[doc.id] ?? {
    stage: "Reference pack",
    why: doc.summary,
  };
}

function Summary({ state }) {
  const org = ORGANIZATIONS.find((o) => o.id === state.org);
  const prim = DRIVERS.find((d) => d.id === state.primary);
  const sec = DRIVERS.find((d) => d.id === state.secondary);
  const recommendedDocs = recommendDocs(state);
  return (
    <div className="section card">
      <h2 className="step-title">Ready to generate</h2>
      <div className="grid cols-2" style={{ marginTop: 8 }}>
        <div className="card"><strong>Organization</strong><div className="meta">{org?.name}</div></div>
        <div className="card"><strong>Audience</strong><div className="meta">
          {state.audiences.map((id) => (AUDIENCES.find((x) => x.id === id)?.name ?? id)).join(", ") || "—"}
        </div></div>
        <div className="card"><strong>Primary driver</strong><div className="meta">{prim?.name ?? "—"}</div></div>
        <div className="card"><strong>Supporting pressure</strong><div className="meta">{sec?.name ?? "—"}</div></div>
      </div>
      <div className="section">
        <h3 style={{ margin: "12px 0 6px" }}>Model documents we’ll attach</h3>
        <div className="meta" style={{ marginBottom: 8 }}>Each pack nudges a different decision lever—policy, operations, or measurement.</div>
        <ul className="list">
          {recommendedDocs.map((doc) => {
            const meta = describeDoc(doc);
            return (
              <li key={doc.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <strong>{meta.stage}</strong>
                  <div className="meta">{meta.why}</div>
                </div>
                <button className="btn ghost" onClick={() => downloadString(`${doc.id}.md`, "text/markdown", doc.body)}>Preview</button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="methodology-callout">
        <h3>Methodology & provenance</h3>
        <p className="meta">
          This brief resolves against dataset version {DATASET_VERSION}. Every node traces to a hashed source in D1 and the AutoRAG corpus; the deduplicated manifest lives at <code>manifests/markdown/latest-dedup.ndjson</code> with SHA-256 fingerprints.
        </p>
        <ul>
          <li>All Quick/Custom outputs cite `src_*` identifiers that map back to the D1 `sources` table.</li>
          <li>AutoRAG conversions include YAML front matter with `source_key`, `sha256`, and processing timestamps.</li>
          <li>Need to audit a claim? Pull the matching manifest row or markdown artifact and compare the stored hash against your copy.</li>
        </ul>
        <p className="meta">We only publish educational scaffolding—flag corrections via the contact form and we’ll update the corpus in the next release.</p>
      </div>
    </div>
  );
}

export default function Wizard() {
  const [mode, setMode] = useState("quick");
  const [showMode, setShowMode] = useState(false);

  const [org, setOrg] = useState(null);
  const [audiences, setAudiences] = useState([]);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);

  const [showConsent, setShowConsent] = useState(false);
  const [step, setStep] = useState(1);
  const total = 4;
  const nav = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driverParam = params.get('driver');
    if (driverParam && DRIVERS.some((d) => d.id === driverParam)) {
      setPrimary(driverParam);
      console.debug('[wizard] driver preloaded from query parameter', driverParam);
    }
  }, []);

  useEffect(() => {
    const consent = getConsent();
    if (!consent.accepted) setShowConsent(true);
  }, []);

  useEffect(() => {
    track("wizard_view", { mode, step });
  }, [mode, step]);

  const toggleAudience = (id) =>
    setAudiences((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canNext = useMemo(() => {
    if (step === 1) return Boolean(org);
    if (step === 2) return audiences.length > 0;
    if (step === 3) return Boolean(primary);
    return true;
  }, [step, org, audiences, primary]);

  const onNext = () => {
    if (!canNext) return;
    if (step < total) {
      setStep(step + 1);
    } else {
      const state = { org, audiences, primary, secondary, docs: [], mode };
      track("brief_generate", { mode, org, audiences, primary, secondary, docsCount: 0 });
      nav("/output", { state });
    }
  };

  const onPrev = () => setStep((current) => Math.max(1, current - 1));

  return (
    <>
      {showConsent && <ConsentGate onClose={() => setShowConsent(false)} />}

      {showMode && (
        <ModeMini
          mode={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setShowMode(false);
          }}
          onClose={() => setShowMode(false)}
        />
      )}

      <div className="card wizard-card">
        {step === 1 && (
          <StepOrg
            value={org}
            onChange={(id) => {
              setOrg(id);
              track("org_select", { id });
              setStep((current) => (current === 1 ? 2 : current));
            }}
          />
        )}

        {step === 2 && (
          <StepAudience
            values={audiences}
            onToggle={(id) => {
              toggleAudience(id);
              track("aud_toggle", { id });
            }}
          />
        )}

        {step === 3 && (
          <StepDrivers
            primary={primary}
            secondary={secondary}
            onPrimary={(id) => {
              setPrimary(id);
              track("driver_primary", { id });
              setStep((current) => (current === 3 && id ? 3 : current));
            }}
            onSecondarySet={(id) => {
              if (id === primary) {
                setSecondary(null);
                track("driver_secondary_clear", { reason: "matches_primary" });
                return;
              }
              setSecondary(id);
              track("driver_secondary", { id });
            }}
            onSecondaryClear={() => {
              setSecondary(null);
              track("driver_secondary_clear", {});
            }}
          />
        )}

        {step === 4 && <Summary state={{ org, audiences, primary, secondary, docs: [] }} />}

        <div className="step-controls">
          <div className="step-meta">
            Step {step} of {total}
            <button type="button" className="step-mode" onClick={() => setShowMode((open) => !open)}>
              Switch mode
            </button>
          </div>
          <div className="step-actions">
            <button className="btn ghost" onClick={onPrev} disabled={step === 1}>Back</button>
            <button className={`btn ${canNext ? "primary" : "secondary"}`} onClick={onNext} disabled={!canNext}>
              {step === total ? "Generate brief" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
