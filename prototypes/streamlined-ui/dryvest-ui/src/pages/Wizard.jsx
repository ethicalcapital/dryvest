import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ORGANIZATIONS, AUDIENCES, DRIVERS, DOCS } from "../data.js";
import { downloadString } from "../utils/download.js";
import ConsentGate from "../components/ConsentGate.jsx";
import BottomStepper from "../components/BottomStepper.jsx";
import { getConsent } from "../utils/consent.js";
import { track } from "../utils/analytics.js";

function ModeMini({ mode, onChange }) {
  const modes = [
    { id: "quick", name: "QuickSieve (recommended)" },
    { id: "custom", name: "Custom Builder" },
    { id: "compare", name: "Compare" },
    { id: "facts", name: "Fact Check" }
  ];
  return (
    <div className="card section">
      <h2>Mode</h2>
      <div className="grid cols-2">
        {modes.map(m => (
          <button key={m.id}
            onClick={()=>onChange(m.id)}
            className={`option ${mode===m.id?"selected":""}`}
            aria-pressed={mode===m.id}
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
      <h2>Step 1 — Which organization are you influencing?</h2>
      <div className="grid cols-3">
        {ORGANIZATIONS.map(o => (
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
      <h2>Step 2 — Who has to say yes?</h2>
      <div className="grid cols-3">
        {AUDIENCES.map(a => {
          const checked = values.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle(a.id)}
              className={`option ${checked ? "selected" : ""}`}
              aria-pressed={checked}
            >
              <strong>{a.name}</strong>
              <div className="meta">{a.desc}</div>
            </button>
          );
        })}
      </div>
      <p className="meta" style={{marginTop:10}}>Tip: Select multiple if needed.</p>
    </div>
  );
}

function StepDrivers({ primary, secondary, onSet }) {
  return (
    <div className="section">
      <h2>Step 3 — Why will they move?</h2>
      <div className="grid cols-3">
        {DRIVERS.map(d => (
          <div key={d.id} className="card">
            <strong>{d.name}</strong>
            <p className="meta" style={{margin:"6px 0 10px"}}>{d.desc}</p>
            <div style={{display:"flex", gap:10}}>
              <button
                className={`btn ${primary===d.id ? "primary":"secondary"}`}
                onClick={() => onSet({ primary: d.id, secondary })}
                aria-pressed={primary===d.id}
              >
                Primary
              </button>
              <button
                className={`btn ${secondary===d.id ? "primary":"secondary"}`}
                onClick={() => onSet({ primary, secondary: d.id })}
                aria-pressed={secondary===d.id}
              >
                Secondary
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ALL_ORGS = ORGANIZATIONS.map((o) => o.id);
const ALL_DRIVERS = DRIVERS.map((d) => d.id);
const ALL_AUDIENCES = AUDIENCES.map((a) => a.id);

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

function Summary({ state }) {
  const org = ORGANIZATIONS.find(o => o.id===state.org);
  const prim = DRIVERS.find(d => d.id===state.primary);
  const sec = DRIVERS.find(d => d.id===state.secondary);
  const recommendedDocs = recommendDocs(state);
  return (
    <div className="section card">
      <h2>Summary</h2>
      <div className="grid cols-2" style={{marginTop:8}}>
        <div className="card"><strong>Organization</strong><div className="meta">{org?.name}</div></div>
        <div className="card"><strong>Audience</strong><div className="meta">
          {state.audiences.map(id => (AUDIENCES.find(x=>x.id===id)?.name ?? id)).join(", ") || "—"}
        </div></div>
        <div className="card"><strong>Primary driver</strong><div className="meta">{prim?.name ?? "—"}</div></div>
        <div className="card"><strong>Secondary driver</strong><div className="meta">{sec?.name ?? "—"}</div></div>
      </div>
      <div className="section">
        <h3 style={{margin:"12px 0 6px"}}>Model documents coming with your brief</h3>
        <div className="meta" style={{marginBottom:8}}>We’ll auto-suggest the strongest fits after generation—you can swap them in the Library.</div>
        <ul className="list">
          {recommendedDocs.map((doc) => (
            <li key={doc.id} className="list-row" style={{gridTemplateColumns:"1fr auto"}}>
              <div>
                <strong>{doc.title}</strong>
                <div className="meta">{doc.summary}</div>
              </div>
              <button className="btn ghost" onClick={()=>downloadString(`${doc.id}.md`,"text/markdown",doc.body)}>Preview</button>
            </li>
          ))}
        </ul>
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
    const c = getConsent();
    if (!c.accepted) setShowConsent(true);
  }, []);

  useEffect(() => {
    track("wizard_view", { mode, step });
  }, [mode, step]);

  const toggleAudience = (id) =>
    setAudiences((prev) => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

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

  const onPrev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <>
      {showConsent && <ConsentGate onClose={() => setShowConsent(false)} />}

      {showMode && <ModeMini mode={mode} onChange={(m)=>{ setMode(m); setShowMode(false); }} />}

      <div className="card">
        {step === 1 && <StepOrg value={org} onChange={(id)=>{
          setOrg(id);
          track("org_select",{id});
          setStep((s) => (s === 1 ? 2 : s));
        }} />}
        {step === 2 && <StepAudience values={audiences} onToggle={(id)=>{ toggleAudience(id); track("aud_toggle",{id}); }} />}
        {step === 3 && <StepDrivers primary={primary} secondary={secondary} onSet={({primary,secondary})=>{
          setPrimary(primary);
          setSecondary(secondary);
          if (primary) {
            setStep((s) => (s === 3 ? 4 : s));
          }
        }} />}
        {step === 4 && <Summary state={{ org, audiences, primary, secondary, docs: [] }} />}
      </div>

      <BottomStepper
        current={step}
        total={total}
        onPrev={onPrev}
        onNext={onNext}
        nextLabel={step === total ? "Generate brief" : "Next"}
        canNext={canNext}
        showChangeMode
        onChangeMode={()=>setShowMode((s)=>!s)}
      />
    </>
  );
}
