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
    <section className="relative z-[1] mb-10 rounded-3xl border border-white/40 bg-white p-8 shadow-2xl">
      <header className="max-w-3xl space-y-2 mb-6">
        <p className="text-xs font-heading uppercase tracking-wide text-slate-500">
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
          const buttonStyle = {
            ...(selected
              ? {
                  background:
                    'linear-gradient(135deg, var(--ecic-purple) 0%, var(--ecic-teal) 100%)',
                  color: '#ffffff',
                }
              : {}),
            '--tw-ring-color': 'var(--ecic-purple)',
          } as CSSProperties;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onModeChange(option.id)}
              className={clsx(
                'transform text-left rounded-2xl border px-6 py-6 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-lg',
                selected
                  ? 'border-transparent text-white shadow-2xl -translate-y-1'
                  : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-1 hover:border-ecic-purple/40'
              )}
              style={buttonStyle}
            >
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {option.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p
                      className={clsx(
                        'text-xs font-heading uppercase tracking-wide',
                        selected ? 'text-white/80' : 'text-indigo-600'
                      )}
                    >
                      {option.eyebrow}
                    </p>
                    {selected ? (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <h3
                    className={clsx(
                      'text-lg font-heading font-semibold',
                      selected ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {option.title}
                  </h3>
                  <p className={clsx('text-sm', selected ? 'text-white/90' : 'text-slate-600')}>
                    {option.description}
                  </p>
                  <ul
                    className={clsx(
                      'list-disc pl-4 text-xs space-y-1',
                      selected ? 'text-white/80' : 'text-slate-500'
                    )}
                  >
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
