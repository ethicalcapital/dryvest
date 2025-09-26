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
        Choose Your Approach
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
              <h3 className="font-heading font-semibold mb-1">Quick Brief</h3>
              <p className="text-sm text-slate-600">
                Schema-driven approach. Select your identity, audience, and
                venue to generate a focused brief with pre-selected content.
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
              <h3 className="font-heading font-semibold mb-1">Custom Brief</h3>
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
                Compare Entities
              </h3>
              <p className="text-sm text-slate-600">
                See how content differs across entity types. Compare how
                approaches vary for endowments, pensions, foundations, etc.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                ✓ Side-by-side view • ✓ Entity-specific content • ✓ Educational
                insights
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
          <strong>For activists:</strong> All modes help you decode how institutional
          investors work. Use these insights to craft more effective campaigns,
          not as investment advice.
        </p>
      </div>
    </div>
  );
}
