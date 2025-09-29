import { useState } from "react";
import { track } from "../utils/analytics.js";

const MODE_LABELS = {
  fact: "Explain",
  doc: "Summarize",
  generic: "Clarify",
};

export default function ClarifyButton({ text, mode = "generic", label, className }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const buttonLabel = label || MODE_LABELS[mode] || MODE_LABELS.generic;

  const onClarify = async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    setExpanded(true);
    try {
      track("clarify_request", { mode });
      const response = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      });
      if (!response.ok) {
        throw new Error(`Clarify request failed (${response.status})`);
      }
      const data = await response.json();
      setResult(data.summary?.trim() || 'No response available.');
    } catch (err) {
      console.warn('[clarify] failed', err);
      setError('Unable to clarify right now. Try again or simplify the selection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`clarify-block ${className ?? ''}`}>
      <button className="btn ghost" type="button" onClick={onClarify} disabled={loading || !text}>
        {loading ? 'Working…' : buttonLabel}
      </button>
      {expanded && (
        <div className="clarify-result">
          {loading && <p className="meta">Generating a plain-language take…</p>}
          {error && <p className="meta" style={{ color: '#ff9d9d' }}>{error}</p>}
          {!loading && !error && result && (
            <p className="meta">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
