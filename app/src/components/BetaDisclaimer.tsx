import { useState } from 'react';
import { X, AlertTriangle, BookOpen } from 'lucide-react';

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
                  Educational Tool in Development
                </span>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                <strong>This is an educational prototype</strong> for exploring investment screening approaches.
                Content is for learning purposes only and does not constitute investment advice.
                <a
                  href="https://github.com/ethicalcapital/dryvest/issues/new?labels=feedback"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline font-medium"
                >
                  Share feedback
                </a> or{' '}
                <a
                  href="https://github.com/ethicalcapital/dryvest/issues/new?labels=question"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline font-medium"
                >
                  ask questions
                </a> to help us improve.
              </p>
            </div>
          </div>

          {/* Professional Consultation CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://calendly.com/ethical-capital/consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <BookOpen size={14} />
              Get Real Advice
            </a>

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

        {/* Mobile CTA */}
        <div className="md:hidden mt-3 pt-3 border-t border-amber-200">
          <a
            href="https://calendly.com/ethical-capital/consultation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            <BookOpen size={14} />
            Schedule Professional Consultation
          </a>
        </div>
      </div>
    </div>
  );
}