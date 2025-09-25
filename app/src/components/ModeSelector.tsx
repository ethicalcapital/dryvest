import { Zap, Wrench } from 'lucide-react';

export type BriefMode = 'quick' | 'custom';

interface ModeSelectorProps {
  mode: BriefMode;
  onModeChange: (mode: BriefMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Choose Your Approach</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Quick Brief */}
        <button
          onClick={() => onModeChange('quick')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'quick'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              mode === 'quick' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Quick Brief</h3>
              <p className="text-sm text-slate-600">
                Schema-driven approach. Select your identity, audience, and venue
                to generate a focused brief with pre-selected content.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Fastest setup • ✓ Proven structure • ✓ Expert curation
              </div>
            </div>
          </div>
        </button>

        {/* Custom Brief */}
        <button
          onClick={() => onModeChange('custom')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'custom'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              mode === 'custom' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Custom Brief</h3>
              <p className="text-sm text-slate-600">
                Identity-first builder. Choose your context, then handpick
                specific key points, counterarguments, and resources.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Full control • ✓ Modular selection • ✓ Tailored content
              </div>
            </div>
          </div>
        </button>

      </div>

      {/* Educational reminder */}
      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Remember:</strong> Both modes are for educational exploration only.
          Use these materials to understand investment screening approaches, not as investment advice.
        </p>
      </div>
    </div>
  );
}