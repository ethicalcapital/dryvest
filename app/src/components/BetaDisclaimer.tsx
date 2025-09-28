import { useEffect, useMemo, useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface BetaDisclaimerProps {
  analyticsConsent: boolean;
  datasetVersion?: string;
  onAnalyticsConsentChange: (consent: boolean) => void;
}

const STORAGE_KEYS = {
  dismissed: 'dryvest:beta-dismissed',
  analytics: 'dryvest:analytics-consent',
  mailingOptIn: 'dryvest:mailing-opt-in',
  mailingEmail: 'dryvest:mailing-email',
};

const readBoolean = (key: string, fallback = false) => {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true' || value === 'granted';
};

const readString = (key: string) => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) ?? '';
};

export function BetaDisclaimer({
  analyticsConsent,
  datasetVersion,
  onAnalyticsConsentChange,
}: BetaDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() =>
    readBoolean(STORAGE_KEYS.dismissed)
  );
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(
    () => analyticsConsent || readBoolean(STORAGE_KEYS.analytics)
  );
  const [mailingOptIn, setMailingOptIn] = useState<boolean>(() =>
    readBoolean(STORAGE_KEYS.mailingOptIn)
  );
  const [mailingEmail, setMailingEmail] = useState<string>(() =>
    readString(STORAGE_KEYS.mailingEmail)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'warning'>('success');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAnalyticsOptIn(analyticsConsent);
  }, [analyticsConsent]);

  const mailingLink = useMemo(() => {
    if (!mailingOptIn || !mailingEmail) return null;
    const normalizedEmail = mailingEmail.trim();
    if (!normalizedEmail) return null;
    const subject = encodeURIComponent('Dryvest mailing list opt-in');
    const body = encodeURIComponent(
      `Please add ${normalizedEmail} to the Dryvest updates mailing list.`
    );
    return `mailto:hello@ethicic.com?subject=${subject}&body=${body}`;
  }, [mailingOptIn, mailingEmail]);

  if (isDismissed) return null;

  useEffect(() => {
    setStatusMessage(null);
  }, [analyticsOptIn, mailingOptIn, mailingEmail]);

  const handleSave = async () => {
    if (mailingOptIn && !mailingEmail) {
      setStatusTone('warning');
      setStatusMessage('Add an email address to join the mailing list.');
      return;
    }

    setIsSaving(true);
    const normalizedEmail = mailingOptIn ? mailingEmail.trim() : undefined;
    let resultTone: 'success' | 'warning' = 'success';
    let resultMessage = 'Preferences saved. Thank you for helping us improve.';
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticsConsent: analyticsOptIn,
          mailingOptIn,
          email: normalizedEmail,
          meta: {
            datasetVersion,
            pathname:
              typeof window !== 'undefined'
                ? window.location.pathname
                : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to persist preferences: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to persist preferences', error);
      resultTone = 'warning';
      resultMessage = 'Saved locally. We will retry syncing preferences later.';
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEYS.analytics,
          analyticsOptIn ? 'granted' : 'denied'
        );
        window.localStorage.setItem(
          STORAGE_KEYS.mailingOptIn,
          mailingOptIn ? 'true' : 'false'
        );
        window.localStorage.setItem(
          STORAGE_KEYS.mailingEmail,
          normalizedEmail ?? ''
        );
      }

      onAnalyticsConsentChange(analyticsOptIn);

      trackEvent('analytics_consent_changed', { consent: analyticsOptIn });
      trackEvent('mailing_opt_in', { optedIn: mailingOptIn });

      if (mailingOptIn && mailingLink) {
        window.open(mailingLink, '_blank', 'noopener,noreferrer');
      }

      setStatusTone(resultTone);
      setStatusMessage(resultMessage);
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.dismissed, 'true');
    }
    setIsDismissed(true);
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
                routine policy language. Opt in below if we may track anonymous usage to keep improving,
                and let us know if you want Dryvest release notes in your inbox. Always educational,
                never investment advice.
              </p>
              <div className="rounded-lg border border-amber-200 bg-white/70 p-4">
                <p className="font-medium text-slate-800">By continuing, you confirm:</p>
                <div className="mt-3 flex flex-col gap-3">
                  <label className="flex items-start gap-3 text-sm text-amber-800">
                    <input
                      type="checkbox"
                      checked={analyticsOptIn}
                      onChange={event => setAnalyticsOptIn(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      Dryvest may collect anonymized usage analytics to improve the tool.
                    </span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 text-sm text-amber-800">
                      <input
                        type="checkbox"
                        checked={mailingOptIn}
                        onChange={event => setMailingOptIn(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                      />
                      <span>You would like Ethical Capital Dryvest release notes by email.</span>
                    </label>
                    {mailingOptIn ? (
                      <div className="pl-7">
                        <label className="block text-xs font-medium text-amber-700">
                          Email for updates
                        </label>
                        <input
                          type="email"
                          value={mailingEmail}
                          onChange={event => setMailingEmail(event.target.value)}
                          placeholder="you@example.org"
                          className="mt-1 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <p className="mt-1 text-xs text-amber-600">
                          We send only release notes and briefing resources. You can opt out anytime.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CheckCircle2 size={16} />
                    {isSaving ? 'Saving…' : 'Save preferences'}
                  </button>
                  <div className="hidden md:block">
                    <button
                      onClick={handleDismiss}
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                      aria-label="Dismiss disclaimer"
                    >
                      Dismiss
                    </button>
                  </div>
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

          <div className="md:hidden">
            <button
              onClick={handleDismiss}
              className="p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss disclaimer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
