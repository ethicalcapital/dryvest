import { useState, type CSSProperties } from 'react';
import { Download } from 'lucide-react';
import type { BriefExportData } from '../lib/exporters';
import type { BriefContext } from '../lib/schema';

interface PDFExportButtonProps {
  context: BriefContext;
  exportData: BriefExportData;
  disabled?: boolean;
}

export function PDFExportButton({
  context: _context,
  exportData: _exportData,
  disabled = false,
}: PDFExportButtonProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const primaryButtonStyles: CSSProperties = {
    backgroundColor: 'var(--ecic-purple)',
    ['--tw-ring-color' as any]: 'var(--ecic-purple)',
  };

  const handleExport = () => {
    setShowComingSoon(true);
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-3 rounded-lg px-6 py-4 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={primaryButtonStyles}
      >
        <Download size={20} />
        Download strategy brief (PDF)
      </button>

      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-lg rounded-lg bg-white p-8 shadow-xl">
            <h3 className="mb-4 text-xl font-heading font-semibold text-gray-900">
              PDF export is almost ready
            </h3>
            <div className="mb-6 space-y-3 text-base text-gray-700">
              <p>Thanks for pushing Dryvest forward. The polished PDF handoff is in final QA.</p>
              <p>
                We’re sorry it isn’t live today. We&apos;ll email you as soon as the export is ready—very soon.
                In the meantime, use the copy button to grab the briefing text.
              </p>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowComingSoon(false)}
                className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowComingSoon(false)}
                className="px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={primaryButtonStyles}
              >
                Awesome, keep me posted
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
