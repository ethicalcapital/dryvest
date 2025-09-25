import { BookOpen, Wrench } from 'lucide-react';

export type BriefTone = 'plain' | 'technical';

interface ToneToggleProps {
  tone: BriefTone;
  onToneChange: (tone: BriefTone) => void;
  showSideBySide?: boolean;
  onSideBySideToggle?: (enabled: boolean) => void;
}

export function ToneToggle({
  tone,
  onToneChange,
  showSideBySide = false,
  onSideBySideToggle
}: ToneToggleProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Presentation</h3>

        <div className="flex items-center gap-2">
          {/* Tone Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => onToneChange('plain')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                tone === 'plain'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} />
              Plain
            </button>
            <button
              onClick={() => onToneChange('technical')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                tone === 'technical'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench size={14} />
              Technical
            </button>
          </div>

          {/* Side-by-side toggle */}
          {onSideBySideToggle && (
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showSideBySide}
                onChange={(e) => onSideBySideToggle(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:border-indigo-500 focus:ring-indigo-500"
              />
              Compare
            </label>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-slate-500">
        {tone === 'plain'
          ? 'Clear, accessible language for broader audiences'
          : 'Detailed governance and quantitative framing for fiduciaries'
        }
        {showSideBySide && ' • Showing both versions side-by-side'}
      </p>
    </div>
  );
}