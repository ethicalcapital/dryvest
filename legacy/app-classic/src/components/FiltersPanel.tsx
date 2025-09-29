import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Building,
  Landmark,
  ShieldCheck,
  Handshake,
  Users,
  UserCircle,
  Banknote,
  Scale,
  Scroll,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { ModelDocumentGallery } from './ModelDocumentGallery';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Dataset } from '../lib/schema';
import type { BriefParams } from '../hooks/useBriefParams';
import type { Node } from '../lib/schema';

interface FiltersPanelProps {
  dataset: Dataset;
  params: BriefParams;
  setParams: (next: Partial<BriefParams>) => void;
  selectedDocs: string[];
  toggleDoc: (id: string, include?: boolean) => void;
  onePagers: Extract<Node, { type: 'one_pager' }>[];
}

const IDENTITY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  individual: { label: 'Individual', icon: UserCircle },
  swf: { label: 'Sovereign Fund', icon: Globe },
  public_pension: { label: 'Public Pension', icon: Landmark },
  corporate_pension: { label: 'Corporate Pension', icon: Building },
  endowment: { label: 'Endowment', icon: Building2 },
  foundation: { label: 'Foundation', icon: Handshake },
  insurance: { label: 'Insurance', icon: ShieldCheck },
  central_bank: { label: 'Central Bank', icon: Banknote },
  government: { label: 'Government', icon: Scroll },
};

const AUDIENCE_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  individuals: { label: 'Individuals', icon: UserCircle },
  staff: { label: 'Staff', icon: Users },
  consultants: { label: 'Consultants', icon: Building },
  boards: { label: 'Boards', icon: Scale },
};


const LEVEL_LABELS: Record<string, string> = {
  plain: 'Plain',
  technical: 'Technical',
};

function formatLabel(
  value: string,
  dictionary: Record<string, string>
): string {
  return (
    dictionary[value] ??
    value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  );
}

function OptionButton({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  const styles: CSSProperties = {
    borderColor: active ? 'var(--ecic-purple)' : 'var(--border-gray)',
    backgroundColor: active ? 'var(--ecic-purple)' : undefined,
    ['--tw-ring-color' as any]: 'var(--ecic-purple)',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        active
          ? 'text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
      )}
      style={styles}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

function StepCard({
  step,
  title,
  helper,
  open,
  onToggle,
  children,
}: {
  step: number;
  title: string;
  helper: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-heading uppercase tracking-wide text-slate-400">
            Step {step}
          </p>
          <h3 className="text-sm font-heading font-semibold text-slate-900">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{helper}</p>
        </div>
        <span
          className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-full border text-slate-500 transition-transform',
            open ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'bg-white'
          )}
          style={{ borderColor: 'var(--border-gray)' }}
        >
          <ChevronDown size={16} />
        </span>
      </button>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

export function FiltersPanel({
  dataset,
  params,
  setParams,
  selectedDocs,
  toggleDoc,
  onePagers,
}: FiltersPanelProps) {
  const [showAllIdentities, setShowAllIdentities] = useState(false);
  const queryParams = useMemo(
    () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)),
    []
  );
  const urlHasIdentity = queryParams?.has('identity') ?? false;
  const urlHasAudience = queryParams?.has('audience') ?? false;
  const urlHasLevel = queryParams?.has('level') ?? false;
  const [expandedSteps, setExpandedSteps] = useState(() => ({
    identity: true,
    audience: urlHasIdentity,
    level: urlHasAudience || urlHasLevel,
    attachments: selectedDocs.length > 0,
  }));
  const previousIdentity = useRef(params.identity);
  const previousAudience = useRef(params.audience);

  const identities = useMemo(
    () => dataset.schema.taxonomies?.identity ?? Object.keys(IDENTITY_LABELS),
    [dataset.schema.taxonomies?.identity]
  );
  const audiences = useMemo(
    () => dataset.schema.taxonomies?.audience ?? Object.keys(AUDIENCE_LABELS),
    [dataset.schema.taxonomies?.audience]
  );
  const levels = useMemo(
    () => dataset.schema.taxonomies?.level ?? Object.keys(LEVEL_LABELS),
    [dataset.schema.taxonomies?.level]
  );

  const displayedIdentities = showAllIdentities
    ? identities
    : identities.slice(0, 4);
  const hiddenIdentitiesCount = identities.length - displayedIdentities.length;

  useEffect(() => {
    if (previousIdentity.current !== params.identity) {
      setExpandedSteps(prev => ({ ...prev, audience: true }));
      previousIdentity.current = params.identity;
    }
  }, [params.identity]);

  useEffect(() => {
    if (previousAudience.current !== params.audience) {
      setExpandedSteps(prev => ({ ...prev, level: true }));
      previousAudience.current = params.audience;
    }
  }, [params.audience]);

  useEffect(() => {
    if (selectedDocs.length && !expandedSteps.attachments) {
      setExpandedSteps(prev => ({ ...prev, attachments: true }));
    }
  }, [selectedDocs.length, expandedSteps.attachments]);

  const toggleStep = (step: keyof typeof expandedSteps) => {
    setExpandedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <aside className="space-y-6">
      <StepCard
        step={1}
        title="Choose the investor"
        helper="Pick the institution you need to brief."
        open={expandedSteps.identity}
        onToggle={() => toggleStep('identity')}
      >
        <div className="flex flex-wrap gap-2">
          {displayedIdentities.map(value => {
            const meta = IDENTITY_LABELS[value] ?? {
              label: formatLabel(value, {}),
              icon: Users,
            };
            return (
              <OptionButton
                key={value}
                label={meta.label}
                icon={meta.icon}
                active={params.identity === value}
                onClick={() => setParams({ identity: value })}
              />
            );
          })}
        </div>
        {!showAllIdentities && hiddenIdentitiesCount > 0 && (
          <button
            onClick={() => setShowAllIdentities(true)}
            className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Show {hiddenIdentitiesCount} more identity options
          </button>
        )}
      </StepCard>

      <StepCard
        step={2}
        title="Set the audience"
        helper="Tell Dryvest who will hear this pitch."
        open={expandedSteps.audience}
        onToggle={() => toggleStep('audience')}
      >
        <div className="flex flex-wrap gap-2">
          {audiences.map(value => {
            const meta = AUDIENCE_LABELS[value] ?? {
              label: formatLabel(value, {}),
              icon: Users,
            };
            return (
              <OptionButton
                key={value}
                label={meta.label}
                icon={meta.icon}
                active={params.audience === value}
                onClick={() => setParams({ audience: value })}
              />
            );
          })}
        </div>
      </StepCard>

      <StepCard
        step={3}
        title="Pick the knowledge level"
        helper="Choose plain or technical language for the room."
        open={expandedSteps.level}
        onToggle={() => toggleStep('level')}
      >
        <div className="flex flex-wrap gap-2">
          {levels.map(value => (
            <OptionButton
              key={value}
              label={formatLabel(value, LEVEL_LABELS)}
              active={params.level === value}
              onClick={() => setParams({ level: value })}
            />
          ))}
        </div>
      </StepCard>

      <StepCard
        step={4}
        title="Add model documents"
        helper="Select the templates you want to send with the brief."
        open={expandedSteps.attachments}
        onToggle={() => toggleStep('attachments')}
      >
        <ModelDocumentGallery
          modelDocuments={onePagers}
          selectedDocs={selectedDocs}
          toggleDoc={toggleDoc}
        />
      </StepCard>
    </aside>
  );
}
