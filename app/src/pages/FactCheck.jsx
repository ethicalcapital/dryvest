import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  KEY_POINTS,
  FACTS,
  ORGANIZATIONS,
  DRIVERS,
  AUDIENCES,
  NEXT_STEPS,
  DOCS,
  TRAILHEADS
} from "../data.js";

const ORG_OPTIONS = [{ id: "any", name: "Any organization" }, ...ORGANIZATIONS];
const DRIVER_OPTIONS = [{ id: "any", name: "Any driver" }, ...DRIVERS];
const AUDIENCE_OPTIONS = [{ id: "any", name: "Any audience" }, ...AUDIENCES.map((a) => ({ id: a.id, name: a.name }))];

const TYPE_OPTIONS = [
  { id: "points", label: "Key Points" },
  { id: "facts", label: "Evidence" }
];

function getContexts(entry) {
  const ctx = entry.contexts || {};
  return {
    orgs: ctx.orgs || [],
    audiences: ctx.audiences || [],
    drivers: ctx.drivers || []
  };
}

function filterEntries(entries, filters) {
  return entries.filter((entry) => {
    const ctx = getContexts(entry);
    const orgOk = filters.org === "any" || ctx.orgs.includes(filters.org) || ctx.orgs.length === 0;
    const driverOk = filters.driver === "any" || ctx.drivers.includes(filters.driver) || ctx.drivers.length === 0;
    const audienceOk = filters.audience === "any" || ctx.audiences.includes(filters.audience) || ctx.audiences.length === 0;
    const queryOk = !filters.q ||
      entry.title?.toLowerCase().includes(filters.q) ||
      entry.claim?.toLowerCase().includes(filters.q) ||
      entry.body?.toLowerCase().includes(filters.q) ||
      entry.support?.toLowerCase().includes(filters.q);
    return orgOk && driverOk && audienceOk && queryOk;
  });
}

function pickPrimaryStep(trailhead) {
  if (!trailhead?.steps?.length) return null;
  const priorityOrder = [
    (step) => step.kind === "point",
    (step) => step.kind === "fact",
    () => true
  ];
  for (const predicate of priorityOrder) {
    const match = trailhead.steps.find(predicate);
    if (match) return match;
  }
  return trailhead.steps[0];
}

function resolveStep(step, lookups) {
  if (!step) return null;
  switch (step.kind) {
    case "point": {
      const point = lookups.points[step.ref];
      if (!point) return null;
      return { label: "Key Point", title: point.title, body: point.body };
    }
    case "fact": {
      const fact = lookups.facts[step.ref];
      if (!fact) return null;
      return { label: "Evidence", title: fact.claim, body: fact.support };
    }
    case "doc": {
      const doc = lookups.docs[step.ref];
      if (!doc) return null;
      return { label: "Model Document", title: doc.title, body: doc.summary };
    }
    case "step": {
      const next = lookups.nextSteps[step.ref];
      if (!next) return null;
      return { label: "Next Step", title: next.text, body: null };
    }
    default:
      return null;
  }
}

