import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DOCS,
  FACTS,
  KEY_POINTS,
  TRAILHEADS,
} from "../data.js";

const TYPE_LABELS = {
  doc: "Document",
  fact: "Evidence",
  point: "Key Point",
  trail: "Trailhead",
};

function normalize(text) {
  return text ? text.toLowerCase() : "";
}

function scoreMatch(item, query) {
  if (!query) return 0;
  const { title, search } = item;
  const lowerQuery = normalize(query);
  const inTitle = normalize(title).includes(lowerQuery);
  if (inTitle) return 3;
  const inSearch = search.includes(lowerQuery);
  if (inSearch) return 1;
  return 0;
}

export default function SearchPalette({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const dataset = useMemo(() => {
    const docs = DOCS.map((doc) => ({
      key: `doc-${doc.id}`,
      type: "doc",
      title: doc.title,
      description: doc.summary,
      search: normalize(`${doc.title} ${doc.summary} ${doc.body}`),
      href: `/library?tab=docs&focus=${doc.id}`,
    }));
    const facts = FACTS.map((fact) => ({
      key: `fact-${fact.id}`,
      type: "fact",
      title: fact.claim,
      description: fact.support,
      search: normalize(`${fact.claim} ${fact.support} ${fact.citations.map((c) => `${c.title} ${c.url || ""}`).join(" ")}`),
      href: `/library?tab=facts&focus=${fact.id}`,
    }));
    const points = KEY_POINTS.map((point) => ({
      key: `point-${point.id}`,
      type: "point",
      title: point.title,
      description: point.body,
      search: normalize(`${point.title} ${point.body}`),
      href: `/explore?type=points&id=${point.id}`,
    }));
    const trails = TRAILHEADS.map((trail) => ({
      key: `trail-${trail.id}`,
      type: "trail",
      title: trail.title,
      description: trail.summary,
      search: normalize(`${trail.title} ${trail.summary}`),
      href: `/explore?trail=${trail.id}`,
    }));

    return [...docs, ...facts, ...points, ...trails];
  }, []);

  const results = useMemo(() => {
    if (!query) return dataset.slice(0, 10);
    const scored = dataset
      .map((item) => ({ item, score: scoreMatch(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
    return scored.slice(0, 15).map(({ item }) => item);
  }, [dataset, query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (results.length ? Math.min(prev + 1, results.length - 1) : 0));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (results.length ? Math.max(prev - 1, 0) : 0));
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, activeIndex]);

  const handleSelect = (result) => {
    if (!result) return;
    onClose();
    navigate(result.href);
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" style={{ maxWidth: 720 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            ref={inputRef}
            className="input"
            placeholder="Search Dryvest (⌘/Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            aria-label="Search Dryvest"
          />
          <div className="helper">Search documents, evidence, key points, and trailheads.</div>
        </div>
        <div className="list" style={{ marginTop: 12 }}>
          {results.length === 0 && (
            <div className="meta">No matches yet. Try a different keyword.</div>
          )}
          {results.map((result, idx) => (
            <button
              key={result.key}
              className={`card option ${idx === activeIndex ? "selected" : ""}`}
              style={{ textAlign: "left" }}
              onClick={() => handleSelect(result)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{result.title}</strong>
                <span className="tag">{TYPE_LABELS[result.type] || result.type}</span>
              </div>
              {result.description ? (
                <div className="meta" style={{ marginTop: 6 }}>{result.description}</div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
