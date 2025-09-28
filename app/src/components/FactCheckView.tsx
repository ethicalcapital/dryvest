import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, Download } from 'lucide-react';

import type { BriefContext, Dataset } from '../lib/schema';
import type { BriefExportData } from '../lib/exporters';
import { buildFactCheckReport } from '../lib/factCheck';
import { trackEvent } from '../lib/analytics';
import {
  buildExportForContext,
  contextKey,
  enumerateContexts,
  hasContent,
} from '../lib/factCheckBundle';

interface FactCheckViewProps {
  dataset: Dataset;
  context: BriefContext;
  exportData: BriefExportData;
}

type ContextReport = {
  key: string;
  context: BriefContext;
  exportData: BriefExportData;
  report: string;
  isActive: boolean;
};

const formatLabel = (value: string | undefined) => value ?? 'n/a';

export function FactCheckView({ dataset, context, exportData }: FactCheckViewProps) {
  const contextReports = useMemo<ContextReport[]>(() => {
    const activeKey = contextKey(context);
    const contexts = enumerateContexts(dataset, context);

    const reports: ContextReport[] = contexts
      .map(ctx => {
        const data = buildExportForContext(dataset, ctx);
        if (!hasContent(data)) return null;
        const key = contextKey(ctx);
        return {
          key,
          context: ctx,
          exportData: data,
          report: buildFactCheckReport(data),
          isActive: key === activeKey,
        };
      })
      .filter((entry): entry is ContextReport => Boolean(entry));

    if (!reports.length) {
      const fallbackKey = contextKey(context);
      reports.push({
        key: fallbackKey,
        context,
        exportData,
        report: buildFactCheckReport(exportData),
        isActive: true,
      });
      return reports;
    }

    if (!reports.some(entry => entry.isActive)) {
      reports.unshift({
        key: activeKey,
        context,
        exportData,
        report: buildFactCheckReport(exportData),
        isActive: true,
      });
    }

    return reports.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.key.localeCompare(b.key);
    });
  }, [dataset, context, exportData]);

  const combinedFactCheck = useMemo(
    () => contextReports.map(entry => entry.report).join('\n\n---\n\n'),
    [contextReports]
  );

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );
  const [downloadState, setDownloadState] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(combinedFactCheck);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = combinedFactCheck;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      trackEvent('copy_clicked', {
        format: 'fact-check',
        contexts: contextReports.length,
      });
      setErrorMessage(null);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Clipboard unavailable. Download the report instead.'
      );
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  useEffect(() => {
    if (!contextReports.length) return;
    trackEvent('fact_check_context_viewed', {
      contexts: contextReports.length,
    });
  }, [contextReports.length]);

  const handleDownload = () => {
    try {
      const blob = new Blob([combinedFactCheck], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filenameBase = `fact-check_${
        dataset.version.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'dryvest'
      }`;
      anchor.href = url;
      anchor.download = `${filenameBase}_all-contexts.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      trackEvent('download_clicked', {
        format: 'fact-check',
        datasetVersion: dataset.version,
        contexts: contextReports.length,
      });
      trackEvent('fact_check_bundle_downloaded', {
        contexts: contextReports.length,
      });
      setErrorMessage(null);
      setDownloadState('success');
      window.setTimeout(() => setDownloadState('idle'), 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not download fact-check package.'
      );
      setDownloadState('error');
    }
  };

  const activeSummary = exportData;

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-heading uppercase tracking-wide text-indigo-600">
              Fact Check Workspace
            </p>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">
              Audit every claim across contexts
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              This export flattens every context-aware briefing—assertions, policy language,
              templates, and citations—into parser-friendly text. Use it to spot gaps,
              compare outputs by audience or venue, and capture corrections for the next dataset build.
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-500">
              <div>
                <dt className="font-medium text-slate-600">Key points (active)</dt>
                <dd>{activeSummary.keyPoints.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Next steps (active)</dt>
                <dd>{activeSummary.nextSteps.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Unique sources (active)</dt>
                <dd>{activeSummary.sources.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Assertions linked (active)</dt>
                <dd>{activeSummary.assertions.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Contexts covered</dt>
                <dd>{contextReports.length}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <ClipboardCopy size={16} />
              {copyState === 'copied'
                ? 'Copied fact-check bundle'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy fact-check bundle'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
      </div>

      <div className="space-y-4">
        {contextReports.map(entry => (
          <div
            key={entry.key}
            className={`rounded-xl border bg-white shadow-sm transition ${
              entry.isActive
                ? 'border-indigo-300 ring-1 ring-indigo-200'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {entry.isActive ? 'Active context' : 'Context'}
                </p>
                <h3 className="text-lg font-heading font-semibold text-slate-900">
                  {formatLabel(entry.context.identity)} · {formatLabel(entry.context.audience)} · {formatLabel(entry.context.venue)} · {formatLabel(entry.context.level)}
                </h3>
                <dl className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-600">Key points</dt>
                    <dd>{entry.exportData.keyPoints.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Next steps</dt>
                    <dd>{entry.exportData.nextSteps.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Sources</dt>
                    <dd>{entry.exportData.sources.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-900/95 p-4 text-slate-100">
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                  View fact-check output
                </summary>
                <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed font-mono">
                  {entry.report}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
