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
} from 'lucide-react';
import { OnePagerGallery } from './OnePagerGallery';
import clsx from 'clsx';
import { useState } from 'react';
import type { Dataset } from '../lib/schema';
import type { BriefParams } from '../hooks/useBriefParams';
import type { Node } from '../lib/schema';

interface FiltersPanelProps {
  dataset: Dataset;
  params: BriefParams;
  setParams: (next: Partial<BriefParams>) => void;
  playlistsForKeyPoints: string[];
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
  family_friends: { label: 'Family & Friends', icon: Users },
  fiduciary: { label: 'Fiduciary / Board', icon: Scale },
  regulated: { label: 'Regulated Issuer', icon: Landmark },
};

const VENUE_LABELS: Record<string, string> = {
  one_on_one: '1:1 Conversation',
  small_group: 'Small Group Session',
  town_meeting: 'Town Meeting',
  school_board: 'School Board',
  city_council: 'City Council',
  committee_hearing: 'Committee Hearing',
  full_board_meeting: 'Full Board Meeting',
  public_testimony: 'Public Testimony',
  written_memo: 'Written Memo',
};

const LEVEL_LABELS: Record<string, string> = {
  plain: 'Plain',
  technical: 'Technical',
};

function formatLabel(value: string, dictionary: Record<string, string>): string {
  return dictionary[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
      style={{
        borderColor: active ? 'var(--ecic-purple)' : 'var(--border-gray)',
        backgroundColor: active ? 'var(--ecic-purple)' : undefined,
        ['--tw-ring-color' as any]: 'var(--ecic-purple)',
      }}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

export function FiltersPanel({
  dataset,
  params,
  setParams,
  playlistsForKeyPoints,
  selectedDocs,
  toggleDoc,
  onePagers,
}: FiltersPanelProps) {
  const [showAllIdentities, setShowAllIdentities] = useState(false);
  const [showAllVenues, setShowAllVenues] = useState(false);

  const identities = dataset.schema.taxonomies?.identity ?? Object.keys(IDENTITY_LABELS);
  const audiences = dataset.schema.taxonomies?.audience ?? Object.keys(AUDIENCE_LABELS);
  const venues = dataset.schema.taxonomies?.venue ?? Object.keys(VENUE_LABELS);
  const levels = dataset.schema.taxonomies?.level ?? Object.keys(LEVEL_LABELS);

  // Limit options to reduce overwhelm
  const displayedIdentities = showAllIdentities ? identities : identities.slice(0, 4);
  const displayedVenues = showAllVenues ? venues : venues.slice(0, 4);
  const hiddenIdentitiesCount = identities.length - displayedIdentities.length;
  const hiddenVenuesCount = venues.length - displayedVenues.length;

  return (
    <aside className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-heading font-semibold uppercase tracking-wide text-slate-500">Investor identity</p>
        <div className="flex flex-wrap gap-2">
          {displayedIdentities.map((value) => {
            const meta = IDENTITY_LABELS[value] ?? { label: formatLabel(value, {}), icon: Users };
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
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Show {hiddenIdentitiesCount} more identity options
          </button>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-heading font-semibold uppercase tracking-wide text-slate-500">Audience</p>
        <div className="flex flex-wrap gap-2">
          {audiences.map((value) => {
            const meta = AUDIENCE_LABELS[value] ?? { label: formatLabel(value, {}), icon: Users };
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
      </section>

      <section className="space-y-3">
        <p className="text-xs font-heading font-semibold uppercase tracking-wide text-slate-500">Venue</p>
        <div className="grid grid-cols-1 gap-2">
          {displayedVenues.map((value) => (
            <OptionButton
              key={value}
              label={formatLabel(value, VENUE_LABELS)}
              active={params.venue === value}
              onClick={() => setParams({ venue: value })}
            />
          ))}
        </div>
        {!showAllVenues && hiddenVenuesCount > 0 && (
          <button
            onClick={() => setShowAllVenues(true)}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Show {hiddenVenuesCount} more venue options
          </button>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-heading font-semibold uppercase tracking-wide text-slate-500">Knowledge level</p>
        <div className="flex gap-2">
          {levels.map((value) => (
            <OptionButton
              key={value}
              label={formatLabel(value, LEVEL_LABELS)}
              active={params.level === value}
              onClick={() => setParams({ level: value })}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-xs font-heading font-semibold uppercase tracking-wide text-slate-500" htmlFor="playlist-select">
          Key point playlist
        </label>
        <select
          id="playlist-select"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1"
          style={{
            borderColor: 'var(--border-gray)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--ecic-purple)';
            e.target.style.boxShadow = '0 0 0 1px var(--ecic-purple)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-gray)';
            e.target.style.boxShadow = 'none';
          }}
          value={params.playlist}
          onChange={(event) => setParams({ playlist: event.target.value })}
        >
          {playlistsForKeyPoints.map((playlistId) => (
            <option key={playlistId} value={playlistId}>
              {formatLabel(playlistId, {})}
            </option>
          ))}
        </select>
      </section>

      <OnePagerGallery
        onePagers={onePagers}
        selectedDocs={selectedDocs}
        toggleDoc={toggleDoc}
      />
    </aside>
  );
}
