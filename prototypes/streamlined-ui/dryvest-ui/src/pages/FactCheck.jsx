import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { KEY_POINTS, FACTS, ORGANIZATIONS, DRIVERS, AUDIENCES } from "../data.js";

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

export default function FactCheck({ initialType = "points" }) {
  const [type, setType] = useState(TYPE_OPTIONS.some((opt) => opt.id === initialType) ? initialType : "points");
  const [filters, setFilters] = useState({ org: "any", driver: "any", audience: "any", q: "" });
  const [index, setIndex] = useState(0);
  const entries = useMemo(() => {
    const pool = type === "facts" ? FACTS : KEY_POINTS;
    return filterEntries(pool, { ...filters, q: filters.q.trim().toLowerCase() });
  }, [type, filters]);
  const current = entries[index] || null;

  const onChangeType = (next) => {
    setType(next);
    setIndex(0);
  };

  const onChangeFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setIndex(0);
  };

  const onNext = () => setIndex((prev) => (entries.length ? (prev + 1) % entries.length : 0));
  const onPrev = () => setIndex((prev) => (entries.length ? (prev - 1 + entries.length) % entries.length : 0));

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <div className="section" style={{ marginTop: 0 }}>
        <h2>Explore {type === "facts" ? "Evidence" : "Key Points"}</h2>
        <p className="meta">Cycle through Dryvest’s vetted assertions and proofs to build fluency before you brief stakeholders.</p>
      </div>

      <div className="section" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`btn ${type === option.id ? "primary" : "secondary"}`}
            onClick={() => onChangeType(option.id)}
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
              onChange={(e) => onChangeFilter("org", e.target.value)}
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
              onChange={(e) => onChangeFilter("driver", e.target.value)}
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
              onChange={(e) => onChangeFilter("audience", e.target.value)}
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
            onChange={(e) => onChangeFilter("q", e.target.value)}
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
    </div>
  );
}
