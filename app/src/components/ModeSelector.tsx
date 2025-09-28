import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { Zap, Wrench, BarChart3, ClipboardList } from 'lucide-react';

export type BriefMode = 'quick' | 'custom' | 'compare' | 'fact_check';

interface ModeSelectorProps {
  mode: BriefMode | null;
  onModeChange: (mode: BriefMode) => void;
}

const MODE_OPTIONS: Array<{
  id: BriefMode;
  icon: ReactNode;
  title: string;
  eyebrow: string;
  description: string;
  bullets: string[];
}> = [
  {
    id: 'quick',
    icon: <Zap size={20} />,
    title: 'Quick Brief',
    eyebrow: 'Fast start',
    description: 'You choose the institution and audience—Dryvest fills in the brief.',
    bullets: [
      'Picks the talking points, next steps, and citations for you.',
      'Exports copy that fits board packets and email updates.',
    ],
  },
  {
    id: 'custom',
    icon: <Wrench size={20} />,
    title: 'Custom Builder',
    eyebrow: 'Full control',
    description: 'Pull in every point, template, and attachment yourself.',
    bullets: [
      'Build longer memos, slide outlines, or campaign plans.',
      'Mix audiences and tones without losing citations.',
    ],
  },
  {
    id: 'compare',
    icon: <BarChart3 size={20} />,
    title: 'Compare Institutions',
    eyebrow: 'Know the room',
    description: 'See how pensions, endowments, insurers, and others differ before you walk in.',
    bullets: [
      'Highlights shared blockers and unique requirements.',
      'Helps you sequence asks across multiple investors.',
    ],
  },
  {
    id: 'fact_check',
    icon: <ClipboardList size={20} />,
    title: 'Fact Check Workspace',
    eyebrow: 'Check the receipts',
    description: 'Confirm every claim and bundle the sources before you publish.',
    bullets: [
      'Packages citations and source files into take-home packs.',
      'Shows which assertions still need proof.',
    ],
  },
];

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <section className="mb-8 rounded-2xl border border-indigo-100 bg-white/85 p-8 shadow-sm">
      <header className="max-w-3xl space-y-2 mb-6">
        <p className="text-xs font-heading uppercase tracking-wide text-indigo-600">
          Choose your workspace
        </p>
        <h2 className="text-2xl font-heading font-semibold text-slate-900">
          Tell Dryvest how to support this sprint
        </h2>
        <p className="text-sm text-slate-600">
          Each workspace uses the same dataset. The only difference is how much of the brief Dryvest assembles for you.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {MODE_OPTIONS.map(option => {
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onModeChange(option.id)}
              className={clsx(
                'text-left rounded-xl border px-5 py-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                selected
                  ? 'border-ecic-purple bg-ecic-purple/10 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-ecic-purple/40'
              )}
              style={{ '--tw-ring-color': 'var(--ecic-purple)' } as CSSProperties}
            >
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    selected ? 'bg-ecic-purple text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {option.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-heading uppercase tracking-wide text-indigo-600">
                      {option.eyebrow}
                    </p>
                    {selected ? (
                      <span className="rounded-full bg-ecic-purple/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ecic-purple">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-slate-900">
                    {option.title}
                  </h3>
                  <p className="text-sm text-slate-600">{option.description}</p>
                  <ul className="list-disc pl-4 text-xs text-slate-500 space-y-1">
                    {option.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Dryvest stays educational only. It never invents data and every output ties back to the cited dataset.
      </p>
    </section>
  );
}
