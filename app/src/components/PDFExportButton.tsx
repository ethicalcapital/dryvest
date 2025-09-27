import { useState, type CSSProperties } from 'react';
import { Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { buildMarkdown, type BriefExportData, type BriefTone } from '../lib/exporters';
import { exportToPDF, generateTitle } from '../lib/pdf-export';
import { trackEvent } from '../lib/analytics';
import type { BriefContext } from '../lib/schema';

interface PDFExportButtonProps {
  context: BriefContext;
  exportData: BriefExportData;
  tone: BriefTone;
  disabled?: boolean;
}

export function PDFExportButton({
  context,
  exportData,
  tone,
  disabled = false,
}: PDFExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const primaryButtonStyles: CSSProperties & { '--tw-ring-color': string } = {
    backgroundColor: 'var(--ecic-purple)',
    '--tw-ring-color': 'var(--ecic-purple)',
  };

  const handleExport = async () => {
    if (disabled || status === 'loading') return;
    setErrorMessage(null);
    setStatus('loading');

    try {
      const markdown = buildMarkdown(exportData, tone);
      const title = generateTitle(context);
      await exportToPDF({
        title,
        content: markdown,
        venue: context.venue ?? 'Strategic Briefing',
        decisionMaker: context.audience ?? 'Decision Makers',
        context,
      });
      trackEvent('download_clicked', {
        format: 'pdf',
        tone,
        datasetVersion: exportData.meta.datasetVersion,
      });
      setStatus('success');
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'PDF export failed. Please try again.';
      setErrorMessage(message);
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={disabled || status === 'loading'}
        className="w-full inline-flex items-center justify-center gap-3 rounded-lg px-6 py-4 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={primaryButtonStyles}
      >
        {status === 'loading' ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Download size={20} />
        )}
        {status === 'loading'
          ? 'Generating PDF…'
          : status === 'success'
            ? 'PDF ready!'
            : 'Download strategy brief (PDF)'}
      </button>

      {status === 'success' && !errorMessage ? (
        <p className="flex items-center gap-2 text-xs font-medium text-green-700">
          <CheckCircle2 size={14} /> PDF downloaded with Dryvest formatting.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="flex items-center gap-2 text-xs font-medium text-amber-700">
          <AlertTriangle size={14} /> {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
