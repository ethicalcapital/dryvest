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
        title="Which institution are you speaking for?"
        step="1"
        helper="Choose the investor type you need to brief."
      >
        <div className="space-y-2">
          {identities.map(value => {
            const active = params.identity === value;
            return (
              <OptionButton
                key={value}
                active={active}
                label={formatTaxonomyValue(value)}
                description={
                  active
                    ? 'Active context'
                    : 'Set brief to this institution'
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
        helper="Who has to approve or implement the decision?"
      >
        <div className="space-y-2">
          {audiences.map(value => {
            const active = params.audience === value;
            return (
              <OptionButton
                key={value}
                active={active}
                label={formatTaxonomyValue(value)}
                description={
                  active
                    ? 'Active context'
                    : 'Switch briefing to this audience'
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
        <div className="space-y-2">
          {motivations.map(option => {
            const active = params.motivation === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onParamChange({ motivation: option.value })}
                className={clsx(
                  'w-full rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  active
                    ? 'border-ecic-purple/70 bg-ecic-purple/10 text-ecic-purple shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
                )}
                style={{
                  '--tw-ring-color': 'var(--ecic-purple)',
                } as CSSProperties}
              >
                <div className="font-heading text-sm font-semibold">
                  {option.label}
                </div>
                <p className="mt-1 text-xs text-slate-600">{option.helper}</p>
              </button>
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
        'w-full rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
