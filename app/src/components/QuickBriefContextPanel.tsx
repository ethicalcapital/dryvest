import clsx from 'clsx';
import { useMemo, type CSSProperties } from 'react';
import type { Dataset, Node } from '../lib/schema';
import type { BriefParams } from '../hooks/useBriefParams';
import { formatTaxonomyValue } from '../lib/format';
import { OnePagerGallery } from './OnePagerGallery';

interface MotivationOption {
  value: string;
  label: string;
  helper: string;
}

const IDENTITY_COPY: Record<string, { label: string; helper: string }> = {
  individual: {
    label: 'Individual Portfolio',
    helper: 'Personal or family-managed capital.',
  },
  swf: {
    label: 'Sovereign Wealth Fund',
    helper: 'State-owned investment authority.',
  },
  public_pension: {
    label: 'Public Pension Plan',
    helper: 'Municipal or state retirement system.',
  },
  corporate_pension: {
    label: 'Corporate Pension Plan',
    helper: 'Employer-sponsored retirement fund.',
  },
  endowment: {
    label: 'University or Cultural Endowment',
    helper: 'Endowment board or investment office.',
  },
  foundation: {
    label: 'Foundation / Philanthropy',
    helper: 'Private or community foundation assets.',
  },
  insurance: {
    label: 'Insurance Company',
    helper: 'General account with ALM oversight.',
  },
  central_bank: {
    label: 'Central Bank / Monetary Authority',
    helper: 'Reserve management and policy teams.',
  },
  government: {
    label: 'Government Treasury',
    helper: 'Public finance or treasury office.',
  },
};

const AUDIENCE_COPY: Record<string, { label: string; helper: string }> = {
  fiduciary: {
    label: 'Fiduciary Committee',
    helper: 'Voting body with fiduciary authority.',
  },
  boards: {
    label: 'Board of Directors / Trustees',
    helper: 'Governing board for oversight and sign-off.',
  },
  staff: {
    label: 'Investment Staff',
    helper: 'Day-to-day implementation team.',
  },
  consultants: {
    label: 'External Consultant',
    helper: 'Advisor drafting official recommendations.',
  },
  stakeholders: {
    label: 'Stakeholder Coalition',
    helper: 'Community, labor, or coalition partners.',
  },
  colleagues: {
    label: 'Internal Colleagues',
    helper: 'Cross-functional peers you align with.',
  },
  regulated: {
    label: 'Regulators / Oversight',
    helper: 'Compliance or supervisory audience.',
  },
  individuals: {
    label: 'Executive Sponsor',
    helper: 'CIO, CFO, or equivalent decision-maker.',
  },
  family_friends: {
    label: 'Personal Network',
    helper: 'Use when tailoring for individual advocates.',
  },
};

interface QuickBriefContextPanelProps {
  dataset: Dataset;
  params: BriefParams;
  onParamChange: (next: Partial<BriefParams>) => void;
  motivationOptions: MotivationOption[];
  selectedDocs: string[];
  toggleDoc: (id: string, include?: boolean) => void;
  onePagers: Extract<Node, { type: 'one_pager' }>[];
}

export function QuickBriefContextPanel({
  dataset,
  params,
  onParamChange,
  motivationOptions,
  selectedDocs,
  toggleDoc,
  onePagers,
}: QuickBriefContextPanelProps) {
  const identities = useMemo(
    () => dataset.schema.taxonomies?.identity ?? [],
    [dataset.schema.taxonomies?.identity]
  );
  const audiences = useMemo(
    () => dataset.schema.taxonomies?.audience ?? [],
    [dataset.schema.taxonomies?.audience]
  );
  const motivations = useMemo(() => {
    const allowed = dataset.schema.taxonomies?.motivation;
    const order = allowed && allowed.length ? allowed : motivationOptions.map(opt => opt.value);
    return order.map(value => {
      const existing = motivationOptions.find(option => option.value === value);
      if (existing) return existing;
      return {
        value,
        label: formatTaxonomyValue(value),
        helper: 'Tailor the narrative to match your campaign driver.',
      } satisfies MotivationOption;
    });
  }, [dataset.schema.taxonomies?.motivation, motivationOptions]);

  return (
    <div className="space-y-6">
      <StepSection
        title="Which type of organization are you hoping to influence?"
        step="1"
        helper="Pick the investor profile so the strategy language fits their governance." 
      >
        <div className="flex flex-wrap gap-2">
          {identities.map(value => {
            const active = params.identity === value;
            const meta = IDENTITY_COPY[value] ?? {
              label: formatTaxonomyValue(value),
              helper: 'Tailor strategy to this investor type.',
            };
            return (
              <OptionButton
                key={value}
                active={active}
                label={meta.label}
                description={
                  active ? 'Active context' : meta.helper
                }
                onClick={() => onParamChange({ identity: value })}
              />
            );
          })}
        </div>
      </StepSection>

      <StepSection
        title="Who has to say yes?"
        step="2"
        helper="Identify the audience whose approval or implementation you need." 
      >
        <div className="flex flex-wrap gap-2">
          {audiences.map(value => {
            const active = params.audience === value;
            const meta = AUDIENCE_COPY[value] ?? {
              label: formatTaxonomyValue(value),
              helper: 'Retarget the brief toward this audience.',
            };
            return (
              <OptionButton
                key={value}
                active={active}
                label={meta.label}
                description={
                  active ? 'Active context' : meta.helper
                }
                onClick={() => onParamChange({ audience: value })}
              />
            );
          })}
        </div>
      </StepSection>

      <StepSection
        title="Why will they move?"
        step="3"
        helper="Pick the pressure driving this briefing to change the strategy mix."
      >
        <div className="flex flex-wrap gap-2">
          {motivations.map(option => {
            const active = params.motivation === option.value;
            return (
              <OptionButton
                key={option.value}
                active={active}
                label={option.label}
                description={active ? 'Active driver' : option.helper}
                onClick={() => onParamChange({ motivation: option.value })}
              />
            );
          })}
        </div>
      </StepSection>

      {onePagers.length > 0 ? (
        <StepSection
          title="Add supporting attachments"
          step="4"
          helper="Drop in relevant one-pagers to send after the meeting."
        >
          <OnePagerGallery
            onePagers={onePagers}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
          />
        </StepSection>
      ) : null}
    </div>
  );
}

interface OptionButtonProps {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}

function OptionButton({ active, label, description, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full sm:w-auto flex-1 min-w-[200px] rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        active
          ? 'border-ecic-purple bg-ecic-purple/10 text-ecic-purple shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
      )}
      style={{ '--tw-ring-color': 'var(--ecic-purple)' } as CSSProperties}
    >
      <div className="font-heading text-sm font-semibold">{label}</div>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </button>
  );
}

interface StepSectionProps {
  step: string;
  title: string;
  helper: string;
  children: React.ReactNode;
}

function StepSection({ step, title, helper, children }: StepSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-3 space-y-1">
        <p className="text-xs font-heading uppercase tracking-wide text-slate-400">
          Step {step}
        </p>
        <h3 className="text-sm font-heading font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{helper}</p>
      </header>
      {children}
    </section>
  );
}
