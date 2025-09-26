import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function BetaDisclaimer() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  BETA
                </span>
                <span className="text-sm font-medium text-amber-800">
                  Institutional Intelligence Tool in Development
                </span>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                <strong>The revolution will be risk-adjusted.</strong> This tool helps
                activists turn moral demands into boring bureaucratic processes that
                institutions can actually implement. Use for strategy, not investment advice.
                <a
                  href="mailto:feedback@ethicic.com?subject=Dryvest Feedback"
                  className="underline hover:no-underline font-medium"
                >
                  Share feedback
                </a>{' '}
                or{' '}
                <a
                  href="mailto:hello@ethicic.com?subject=Dryvest Question"
                  className="underline hover:no-underline font-medium"
                >
                  ask questions
                </a>{' '}
                to help us improve.
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss disclaimer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mobile dismiss button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss disclaimer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
