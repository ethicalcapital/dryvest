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
  description: string;
}> = [
  {
    id: 'quick',
    icon: <Zap size={18} />,
    title: 'Quick Brief',
    description: 'Dryvest assembles the briefing slide for you.',
  },
  {
    id: 'custom',
    icon: <Wrench size={18} />,
    title: 'Custom Builder',
    description: 'You pick every point, template, and attachment.',
  },
  {
    id: 'compare',
    icon: <BarChart3 size={18} />,
    title: 'Compare',
    description: 'Scan how each investor type reacts before the meeting.',
  },
  {
    id: 'fact_check',
    icon: <ClipboardList size={18} />,
    title: 'Fact Check',
    description: 'Bundle the citations and proof points before you share.',
  },
];

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-heading uppercase tracking-[0.25em] text-white/50">
        Workspace
      </p>

      <div className="space-y-2">
        {MODE_OPTIONS.map(option => {
          const selected = mode === option.id;
          const buttonStyle = {
            ...(selected
              ? {
                  background:
                    'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(20, 184, 166, 0.95) 100%)',
                  color: '#ffffff',
                }
              : { backgroundColor: '#111827CC' }),
            '--tw-ring-color': 'var(--ecic-purple)',
          } as CSSProperties;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onModeChange(option.id)}
              className={clsx(
                'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                selected
                  ? 'border-transparent shadow-lg'
                  : 'border-white/10 text-white/70 hover:border-white/20'
              )}
              style={buttonStyle}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    selected ? 'bg-white/15 text-white' : 'bg-white/10 text-white/70'
                  )}
                >
                  {option.icon}
                </span>
                <div>
                  <p
                    className={clsx(
                      'text-sm font-heading font-semibold',
                      selected ? 'text-white' : 'text-white/80'
                    )}
                  >
                    {option.title}
                  </p>
                  <p className="text-xs text-white/60">{option.description}</p>
                </div>
              </div>

              {selected ? (
                <span className="text-[10px] font-heading uppercase tracking-wide text-white/80">
                  Selected
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
