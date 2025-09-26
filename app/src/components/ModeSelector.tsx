import { Zap, Wrench, BarChart3 } from 'lucide-react';

export type BriefMode = 'quick' | 'custom' | 'compare';

interface ModeSelectorProps {
  mode: BriefMode;
  onModeChange: (mode: BriefMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm mb-6">
      <h2 className="text-lg font-heading font-semibold text-slate-900 mb-3">
        Choose Your Decoder Mode
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Quick Brief */}
        <button
          onClick={() => onModeChange('quick')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'quick'
              ? 'bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white hover:bg-indigo-50'
          }`}
          style={{
            borderColor:
              mode === 'quick' ? 'var(--ecic-purple)' : 'var(--border-gray)',
            backgroundColor:
              mode === 'quick' ? 'rgba(88, 28, 135, 0.05)' : undefined,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                mode === 'quick' ? 'text-white' : 'bg-slate-100 text-slate-600'
              }`}
              style={{
                backgroundColor:
                  mode === 'quick' ? 'var(--ecic-purple)' : undefined,
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Quick Decoder</h3>
              <p className="text-sm text-slate-600">
                Curated intelligence based on institutional type and audience.
                Get the essential talking points activists need most.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Fastest intel • ✓ Curated content • ✓ Ready-to-use language
              </div>
            </div>
          </div>
        </button>

        {/* Custom Brief */}
        <button
          onClick={() => onModeChange('custom')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'custom'
              ? 'bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white hover:bg-indigo-50'
          }`}
          style={{
            borderColor:
              mode === 'custom' ? 'var(--ecic-purple)' : 'var(--border-gray)',
            backgroundColor:
              mode === 'custom' ? 'rgba(88, 28, 135, 0.05)' : undefined,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                mode === 'custom' ? 'text-white' : 'bg-slate-100 text-slate-600'
              }`}
              style={{
                backgroundColor:
                  mode === 'custom' ? 'var(--ecic-purple)' : undefined,
              }}
            >
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Custom Decoder</h3>
              <p className="text-sm text-slate-600">
                Build your own intelligence brief. Mix and match arguments,
                counterpoints, and insider knowledge for your specific situation.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Full control • ✓ Custom mix • ✓ Situation-specific intel
              </div>
            </div>
          </div>
        </button>

        {/* Compare Mode */}
        <button
          onClick={() => onModeChange('compare')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'compare'
              ? 'bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white hover:bg-indigo-50'
          }`}
          style={{
            borderColor:
              mode === 'compare' ? 'var(--ecic-purple)' : 'var(--border-gray)',
            backgroundColor:
              mode === 'compare' ? 'rgba(88, 28, 135, 0.05)' : undefined,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                mode === 'compare'
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
              style={{
                backgroundColor:
                  mode === 'compare' ? 'var(--ecic-purple)' : undefined,
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">
                Compare Mode
              </h3>
              <p className="text-sm text-slate-600">
                See how institutional approaches differ. Compare pension fund
                language vs endowment priorities vs foundation constraints.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Side-by-side intel • ✓ Institution patterns • ✓ Strategic contrasts
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Educational reminder */}
      <div
        className="mt-4 p-3 rounded-lg border"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderColor: 'var(--ecic-amber)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-dark)' }}>
          <strong>This intelligence is curated, not proven.</strong> These insights
          help activists understand institutional investor language and decision-making
          patterns. Use for campaign strategy, not investment advice.
        </p>
      </div>
    </div>
  );
}
