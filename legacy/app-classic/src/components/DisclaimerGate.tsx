import { useMemo, useState } from 'react';
import { Mail, ShieldAlert } from 'lucide-react';

interface DisclaimerGateProps {
  onAccept: (preferences: {
    analyticsConsent: boolean;
    mailingOptIn: boolean;
    email?: string;
  }) => void;
  defaultAnalyticsConsent?: boolean;
}

export function DisclaimerGate({
  onAccept,
  defaultAnalyticsConsent = false,
}: DisclaimerGateProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(defaultAnalyticsConsent);
  const [mailingOptIn, setMailingOptIn] = useState(false);
  const [mailingEmail, setMailingEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'info'>('info');

  const isSubmitDisabled = useMemo(() => {
    if (!isChecked) return true;
    if (mailingOptIn && !mailingEmail.trim()) return true;
    return false;
  }, [isChecked, mailingOptIn, mailingEmail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div className="w-full max-w-xl rounded-2xl border border-indigo-200 bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-3 text-white"
            style={{ backgroundColor: 'var(--ecic-purple)' }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-slate-900">
              Before you continue
            </h2>
            <p className="text-sm text-slate-600">
              Dryvest provides educational intelligence for strategic organizing.
              It is not investment, legal, or tax advice.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <p className="font-medium text-slate-800">By continuing, you confirm:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You will use Dryvest outputs for educational campaign planning and
              institutional literacy—not for making or executing investment decisions.
            </li>
            <li>
              You understand that Ethical Capital and Dryvest do not accept fiduciary
              responsibility for any investment outcomes.
            </li>
            <li>
              You will cite provided sources in full and verify applicability before
              relying on them in formal proceedings.
            </li>
          </ul>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={event => {
            event.preventDefault();
            if (isSubmitDisabled) {
              setStatusTone('error');
              setStatusMessage(
                mailingOptIn && !mailingEmail.trim()
                  ? 'Add an email address to receive Dryvest updates.'
                  : 'Confirm that you understand the educational disclaimer.'
              );
              return;
            }

            const trimmedEmail = mailingEmail.trim() || undefined;
            if (mailingOptIn && trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
              setStatusTone('error');
              setStatusMessage('Please enter a valid email address.');
              return;
            }

            setStatusMessage(null);
            onAccept({
              analyticsConsent: analyticsOptIn,
              mailingOptIn,
              email: mailingOptIn ? trimmedEmail : undefined,
            });
          }}
        >
          <fieldset className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={event => setIsChecked(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I have read and understand that Dryvest materials are for educational purposes
                only and do not constitute investment advice.
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={event => setAnalyticsOptIn(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                Dryvest may capture anonymized usage metrics to improve campaign guidance.
              </span>
            </label>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={mailingOptIn}
                  onChange={event => {
                    setMailingOptIn(event.target.checked);
                    if (!event.target.checked) {
                      setMailingEmail('');
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Keep me on the Ethical Capital / Dryvest mailing list for release notes and
                  major dataset updates (low volume, you can opt out anytime).
                </span>
              </label>
              {mailingOptIn ? (
                <div className="mt-3 flex flex-col gap-2 pl-7">
                  <label className="text-xs font-medium text-indigo-700" htmlFor="mailing-email">
                    Email for updates
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white p-2 text-indigo-500">
                      <Mail size={16} />
                    </span>
                    <input
                      id="mailing-email"
                      type="email"
                      value={mailingEmail}
                      onChange={event => setMailingEmail(event.target.value)}
                      placeholder="you@example.org"
                      className="flex-1 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-indigo-600">
                    We send brief updates when Dryvest datasets, templates, or campaign tooling changes.
                  </p>
                </div>
              ) : null}
            </div>
          </fieldset>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full rounded-lg px-4 py-2 text-sm font-heading font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--ecic-purple)' }}
              >
                Accept and enter Dryvest
              </button>

              {statusMessage ? (
                <p
                  className={`text-xs font-medium ${
                    statusTone === 'error' ? 'text-rose-600' : 'text-slate-600'
                  }`}
                >
                  {statusMessage}
                </p>
              ) : null}

              <p className="text-xs text-slate-500 text-center">
                Questions?{' '}
                <a
                  href="mailto:hello@ethicic.com?subject=Dryvest Disclaimer"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Contact Ethical Capital
                </a>
                .
              </p>
            </div>
        </form>
      </div>
    </div>
  );
}