export default function FactCheck({ initialType = "points" }) {
  const [type, setType] = useState(TYPE_OPTIONS.some((opt) => opt.id === initialType) ? initialType : "points");
  const [filters, setFilters] = useState({ org: "any", driver: "any", audience: "any", q: "" });
  const [index, setIndex] = useState(0);
  const [activeTrailheadId, setActiveTrailheadId] = useState(null);
  const [pendingTargetId, setPendingTargetId] = useState(null);
  const location = useLocation();

  const lookups = useMemo(
    () => ({
      docs: Object.fromEntries(DOCS.map((doc) => [doc.id, doc])),
      points: Object.fromEntries(KEY_POINTS.map((point) => [point.id, point])),
      facts: Object.fromEntries(FACTS.map((fact) => [fact.id, fact])),
      nextSteps: Object.fromEntries(NEXT_STEPS.map((step) => [step.id, step]))
    }),
    []
  );

  const entries = useMemo(() => {
    const pool = type === "facts" ? FACTS : KEY_POINTS;
    return filterEntries(pool, { ...filters, q: filters.q.trim().toLowerCase() });
  }, [type, filters]);
  const current = entries[index] || null;
  const activeTrailhead = useMemo(
    () => TRAILHEADS.find((trail) => trail.id === activeTrailheadId) || null,
    [activeTrailheadId]
  );

  useEffect(() => {
    if (!pendingTargetId) return;
    const idx = entries.findIndex((entry) => entry.id === pendingTargetId);
    if (idx !== -1) {
      setIndex(idx);
    } else {
      setIndex(0);
    }
    setPendingTargetId(null);
  }, [entries, pendingTargetId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    const idParam = params.get('id');
    const trailParam = params.get('trail');

    if (typeParam && TYPE_OPTIONS.some((opt) => opt.id === typeParam)) {
      setType(typeParam);
    }

    if (trailParam) {
      const trail = TRAILHEADS.find((t) => t.id === trailParam);
      if (trail) {
        applyTrailhead(trail);
        return;
      }
    }

    if (idParam) {
      setPendingTargetId(idParam);
    }
  }, [location.search]);

  const handleTypeChange = (next) => {
    setType(next);
    setIndex(0);
    setActiveTrailheadId(null);
    setPendingTargetId(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setIndex(0);
    setActiveTrailheadId(null);
    setPendingTargetId(null);
  };

  const onNext = () => setIndex((prev) => (entries.length ? (prev + 1) % entries.length : 0));
  const onPrev = () => setIndex((prev) => (entries.length ? (prev - 1 + entries.length) % entries.length : 0));

  const applyTrailhead = (trailhead) => {
    const primaryStep = pickPrimaryStep(trailhead);
    const desiredType = primaryStep?.kind === "fact" ? "facts" : "points";
    const filtersToApply = {
      org: trailhead.filters?.org ?? "any",
      driver: trailhead.filters?.driver ?? "any",
      audience: trailhead.filters?.audience ?? "any",
      q: ""
    };

    setActiveTrailheadId(trailhead.id);
    setType(desiredType);
    setFilters(filtersToApply);
    setIndex(0);
    setPendingTargetId(primaryStep?.ref ?? null);
  };

  const clearTrailhead = () => {
    setActiveTrailheadId(null);
    setPendingTargetId(null);
  };

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <div className="section" style={{ marginTop: 0 }}>
        <h2>Explore {type === "facts" ? "Evidence" : "Key Points"}</h2>
        <p className="meta">Cycle through Dryvest’s vetted assertions and proofs to build fluency before you brief stakeholders.</p>
      </div>

      <div className="section" style={{ display: "grid", gap: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Trailheads</h3>
          {activeTrailhead ? (
            <button className="btn ghost" onClick={clearTrailhead}>Clear selection</button>
          ) : null}
        </div>
        <div className="grid cols-3">
          {TRAILHEADS.map((trail) => (
            <button
              key={trail.id}
              className={`card option ${trail.id === activeTrailheadId ? "selected" : ""}`}
              style={{ textAlign: "left" }}
              onClick={() => applyTrailhead(trail)}
              aria-pressed={trail.id === activeTrailheadId}
            >
              <strong>{trail.title}</strong>
              <div className="meta">{trail.summary}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="section" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`btn ${type === option.id ? "primary" : "secondary"}`}
            onClick={() => handleTypeChange(option.id)}
            aria-pressed={type === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="section" style={{ display: "grid", gap: 12 }}>
        <div className="grid cols-3">
          <label className="card" style={{ display: "grid", gap: 6 }}>
            <span className="meta">Organization context</span>
            <select
              className="input"
              value={filters.org}
              onChange={(e) => handleFilterChange("org", e.target.value)}
            >
              {ORG_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </label>
          <label className="card" style={{ display: "grid", gap: 6 }}>
            <span className="meta">Driver</span>
            <select
              className="input"
              value={filters.driver}
              onChange={(e) => handleFilterChange("driver", e.target.value)}
            >
              {DRIVER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </label>
          <label className="card" style={{ display: "grid", gap: 6 }}>
            <span className="meta">Audience</span>
            <select
              className="input"
              value={filters.audience}
              onChange={(e) => handleFilterChange("audience", e.target.value)}
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="card" style={{ display: "grid", gap: 6 }}>
          <span className="meta">Search</span>
          <input
            className="input"
            type="search"
            value={filters.q}
            placeholder={type === "facts" ? "Search claims, support, citations" : "Search key points"}
            onChange={(e) => handleFilterChange("q", e.target.value)}
          />
        </label>
      </div>

      <div className="section">
        {entries.length === 0 ? (
          <div className="helper">No entries match these filters. Try resetting or broadening the scope.</div>
        ) : (
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="meta">{index + 1} of {entries.length}</div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn secondary" onClick={onPrev}>← Previous</button>
                <button className="btn primary" onClick={onNext}>Next →</button>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: 8 }}>
                {type === "facts" ? current.claim : current.title}
              </h3>
              <div className="meta" style={{ marginBottom: 12 }}>
                {type === "facts" ? "Evidence" : "Key point"} · {getContexts(current).drivers.join(", ") || "all drivers"}
              </div>
              <div className="helper">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {type === "facts" ? current.support : current.body}
                </ReactMarkdown>
              </div>
            </div>
            {type === "facts" && current.citations?.length ? (
              <div>
                <strong className="meta">Citations</strong>
                <ul className="list" style={{ marginTop: 8 }}>
                  {current.citations.map((citation, idx) => (
                    <li key={idx} className="list-row" style={{ gridTemplateColumns: "1fr" }}>
                      <div>
                        {citation.title}
                        {citation.url ? (
                          <div className="meta">{citation.url}</div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="meta">
              Contexts: Org · {getContexts(current).orgs.join(", ") || "all"} · Audience · {getContexts(current).audiences.join(", ") || "all"}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="helper">
          Shuffle between key points and evidence to rehearse the story. When something resonates, add the related documents from the Library so your brief keeps that insight.
        </div>
      </div>

      {activeTrailhead ? (
        <div className="section">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Trailhead steps</h3>
            <ol className="list">
              {activeTrailhead.steps.map((step) => {
                const resolved = resolveStep(step, lookups);
                if (!resolved) return null;
                return (
                  <li key={`${step.kind}-${step.ref}`} className="list-row" style={{ gridTemplateColumns: "1fr" }}>
                    <div>
                      <div className="meta">{resolved.label}</div>
                      <strong>{resolved.title}</strong>
                      {resolved.body ? (
                        <div className="meta">{resolved.body}</div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
