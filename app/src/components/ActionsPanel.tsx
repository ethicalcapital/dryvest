import { useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { ClipboardCopy } from 'lucide-react';
import type { BriefParams } from '../hooks/useBriefParams';
import type { BriefExportData, BriefTone } from '../lib/exporters';
import { buildMarkdown } from '../lib/exporters';
import { trackEvent } from '../lib/analytics';
import { PDFExportButton } from './PDFExportButton';

interface ActionsPanelProps {
  params: BriefParams;
  selectedDocs: string[];
  exportData: BriefExportData;
}

export function ActionsPanel({
  params,
  selectedDocs,
  exportData,
}: ActionsPanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );
  const focusRingStyles: CSSProperties = { ['--tw-ring-color' as any]: 'var(--ecic-purple)' };

  const handleCopy = async (tone: BriefTone) => {
    try {
      const markdown = buildMarkdown(exportData, tone);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyState('copied');
      trackEvent('copy_clicked', { tone });
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch (error) {
      console.error('Copy failed', error);
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-base font-heading font-semibold text-slate-900">
          Share this brief
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          For educational use—share with your committee and keep the paper trail tidy.
        </p>
        <div className="mt-4 space-y-3">
          <PDFExportButton
            context={{
              identity: params.identity,
              audience: params.audience,
              venue: params.venue,
              level: params.level,
            }}
            exportData={exportData}
          />
          <button
            type="button"
            onClick={() => handleCopy('plain')}
            disabled={copyState === 'error'}
            className={clsx(
              'w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              copyState === 'error'
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
            )}
            style={focusRingStyles}
          >
            <ClipboardCopy size={16} />
            {copyState === 'copied'
              ? 'Copied talking points'
              : copyState === 'error'
                ? 'Copy failed'
                : 'Copy talking points'}
          </button>
          <p className="text-xs text-slate-500">
            Identity: <span className="font-medium text-slate-600">{params.identity}</span> · Audience:{' '}
            <span className="font-medium text-slate-600">{params.audience}</span> · Attachments:{' '}
            <span className="font-medium text-slate-600">{selectedDocs.length}</span>
          </p>
        </div>
        {copyState === 'error' && (
          <p className="mt-2 text-xs text-red-600">
            Clipboard unavailable in this browser. Paste manually from the download instead.
          </p>
        )}
      </div>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 text-sm text-indigo-900">
        <h3 className="text-sm font-heading font-semibold">Feedback</h3>
        <p className="mt-1 text-xs text-indigo-800">
          Tell us how this session landed. We’ll use aggregated, anonymised
          feedback to improve counter matrices and implementation guidance.
        </p>
        <a
          className="mt-3 inline-flex items-center rounded-md border border-indigo-600 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-white"
          href="mailto:feedback@ethicic.com?subject=Dryvest Feedback"
        >
          Share feedback
        </a>
      </div>
    </aside>
  );
}
