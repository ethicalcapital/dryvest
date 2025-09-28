import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { Zap, Wrench, BarChart3, ClipboardList } from 'lucide-react';

export type BriefMode = 'quick' | 'custom' | 'compare' | 'fact_check';

interface ModeSelectorProps {
  mode: BriefMode | null;
  onModeChange: (mode: BriefMode) => void;
}

const MODE_OPTIONS: Array<{
  id: BriefMode;
  icon: JSX.Element;
  title: string;
  eyebrow: string;
  description: string;
  bullets: string[];
}> = [
  {
    id: 'quick',
    icon: <Zap size={20} />,
    title: 'Quick Brief',
    eyebrow: 'Institution-specific language in minutes',
    description:
      'Feed the room a ready-to-implement narrative that matches their policies, governance cadence, and reporting playbook.',
    bullets: [
      'Auto-curated key points, next steps, and sources.',
      'Context-aware templates that sound like internal memos.',
      'Perfect for rapid-response meetings and stakeholder updates.',
    ],
  },
  {
    id: 'custom',
    icon: <Wrench size={20} />,
    title: 'Custom Builder',
    eyebrow: 'Craft deliberate, campaign-ready strategy',
    description:
      'Handpick every key point, template, and attachment to build a bespoke brief for your coalition or executive sponsor.',
    bullets: [
      'Full control over tone, sequence, and supporting evidence.',
      'Mix and match audiences to prototype escalation paths.',
      'Ideal for campaign memos, board decks, and investor FAQs.',
    ],
  },
  {
    id: 'compare',
    icon: <BarChart3 size={20} />,
    title: 'Compare Institutions',
    eyebrow: 'Benchmark how different investors respond',
    description:
      'Study the playbooks of pensions, endowments, insurers, and more so you can tailor pressure, sequencing, and asks.',
    bullets: [
      'See which governance gates matter for each identity.',
      'Surface shared blockers and differentiators across audiences.',
      'Use insights to brief multi-institution coalitions.',
    ],
  },
  {
    id: 'fact_check',
    icon: <ClipboardList size={20} />,
    title: 'Fact Check Workspace',
    eyebrow: 'Audit every claim before you launch',
    description:
      'Turn the dataset into a diligence room: verify citations, export parser-friendly references, and prep release-ready notes.',
    bullets: [
      'Generate source packs and markdown dossiers in one click.',
      'Track assertion coverage and outstanding gaps.',
      'Perfect for legal review, press kits, and board responses.',
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
          Every mode uses the same institutional intelligence; the difference is how much curation you want to do yourself.
          Pick the workspace that matches your moment and we&rsquo;ll shape the experience around it.
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
        Dryvest operationalises solidarity. Each workspace keeps outputs educational-only,
        balances policy realism with campaign energy, and never invents data we can&rsquo;t cite.
      </p>
    </section>
  );
}
