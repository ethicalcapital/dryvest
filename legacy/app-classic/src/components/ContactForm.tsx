import { type FormEvent, useMemo, useState } from 'react';
import { Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { BriefParams } from '../hooks/useBriefParams';
import type { BriefTone } from '../lib/exporters';
import { trackEvent } from '../lib/analytics';

interface ContactFormProps {
  params: BriefParams;
  tone: BriefTone;
  datasetVersion: string;
  attachmentCount: number;
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm({
  params,
  tone,
  datasetVersion,
  attachmentCount,
}: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [status, setStatus] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => {
    if (status === 'submitting') return true;
    return message.trim().length < 10;
  }, [message, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setStatus('submitting');
    setErrorMessage(null);

    const payload = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      message: message.trim(),
      newsletterOptIn,
      meta: {
        identity: params.identity,
        audience: params.audience,
        tone,
        datasetVersion,
        attachments: attachmentCount,
      },
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Submission failed');
      }

      trackEvent('contact_submitted', {
        newsletterOptIn,
        datasetVersion,
      });

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setNewsletterOptIn(false);
      window.setTimeout(() => setStatus('idle'), 4000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not record your request. Please try again later.'
      );
      window.setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h3 className="text-base font-heading font-semibold text-slate-900">
        Share context or corrections
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        We review every note to refine Dryvest. We don't promise 1:1 replies, but you can
        opt into briefing updates and dataset release emails below.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Name (optional)
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="text-sm text-slate-600">
            Email for updates (enabled when you opt in)
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              disabled={!newsletterOptIn}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <label className="text-sm text-slate-600">
          What do you need?
          <textarea
            required
            minLength={10}
            rows={4}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="Share context, corrections, or questions."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={event => {
              const checked = event.target.checked;
              setNewsletterOptIn(checked);
              if (!checked) {
                setEmail('');
              }
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            Send me Ethical Capital's Dryvest updates. Low-volume release notes and campaign
            wins; you can unsubscribe anytime.
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} />
            {status === 'submitting'
              ? 'Sending…'
              : status === 'success'
                ? 'Submitted'
                : 'Send'}
          </button>

          {status === 'success' && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-green-700">
              <CheckCircle2 size={14} /> Received—thank you.
            </span>
          )}

          {status === 'error' && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-700">
              <AlertTriangle size={14} /> {errorMessage ?? 'Could not submit.'}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
