import { useState } from 'react';
import clsx from 'clsx';
import { ClipboardCopy, Download, Printer } from 'lucide-react';
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

const ActionButton = ({
  icon: Icon,
  label,
  description,
  onClick,
  disabled = false,
}: {
  icon: typeof ClipboardCopy;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={clsx(
      'w-full rounded-lg border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
      disabled
        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
    )}
  >
    <div className="flex items-start gap-3">
      <span className="mt-0.5 rounded-md bg-indigo-100 p-1 text-indigo-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
    </div>
  </button>
);

const downloadMarkdown = (data: BriefExportData, tone: BriefTone) => {
  const markdown = buildMarkdown(data, tone);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dryvestment-${tone}-${data.meta.playlistId}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function ActionsPanel({ params, selectedDocs, exportData }: ActionsPanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

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
    <aside className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
        <p className="mt-1 text-xs text-slate-500">
          URL reflects the current configuration. Copy, download, and print workflows render deterministic markdown
          snapshots.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Identity: <span className="font-medium text-slate-600">{params.identity}</span> · Audience:{' '}
          <span className="font-medium text-slate-600">{params.audience}</span> · Attachments:{' '}
          <span className="font-medium text-slate-600">{selectedDocs.length}</span>
        </p>
        <div className="mt-4 space-y-3">
          <ActionButton
            icon={ClipboardCopy}
            label={copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy markdown (plain)'}
            description="Copies the plain-language brief for quick sharing."
            disabled={copyState === 'error'}
            onClick={() => handleCopy('plain')}
          />
          <ActionButton
            icon={Download}
            label="Download markdown (plain)"
            description="Saves the brief in standard markdown for distribution."
            onClick={() => {
              downloadMarkdown(exportData, 'plain');
              trackEvent('download_clicked', { tone: 'plain' });
            }}
          />
          <ActionButton
            icon={Download}
            label="Download markdown (technical)"
            description="Emphasises governance, implementation, and quantitative framing."
            onClick={() => {
              downloadMarkdown(exportData, 'technical');
              trackEvent('download_clicked', { tone: 'technical' });
            }}
          />
          <ActionButton
            icon={Printer}
            label="Print"
            description="Opens the browser print dialog for the current layout."
            onClick={() => {
              window.print();
              trackEvent('print_clicked');
            }}
          />

          {/* PDF Export */}
          <div className="pt-2 border-t border-slate-200">
            <PDFExportButton
              context={{
                identity: params.identity,
                audience: params.audience,
                venue: params.venue,
                level: params.level
              }}
              venue={params.venue?.replace('_', ' ') || 'Investment Committee'}
              decisionMaker="Board of Trustees"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 text-sm text-indigo-900">
        <h3 className="text-sm font-semibold">Feedback</h3>
        <p className="mt-1 text-xs text-indigo-800">
          Tell us how this session landed. We’ll use aggregated, anonymised feedback to improve counter matrices and
          implementation guidance.
        </p>
        <a
          className="mt-3 inline-flex items-center rounded-md border border-indigo-600 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-white"
          href="https://github.com/ethicalcapital/dryvest/issues/new?labels=feedback"
          target="_blank"
          rel="noopener noreferrer"
        >
          Share feedback
        </a>
      </div>
    </aside>
  );
}
