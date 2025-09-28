import {
  Zap,
  Wrench,
  BarChart3,
  ClipboardList,
  Sparkles,
  MessageSquareQuote,
} from 'lucide-react';

export type BriefMode = 'quick' | 'custom' | 'compare' | 'fact_check';

interface ModeSelectorProps {
  mode: BriefMode;
  onModeChange: (mode: BriefMode) => void;
  recommendedMode?: BriefMode;
  insight?: string;
  onQuickStart?: () => void;
}

const MODE_DETAILS: Record<BriefMode, {
  title: string;
  description: string;
  icon: JSX.Element;
  highlights: string;
}> = {
  quick: {
    title: 'Quick Brief',
    description:
      'Drop the right institution-specific language on demand with scenario-aware attachments.',
    icon: <Zap size={18} />, 
    highlights: 'Instant scripts • scenario-driven • ready for trustees',
  },
  custom: {
    title: 'Custom Brief',
    description:
      'Compose surgical messaging for each stakeholder while keeping citations aligned.',
    icon: <Wrench size={18} />, 
    highlights: 'Modular decks • tone control • campaign-first',
  },
  compare: {
    title: 'Compare Institutions',
    description:
      'Study the bureaucracy: understand which committees sign, stall, or escalate your demand.',
    icon: <BarChart3 size={18} />, 
    highlights: 'Precedents • governance map • risk narratives',
  },
  fact_check: {
    title: 'Fact Check',
    description:
      'Export parser-ready citations, QA checklists, and attachments for audit trails.',
    icon: <ClipboardList size={18} />, 
    highlights: 'Attribution-first • parser friendly • audit proof',
  },
};

const RECOMMENDATION_COPY: Record<BriefMode, string> = {
  quick: 'Fastest route to institutional language when you need a board-ready script.',
  custom: 'Curate each plank of your campaign without losing citation discipline.',
  compare: 'Understand how peers responded so you can escalate with evidence.',
  fact_check: 'Hand auditors, faculty, and journalists the receipts they expect.',
};

export function ModeSelector({
  mode,
  onModeChange,
  recommendedMode,
  insight,
  onQuickStart,
}: ModeSelectorProps) {
  const handleSelect = (nextMode: BriefMode) => {
    if (nextMode === 'quick' && onQuickStart) {
      onQuickStart();
      return;
    }
    if (nextMode !== mode) {
      onModeChange(nextMode);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-heading font-semibold text-slate-900">
          Choose your pathway
        </h2>
        {insight ? (
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            <MessageSquareQuote size={14} className="text-slate-500" />
            <span className="line-clamp-1">“{insight}”</span>
          </div>
        ) : null}
      </div>

      {recommendedMode ? (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-indigo-600" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Recommended
              </p>
              <p className="text-sm font-heading font-semibold text-slate-900">
                {MODE_DETAILS[recommendedMode].title}
              </p>
              <p className="text-xs text-indigo-700">
                {RECOMMENDATION_COPY[recommendedMode]}
              </p>
              <button
                type="button"
                onClick={() => handleSelect(recommendedMode)}
                className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400"
              >
                Activate {MODE_DETAILS[recommendedMode].title}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {(Object.keys(MODE_DETAILS) as BriefMode[]).map(option => {
          const details = MODE_DETAILS[option];
          const isActive = option === mode;
          const isRecommended = option === recommendedMode;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full rounded-xl border text-left transition ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`rounded-lg p-2 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {details.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-semibold text-slate-900">
                      {details.title}
                    </h3>
                    {isActive ? (
                      <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                        Active
                      </span>
                    ) : null}
                    {isRecommended && !isActive ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                        Suggested
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-700">{details.description}</p>
                  <p className="text-xs text-slate-500">{details.highlights}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
