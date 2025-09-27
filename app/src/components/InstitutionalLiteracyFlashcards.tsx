import { BookOpen } from 'lucide-react';

export function InstitutionalLiteracyFlashcards() {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="rounded-lg p-3 text-white"
              style={{ backgroundColor: 'var(--ecic-purple)' }}
            >
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-slate-900">
                Institutional Literacy Flashcards
              </h3>
              <p className="text-sm text-slate-600">
                Learn the assessment questions that help you tell the difference between empty promises and real action.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              document.getElementById('quality-guide')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="inline-flex items-center rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Study Assessment Questions
          </button>
        </div>
      </div>
    </div>
  );
}