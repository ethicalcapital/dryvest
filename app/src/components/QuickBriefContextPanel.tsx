import clsx from 'clsx';
import { useMemo, useState, useEffect, type CSSProperties } from 'react';
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

const IDENTITY_ORDER = [
  'corporate_pension',
  'public_pension',
  'endowment',
  'foundation',
  'insurance',
  'swf',
  'government',
  'central_bank',
  'individual',
];

const AUDIENCE_ORDER = [
  'boards',
  'fiduciary',
  'consultants',
  'staff',
  'individuals',
  'stakeholders',
  'regulated',
  'colleagues',
  'family_friends',
];

const AUDIENCE_COPY: Record<string, { label: string; helper: string }> = {
  fiduciary: {
    label: 'Investment Committee',
    helper: 'Voting group with fiduciary authority.',
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
    label: 'Investment Consultant',
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
  const identities = useMemo(() => {
    const values = dataset.schema.taxonomies?.identity ?? [];
    const ordered = IDENTITY_ORDER.filter(value => values.includes(value));
    const leftovers = values.filter(value => !IDENTITY_ORDER.includes(value));
    return [...ordered, ...leftovers];
  }, [dataset.schema.taxonomies?.identity]);

  const referencedAudiences = useMemo(() => {
    const set = new Set<string>();
    dataset.nodes.forEach(node => {
      node.targets?.audience?.forEach(value => set.add(value));
    });
    dataset.playlists.forEach(playlist => {
      playlist.targets?.audience?.forEach(value => set.add(value));
    });
    return set;
  }, [dataset.nodes, dataset.playlists]);

  const audiences = useMemo(() => {
    const values = dataset.schema.taxonomies?.audience ?? [];
    const ordered = AUDIENCE_ORDER.filter(value => values.includes(value));
    const leftovers = values.filter(value => !AUDIENCE_ORDER.includes(value));
    const combined = [...ordered, ...leftovers];
    if (!referencedAudiences.size) {
      return combined;
    }
    const filtered = combined.filter(value => referencedAudiences.has(value));
    if (filtered.length) {
      return filtered;
    }
    const fallback = ['boards', 'fiduciary', 'consultants', 'staff'];
    return combined.filter(value => fallback.includes(value));
  }, [dataset.schema.taxonomies?.audience, referencedAudiences]);
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

  const [collapsed, setCollapsed] = useState({
    identity: Boolean(params.identity),
    audience: Boolean(params.audience),
    motivation: Boolean(params.motivation),
  });

  useEffect(() => {
    if (!params.identity) {
      setCollapsed(prev => ({ ...prev, identity: false }));
    }
  }, [params.identity]);

  useEffect(() => {
    if (!params.audience) {
      setCollapsed(prev => ({ ...prev, audience: false }));
    }
  }, [params.audience]);

  useEffect(() => {
    if (!params.motivation) {
      setCollapsed(prev => ({ ...prev, motivation: false }));
    }
  }, [params.motivation, params.motivationSecondary]);

  const handleIdentitySelect = (value: string) => {
    onParamChange({ identity: value });
    setCollapsed(prev => ({ ...prev, identity: true }));
  };

  const handleAudienceSelect = (value: string) => {
    onParamChange({ audience: value });
    setCollapsed(prev => ({ ...prev, audience: true }));
  };

  const handlePrimaryMotivationSelect = (value: string) => {
    const previousPrimary = params.motivation;
    const updates: Partial<BriefParams> = { motivation: value };
    if (params.motivationSecondary === value) {
      updates.motivationSecondary =
        previousPrimary && previousPrimary !== value
          ? previousPrimary
          : undefined;
    } else if (
      !params.motivationSecondary &&
      previousPrimary &&
      previousPrimary !== value
    ) {
      updates.motivationSecondary = previousPrimary;
    }
    onParamChange(updates);
    setCollapsed(prev => ({ ...prev, motivation: true }));
  };

  const handleSecondaryMotivationToggle = (value: string, active: boolean) => {
    if (active) {
      onParamChange({ motivationSecondary: undefined });
    } else {
      onParamChange({ motivationSecondary: value });
    }
  };

  const reopenSection = (key: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [key]: false }));
  };

  return (
    <div className="space-y-6">
      <StepSection
        title="Which type of organization are you hoping to influence?"
        step="1"
        helper="Pick the investor profile so the strategy language fits their governance." 
      >
        {collapsed.identity && params.identity ? (
          <SummaryCard
            title={
              (IDENTITY_COPY[params.identity]?.label ??
                formatTaxonomyValue(params.identity))
            }
            helper={IDENTITY_COPY[params.identity]?.helper}
            onEdit={() => reopenSection('identity')}
          />
        ) : (
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
                  onClick={() => handleIdentitySelect(value)}
                />
              );
            })}
          </div>
        )}
      </StepSection>

      <StepSection
        title="Who has to say yes?"
        step="2"
        helper="Identify the audience whose approval or implementation you need." 
      >
        {collapsed.audience && params.audience ? (
          <SummaryCard
            title={
              (AUDIENCE_COPY[params.audience]?.label ??
                formatTaxonomyValue(params.audience))
            }
            helper={AUDIENCE_COPY[params.audience]?.helper}
            onEdit={() => reopenSection('audience')}
          />
        ) : (
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
                  onClick={() => handleAudienceSelect(value)}
                />
              );
            })}
          </div>
        )}
      </StepSection>

      <StepSection
        title="Why will they move?"
        step="3"
        helper="Rank the campaign pressures so Dryvest can weight the briefing appropriately."
      >
        {collapsed.motivation && params.motivation ? (
          <SummaryCard
            title={formatTaxonomyValue(params.motivation)}
            helper="Campaign drivers locked"
            lines={[
              `Primary: ${formatTaxonomyValue(params.motivation)}`,
              `Secondary: ${
                params.motivationSecondary
                  ? formatTaxonomyValue(params.motivationSecondary)
                  : 'None selected'
              }`,
            ]}
            onEdit={() => reopenSection('motivation')}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-heading uppercase tracking-wide text-slate-500 mb-2">
                Most important driver
              </p>
              <div className="flex flex-wrap gap-2">
                {motivations.map(option => {
                  const active = params.motivation === option.value;
                  return (
                    <OptionButton
                      key={`primary-${option.value}`}
                      active={active}
                      label={option.label}
                      description={active ? 'Primary driver' : option.helper}
                      onClick={() => handlePrimaryMotivationSelect(option.value)}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-heading uppercase tracking-wide text-slate-500">
                  Second-most important (optional)
                </p>
                {params.motivationSecondary ? (
                  <button
                    type="button"
                    onClick={() => onParamChange({ motivationSecondary: undefined })}
                    className="text-xs font-medium text-ecic-purple hover:underline"
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {motivations.map(option => {
                  const isPrimary = params.motivation === option.value;
                  const active = params.motivationSecondary === option.value;
                  return (
                    <OptionButton
                      key={`secondary-${option.value}`}
                      active={active}
                      disabled={isPrimary}
                      label={option.label}
                      description={
                        isPrimary
                          ? 'Already set as primary'
                          : active
                            ? 'Secondary driver'
                            : option.helper
                      }
                      onClick={() => handleSecondaryMotivationToggle(option.value, active)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
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

interface SummaryCardProps {
  title: string;
  helper?: string;
  lines?: string[];
  onEdit: () => void;
}

function SummaryCard({ title, helper, lines, onEdit }: SummaryCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-ecic-purple/40 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-heading font-semibold text-slate-900">{title}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        {lines && lines.length ? (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {lines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-medium text-ecic-purple hover:underline"
      >
        Change
      </button>
    </div>
  );
}

interface OptionButtonProps {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

function OptionButton({
  active,
  label,
  description,
  onClick,
  disabled = false,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full sm:w-auto flex-1 min-w-[200px] rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
          : active
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
