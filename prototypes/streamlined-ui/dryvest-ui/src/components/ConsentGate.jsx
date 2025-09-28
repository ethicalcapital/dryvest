import { useEffect, useState } from "react";
import { getConsent, setConsent } from "../utils/consent.js";

export default function ConsentGate({ onClose }) {
  const [stage, setStage] = useState(1);
  const [state, setState] = useState(getConsent());

  useEffect(() => {
    const c = getConsent();
    if (c.accepted) onClose?.();
  }, [onClose]);

  const next = () => setStage((s) => Math.min(3, s + 1));
  const back = () => setStage((s) => Math.max(1, s - 1));

  const finish = () => {
    const final = { ...state, accepted: true };
    setConsent(final);
    onClose?.();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Consent">
      <div className="modal">
        <h3>Before we begin</h3>
        {stage === 1 && (
          <>
            <p>
              We don’t collect personal data by default. You can opt in to share <strong>anonymous usage</strong>
              to help us improve. You can change this anytime.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={state.analytics}
                onChange={(e) => setState((x) => ({ ...x, analytics: e.target.checked }))}
              />
              Allow anonymous analytics
            </label>
            <div className="row" style={{marginTop:12}}>
              <button className="btn secondary" onClick={next}>Continue</button>
              <button className="btn ghost" onClick={finish}>Skip &amp; start</button>
            </div>
          </>
        )}
        {stage === 2 && (
          <>
            <p className="helper">
              Educational intelligence only. This is not investment, legal, or tax advice and does not
              create a client relationship.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={state.accepted}
                onChange={(e) => setState((x) => ({ ...x, accepted: e.target.checked }))}
              />
              I understand and agree.
            </label>
            <div className="row" style={{marginTop:12}}>
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn primary" onClick={state.accepted ? next : undefined} disabled={!state.accepted}>
                Continue
              </button>
            </div>
          </>
        )}
        {stage === 3 && (
          <>
            <p>Join our community updates (low-volume, no hustle). Optional.</p>
            <div className="row">
              <input
                className="input"
                type="email"
                placeholder="you@org.org"
                value={state.email}
                onChange={(e) => setState((x) => ({ ...x, email: e.target.value }))}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={state.emailOptIn}
                  onChange={(e) => setState((x) => ({ ...x, emailOptIn: e.target.checked }))}
                />
                Subscribe me
              </label>
            </div>
            <div className="row" style={{marginTop:12}}>
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn primary" onClick={finish}>Start</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
