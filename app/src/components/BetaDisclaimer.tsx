import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../lib/storage';

interface BetaDisclaimerProps {
  analyticsConsent: boolean;
  datasetVersion?: string;
  onAnalyticsConsentChange: (consent: boolean) => void;
}

const STORAGE_KEYS = {
  dismissed: 'dryvest:beta-dismissed',
  analytics: 'dryvest:analytics-consent',
};

const readBoolean = (key: string, fallback = false) => {
  const value = safeLocalStorageGet(key);
  if (value === null) return fallback;
  return value === 'true' || value === 'granted';
};

export function BetaDisclaimer({
  analyticsConsent,
  datasetVersion,
  onAnalyticsConsentChange,
}: BetaDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() =>
    readBoolean(STORAGE_KEYS.dismissed)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'warning'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [storedConsent, setStoredConsent] = useState<boolean>(() =>
    analyticsConsent || readBoolean(STORAGE_KEYS.analytics)
  );
  const [mailingEmail, setMailingEmail] = useState('');
  const [mailingStatus, setMailingStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );

  useEffect(() => {
    setStoredConsent(analyticsConsent);
  }, [analyticsConsent]);

  if (isDismissed) return null;

  const persistConsent = async (consent: boolean) => {
    setIsSaving(true);
    let resultTone: 'success' | 'warning' = 'success';
    let resultMessage = consent
      ? 'Analytics enabled. Thank you for helping us improve.'
      : 'Analytics disabled. Only your choice is stored locally.';
    let ok = true;

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticsConsent: consent,
          mailingOptIn: false,
          email: undefined,
          meta: {
            datasetVersion,
            pathname:
              typeof window !== 'undefined' ? window.location.pathname : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to persist preferences: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to persist preferences', error);
      resultTone = 'warning';
      resultMessage =
        'Preference stored locally. We will retry syncing later.';
      ok = false;
    } finally {
      safeLocalStorageSet(
        STORAGE_KEYS.analytics,
        consent ? 'granted' : 'denied'
      );
      setStoredConsent(consent);
      onAnalyticsConsentChange(consent);
      trackEvent('analytics_consent_changed', { consent });
      setStatusTone(resultTone);
      setStatusMessage(resultMessage);
      setIsSaving(false);
    }

    return ok;
  };

  const handleConsent = async (consent: boolean) => {
    const success = await persistConsent(consent);
    if (success) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    safeLocalStorageSet(STORAGE_KEYS.dismissed, 'true');
    setIsDismissed(true);
  };

  const handleMailingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = mailingEmail.trim();
    if (!email) {
      setStatusTone('warning');
      setStatusMessage('Enter a valid email so we can send release notes.');
      return;
    }

    setMailingStatus('saving');
    setStatusMessage(null);

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticsConsent: storedConsent,
          mailingOptIn: true,
          email,
          meta: {
            datasetVersion,
            source: 'beta_disclaimer',
            pathname:
              typeof window !== 'undefined' ? window.location.pathname : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to persist mailing preference: ${response.status}`);
      }

      setMailingStatus('success');
      setMailingEmail('');
      setStatusTone('success');
      setStatusMessage('Release notes opt-in confirmed. Watch your inbox for updates.');
      trackEvent('mailing_opt_in', { source: 'beta_banner', datasetVersion });
      window.setTimeout(() => setMailingStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to opt in to release notes', error);
      setMailingStatus('error');
      setStatusTone('warning');
      setStatusMessage('We could not add you yet. Please retry or email hello@ethicic.com.');
      window.setTimeout(() => setMailingStatus('idle'), 4000);
    }
  };

  return (
    <div className="w-full border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <AlertTriangle size={24} className="text-amber-600" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  BETA
                </span>
                <span className="text-sm font-semibold text-amber-800">
                  Help us make Dryvest sharper
                </span>
              </div>
              <p className="text-sm leading-relaxed text-amber-700">
                <strong>The revolution will be risk-adjusted.</strong> Dryvest turns moral demands into
                routine policy language. Choose how much telemetry you want to share—your work stays
                private either way.
              </p>
              <div className="rounded-lg border border-amber-200 bg-white/70 p-4">
                <p className="font-medium text-slate-800">
                  We default to privacy-first. Pick the option that fits your comfort.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleConsent(true)}
                    disabled={isSaving && storedConsent === true}
                    className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving && storedConsent === true ? 'Saving…' : 'Enable analytics'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConsent(false)}
                    disabled={isSaving && storedConsent === false}
                    className="inline-flex items-center rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving && storedConsent === false
                      ? 'Saving…'
                      : 'Keep analytics off'}
                  </button>
                  <form
                    onSubmit={handleMailingSubmit}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <label className="sr-only" htmlFor="release-notes-email">
                      Email for release notes
                    </label>
                    <input
                      id="release-notes-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={mailingEmail}
                      onChange={event => setMailingEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      required
                    />
                    <button
                      type="submit"
                      disabled={mailingStatus === 'saving'}
                      className="inline-flex items-center rounded-md border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {mailingStatus === 'saving'
                        ? 'Joining…'
                        : mailingStatus === 'success'
                          ? 'Added!'
                          : 'Get release notes'}
                    </button>
                  </form>
                  <button
                    onClick={handleDismiss}
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                    aria-label="Dismiss disclaimer"
                  >
                    Dismiss
                  </button>
                </div>
                {statusMessage ? (
                  <p
                    className={`mt-3 text-xs font-medium ${
                      statusTone === 'success' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {statusMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="md:hidden p-1 rounded text-amber-600 transition-colors hover:bg-amber-100"
            aria-label="Dismiss disclaimer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
