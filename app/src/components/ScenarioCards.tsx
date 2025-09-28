import { Users, UserCheck, Building2, Megaphone } from 'lucide-react';
import type { BriefContext } from '../lib/schema';

interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  context: BriefContext;
  onePagers: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'university_divestment',
    title: 'University divestment campaign',
    description: 'Building student movement to pressure university to stop investing in harmful companies',
    icon: Building2,
    context: {
      identity: 'endowment',
      audience: 'fiduciary',
      venue: 'full_board_meeting',
      level: 'technical',
    },
    onePagers: ['sources_fiduciary'],
  },
  {
    id: 'pension_advocacy',
    title: 'Public pension advocacy',
    description: 'Organizing with unions and retirees to pressure pension fund managers',
    icon: UserCheck,
    context: {
      identity: 'public_pension',
      audience: 'fiduciary',
      venue: 'committee_hearing',
      level: 'technical',
    },
    onePagers: ['sources_fiduciary'],
  },
  {
    id: 'personal_screening',
    title: 'Personal portfolio screening',
    description: 'Making sure your own retirement and investment accounts avoid harmful companies',
    icon: Users,
    context: {
      identity: 'individual',
      audience: 'family_friends',
      venue: 'one_on_one',
      level: 'technical',
    },
    onePagers: ['sources_family_friends', 'next_steps_family_friends'],
  },
  {
    id: 'municipal_pressure',
    title: 'Municipal investment pressure',
    description: 'Working with city council to stop city investments in harmful companies',
    icon: Megaphone,
    context: {
      identity: 'government',
      audience: 'regulated',
      venue: 'public_testimony',
      level: 'technical',
    },
    onePagers: ['sources_regulated'],
  },
];

interface ScenarioCardsProps {
  onScenarioSelect: (scenario: Scenario) => void;
}

export function ScenarioCards({ onScenarioSelect }: ScenarioCardsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
          Pick your situation
        </h3>
        <p className="text-sm text-slate-600">
          Choose the scenario that best matches your upcoming conversation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              onClick={() => onScenarioSelect(scenario)}
              className="group rounded-xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--tw-ring-color': 'var(--ecic-purple)' } as any}
            >
              <div className="flex items-start gap-4">
                <div
                  className="rounded-lg p-3 text-white group-hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--ecic-purple)' }}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-slate-900 mb-2">
                    {scenario.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg border border-indigo-100 bg-indigo-50/60">
        <p className="text-sm text-indigo-800">
          <strong>Don't see your situation?</strong> Use Custom Brief mode for
          full control over identity, audience, and venue.
        </p>
      </div>
    </div>
  );
}

export type { Scenario };
