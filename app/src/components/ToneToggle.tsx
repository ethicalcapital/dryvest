import { BookOpen, Wrench } from 'lucide-react';

export type BriefTone = 'plain' | 'technical';

interface ToneToggleProps {
  tone: BriefTone;
  onToneChange: (tone: BriefTone) => void;
}

export function ToneToggle({
  tone,
  onToneChange,
}: ToneToggleProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-slate-900">
          Presentation
        </h3>

        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => onToneChange('plain')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              tone === 'plain'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{
              backgroundColor:
                tone === 'plain' ? 'var(--ecic-purple)' : undefined,
            }}
          >
            <BookOpen size={14} />
            Plain
          </button>
          <button
            onClick={() => onToneChange('technical')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              tone === 'technical'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{
              backgroundColor:
                tone === 'technical' ? 'var(--ecic-teal)' : undefined,
            }}
          >
            <Wrench size={14} />
            Technical
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-slate-500">
        {tone === 'plain'
          ? 'Clear, accessible language for community organizing'
          : 'Technical governance language for institutional presentations'}
      </p>
    </div>
  );
}
