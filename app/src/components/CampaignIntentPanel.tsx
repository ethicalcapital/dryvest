import { Sparkles, Target, Compass, Lightbulb, Wand2 } from 'lucide-react';
import type { BriefMode } from './ModeSelector';

export interface CampaignIntentPanelProps {
  intent: string;
  onIntentChange: (value: string) => void;
  objective: CampaignObjective;
  onObjectiveChange: (value: CampaignObjective) => void;
  onSubmit: () => void;
  suggestedMode?: BriefMode;
  onApplySuggestedMode?: (mode: BriefMode) => void;
  statusMessage?: string | null;
  statusTone?: 'success' | 'warning' | 'info';
}

export type CampaignObjective = 'secure_commitment' | 'expand_coalition' | 'audit_programme' | 'pressure_escalation' | 'unspecified';

export const OBJECTIVE_OPTIONS: Array<{
  value: CampaignObjective;
  label: string;
  description: string;
  hint: string;
}> = [
  {
    value: 'secure_commitment',
    label: 'Win an institutional commitment',
    description: 'Frame divestment as routine fiduciary maintenance for boards and committees.',
    hint: 'Pairs with Quick Brief for fast, policy-ready language.',
  },
  {
    value: 'expand_coalition',
    label: 'Grow internal alignment',
    description: 'Equip student, faculty, or labour allies with consistent talking points.',
    hint: 'Custom Brief surfaces modular key points for different audiences.',
  },
  {
    value: 'audit_programme',
    label: 'Audit claims and sourcing',
    description: 'Validate every citation, attachment, and screening policy detail.',
    hint: 'Fact Check mode exports parser-friendly references.',
  },
  {
    value: 'pressure_escalation',
    label: 'Plan pressure escalation',
    description: 'Study how peer institutions respond to similar demands.',
    hint: 'Compare mode maps bureaucratic precedents.',
  },
  {
    value: 'unspecified',
    label: 'Still drafting strategy',
    description: 'Capture exploratory language and decide the path once you see outputs.',
    hint: 'Start anywhere—Dryvest keeps the campaign voice handy.',
  },
];

const MODE_SUMMARIES: Record<BriefMode, { title: string; line: string }> = {
  quick: {
    title: 'Quick Brief',
    line: 'Instant institution-ready script tuned to your campaign context.',
  },
  custom: {
    title: 'Custom Brief',
    line: 'Hand-pick key points and supporting material for bespoke coalitions.',
  },
  compare: {
    title: 'Compare Institutions',
    line: 'Surface the playbooks different institutions use to accept or stall proposals.',
  },
  fact_check: {
    title: 'Fact Check',
    line: 'Audit every claim with citations, attachments, and parser-ready formatting.',
  },
};

export function CampaignIntentPanel({
  intent,
  onIntentChange,
  objective,
  onObjectiveChange,
  onSubmit,
  suggestedMode,
  onApplySuggestedMode,
  statusMessage,
  statusTone = 'info',
}: CampaignIntentPanelProps) {
  const trimmedIntent = intent.trim();
  const characterCount = intent.length;

  const recommended = suggestedMode
    ? {
        key: suggestedMode,
        ...MODE_SUMMARIES[suggestedMode],
      }
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-indigo-700">
        <Sparkles size={18} />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Campaign Console
        </span>
      </div>

      <div className="mt-4 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-800" htmlFor="campaign-intent">
            Describe what you need Dryvest to accomplish (plain language is perfect)
          </label>
          <textarea
            id="campaign-intent"
            value={intent}
            onChange={event => onIntentChange(event.target.value)}
            rows={4}
            placeholder="e.g. We need a quick brief for trustees who care about risk parity but are blocking ceasefire divestment appeals."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{characterCount} characters</span>
            {trimmedIntent ? (
              <span className="inline-flex items-center gap-1 text-indigo-600">
                <Wand2 size={14} />
                Capturing your campaign language
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Primary objective
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {OBJECTIVE_OPTIONS.map(option => {
              const isActive = option.value === objective;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onObjectiveChange(option.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Target size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-slate-600">{option.description}</p>
                      <p className="text-xs text-indigo-500">{option.hint}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <Compass size={16} />
            Save campaign focus
          </button>

          {statusMessage ? (
            <span
              className={`inline-flex items-center gap-2 text-xs font-medium ${
                statusTone === 'success'
                  ? 'text-emerald-700'
                  : statusTone === 'warning'
                    ? 'text-amber-700'
                    : 'text-slate-600'
              }`}
            >
              <Lightbulb size={14} />
              {statusMessage}
            </span>
          ) : null}
        </div>

        {recommended ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-indigo-600" />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Suggested pathway
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-heading font-semibold text-slate-900">
                    {recommended.title}
                  </p>
                  <p className="text-sm text-slate-700">{recommended.line}</p>
                </div>
                {onApplySuggestedMode ? (
                  <button
                    type="button"
                    onClick={() => onApplySuggestedMode(recommended.key)}
                    className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400"
                  >
                    Activate {recommended.title}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Current working language
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {trimmedIntent
              ? trimmedIntent
              : 'Share the campaign tone you need Dryvest to mirror. We will echo your phrasing across briefs, comparisons, and fact checks.'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Dryvest stores this locally and in anonymized analytics to keep us speaking your movement language.
          </p>
        </div>
      </div>
    </div>
  );
}
