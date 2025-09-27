import { useMemo, useState } from 'react';
import { ClipboardCopy, Download } from 'lucide-react';
import type { BriefExportData } from '../lib/exporters';
import { buildFactCheckReport } from '../lib/factCheck';
import { trackEvent } from '../lib/analytics';

interface FactCheckViewProps {
  exportData: BriefExportData;
}

export function FactCheckView({ exportData }: FactCheckViewProps) {
  const factCheckText = useMemo(
    () => buildFactCheckReport(exportData),
    [exportData]
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );
  const [downloadState, setDownloadState] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(factCheckText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = factCheckText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      trackEvent('copy_clicked', { format: 'fact-check' });
      setErrorMessage(null);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch (error) {
      console.error('Fact check copy failed', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Clipboard unavailable. Download the report instead.'
      );
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([factCheckText], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filenameBase = `fact-check_${
        exportData.meta.datasetVersion.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'dryvest'
      }`;
      anchor.href = url;
      anchor.download = `${filenameBase}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      trackEvent('download_clicked', {
        format: 'fact-check',
        datasetVersion: exportData.meta.datasetVersion,
      });
      setErrorMessage(null);
      setDownloadState('success');
      window.setTimeout(() => setDownloadState('idle'), 2000);
    } catch (error) {
      console.error('Fact check download failed', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not download fact-check package.'
      );
      setDownloadState('error');
    }
  };

  const { keyPoints, nextSteps, sources } = exportData;

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-heading uppercase tracking-wide text-indigo-600">
              Fact Check Workspace
            </p>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">
              Audit every claim before you ship
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              This export flattens the entire briefing—assertions, policy language,
              templates, and citations—into a parser-friendly syntax. Use it to
              flag inconsistencies, validate attribution, and capture corrections
              for the next dataset build.
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-500">
              <div>
                <dt className="font-medium text-slate-600">Key points</dt>
                <dd>{keyPoints.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Next steps</dt>
                <dd>{nextSteps.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Unique sources</dt>
                <dd>{sources.length}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ['--tw-ring-color' as any]: 'var(--ecic-purple)' }}
            >
              <ClipboardCopy size={16} />
              {copyState === 'copied'
                ? 'Copied fact-check report'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy fact-check report'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ['--tw-ring-color' as any]: 'var(--ecic-purple)' }}
            >
              <Download size={16} />
              {downloadState === 'success'
                ? 'Downloaded'
                : downloadState === 'error'
                  ? 'Download failed'
                  : 'Download .txt'}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 text-xs font-medium text-amber-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 rounded-xl bg-slate-900 p-4 text-slate-100">
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed font-mono">
            {factCheckText}
          </pre>
        </div>
      </div>
    </div>
  );
}
