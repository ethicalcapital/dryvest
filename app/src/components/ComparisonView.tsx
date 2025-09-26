import { useState } from 'react';
import {
  Building2,
  Building,
  Landmark,
  UserCircle,
  Handshake,
  ShieldCheck,
  Banknote,
  Globe,
  BarChart3,
} from 'lucide-react';
import type { Dataset, Node } from '../lib/schema';
import { GitHubFeedback } from './GitHubFeedback';
import { ResponseQualityGuide } from './ResponseQualityGuide';
import { InstitutionalFlashcards } from './InstitutionalFlashcards';

interface ComparisonViewProps {
  dataset: Dataset;
}

const IDENTITY_LABELS: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    context: {
      timeHorizon: string;
      withdrawalRate: string;
      keyConstraints: string[];
      governanceStyle: string;
      stakeholders: string[];
    };
  }
> = {
  individual: {
    label: 'Individual',
    icon: UserCircle,
    context: {
      timeHorizon: 'Variable (retirement planning)',
      withdrawalRate: '4-6% in retirement phase',
      keyConstraints: [
        'Tax optimization',
        'Liquidity for life events',
        'Risk capacity',
      ],
      governanceStyle: 'Personal values-based decision-making',
      stakeholders: ['Self', 'Family', 'Heirs', 'Charitable beneficiaries'],
    },
  },
  corporate_pension: {
    label: 'Corporate Pension',
    icon: Building,
    context: {
      timeHorizon: 'Long-term (20-30 years)',
      withdrawalRate: 'Actuarially determined based on obligations',
      keyConstraints: [
        'ERISA fiduciary prudence',
        'Funding requirements',
        'Participant protection',
      ],
      governanceStyle: 'Professional trustees serving participant interests',
      stakeholders: [
        'Plan participants',
        'Beneficiaries',
        'Corporate sponsor',
        'Union representatives',
      ],
    },
  },
  public_pension: {
    label: 'Public Pension',
    icon: Landmark,
    context: {
      timeHorizon: 'Very long-term (30+ years)',
      withdrawalRate: '3-5% target with demographic adjustments',
      keyConstraints: [
        'Fiduciary duty to participants',
        'Public transparency',
        'Political accountability',
      ],
      governanceStyle: 'Elected/appointed boards serving public employees',
      stakeholders: [
        'Public employees',
        'Retirees',
        'Taxpayers',
        'Legislative bodies',
        'Citizens',
      ],
    },
  },
  endowment: {
    label: 'Endowment',
    icon: Building2,
    context: {
      timeHorizon: 'Perpetual',
      withdrawalRate: '4-5% annual spending rate',
      keyConstraints: [
        'Mission alignment',
        'Donor intent preservation',
        'Intergenerational equity',
      ],
      governanceStyle: 'Trustee governance balancing mission and prudence',
      stakeholders: [
        'Students',
        'Faculty',
        'Alumni',
        'Donors',
        'Academic community',
        'Society',
      ],
    },
  },
  foundation: {
    label: 'Foundation',
    icon: Handshake,
    context: {
      timeHorizon: 'Perpetual (private) or Limited (operating)',
      withdrawalRate: '5% minimum distribution (private), Variable (operating)',
      keyConstraints: [
        'Mission alignment requirements',
        'IRS compliance',
        'Charitable purpose',
      ],
      governanceStyle: 'Board governance dedicated to philanthropic mission',
      stakeholders: [
        'Beneficiary communities',
        'Grantees',
        'Donors/founders',
        'Social causes',
        'Public good',
      ],
    },
  },
  insurance: {
    label: 'Insurance',
    icon: ShieldCheck,
    context: {
      timeHorizon: 'Medium-term (5-15 years)',
      withdrawalRate: 'Matched to policy obligations and claims',
      keyConstraints: [
        'Solvency requirements',
        'Liability matching',
        'Regulatory capital',
      ],
      governanceStyle:
        'Corporate governance with policyholder protection focus',
      stakeholders: [
        'Policyholders',
        'Beneficiaries',
        'Regulators',
        'Shareholders',
        'Communities',
      ],
    },
  },
  central_bank: {
    label: 'Central Bank',
    icon: Banknote,
    context: {
      timeHorizon: 'Variable (policy dependent)',
      withdrawalRate: 'Policy-driven, counter-cyclical',
      keyConstraints: [
        'Monetary policy mandates',
        'Independence requirements',
        'Economic stability',
      ],
      governanceStyle: 'Independent institution serving public monetary policy',
      stakeholders: [
        'Citizens',
        'Government',
        'Financial system',
        'International community',
        'Economy',
      ],
    },
  },
  government: {
    label: 'Sovereign Wealth Fund',
    icon: Globe,
    context: {
      timeHorizon: 'Very long-term (intergenerational)',
      withdrawalRate:
        'Variable by mandate (stabilization, savings, development)',
      keyConstraints: [
        'Sovereign mandate',
        'Political oversight',
        'Resource stewardship',
      ],
      governanceStyle: 'Government oversight with professional management',
      stakeholders: [
        'Current citizens',
        'Future generations',
        'National development',
        'Economic stability',
      ],
    },
  },
};

const CONTENT_TYPES = [
  {
    key: 'opener',
    label: 'Opening Angles',
    description: 'How to start the conversation',
  },
  {
    key: 'guide',
    label: 'Guidance',
    description: 'Strategic guidance for different contexts',
  },
  {
    key: 'key_point',
    label: 'Key Points',
    description: 'Main arguments and talking points',
  },
];

export function ComparisonView({ dataset }: ComparisonViewProps) {
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    'endowment',
    'corporate_pension',
  ]);
  const [selectedContentType, setSelectedContentType] = useState('opener');

  const toggleEntity = (entityId: string) => {
    setSelectedEntities(
      prev =>
        prev.includes(entityId)
          ? prev.filter(id => id !== entityId)
          : prev.length < 4
            ? [...prev, entityId]
            : prev // Limit to 4 for readability
    );
  };

  const getContentForEntity = (
    entityId: string,
    contentType: string
  ): Node[] => {
    return dataset.nodes.filter(node => {
      if (node.type !== contentType) return false;
      if (!node.targets?.identity) return false;
      return node.targets.identity.includes(entityId);
    });
  };

  const availableEntities = Object.keys(IDENTITY_LABELS).filter(entityId =>
    dataset.nodes.some(node => node.targets?.identity?.includes(entityId))
  );

  return (
    <div className="space-y-6">
      {/* Entity Selection */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-3">
          Select Entities to Compare
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Choose 2-4 entity types to see how content is tailored differently.
          Each entity has unique messaging approaches and strategic
          considerations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableEntities.map(entityId => {
            const entity = IDENTITY_LABELS[entityId];
            const isSelected = selectedEntities.includes(entityId);
            const IconComponent = entity.icon;

            return (
              <button
                key={entityId}
                onClick={() => toggleEntity(entityId)}
                disabled={!isSelected && selectedEntities.length >= 4}
                className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                  isSelected
                    ? 'text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50'
                }`}
                style={{
                  borderColor: isSelected
                    ? 'var(--ecic-purple)'
                    : 'var(--border-gray)',
                  backgroundColor: isSelected
                    ? 'rgba(88, 28, 135, 0.05)'
                    : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded ${
                      isSelected ? 'text-white' : 'text-slate-500'
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--ecic-purple)'
                        : undefined,
                    }}
                  >
                    <IconComponent size={16} />
                  </div>
                  <span className="font-heading font-medium">
                    {entity.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedEntities.length >= 4 && (
          <p className="text-xs text-slate-500 mt-2">
            Maximum of 4 entities for optimal comparison view
          </p>
        )}
      </div>

      {/* Content Type Selection */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-3">
          Content Type
        </h3>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => setSelectedContentType(type.key)}
              className={`px-4 py-2 rounded-lg border text-sm font-heading font-medium transition-all ${
                selectedContentType === type.key
                  ? 'text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              style={{
                borderColor:
                  selectedContentType === type.key
                    ? 'var(--ecic-purple)'
                    : 'var(--border-gray)',
                backgroundColor:
                  selectedContentType === type.key
                    ? 'var(--ecic-purple)'
                    : undefined,
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {CONTENT_TYPES.find(t => t.key === selectedContentType)?.description}
        </p>
      </div>

      {/* Institutional Context Cards - only show when entities are selected */}
      {selectedEntities.length >= 2 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-3">
            Understanding These Institutions
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Each entity type has unique characteristics that shape their
            investment approach. Understanding these differences helps explain
            why messaging varies.
          </p>

          <div
            className={`grid gap-4 ${
              selectedEntities.length === 2
                ? 'md:grid-cols-2'
                : selectedEntities.length === 3
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {selectedEntities.map(entityId => {
              const entity = IDENTITY_LABELS[entityId];
              const IconComponent = entity.icon;

              return (
                <div
                  key={entityId}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--ecic-purple)' }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <h4 className="font-heading font-semibold text-slate-900">
                      {entity.label}
                    </h4>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        Time Horizon:
                      </span>
                      <p className="text-slate-600">
                        {entity.context.timeHorizon}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Withdrawal Rate:
                      </span>
                      <p className="text-slate-600">
                        {entity.context.withdrawalRate}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Governance:
                      </span>
                      <p className="text-slate-600">
                        {entity.context.governanceStyle}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Key Constraints:
                      </span>
                      <ul className="text-slate-600 mt-1 space-y-1">
                        {entity.context.keyConstraints.map(
                          (constraint, idx) => (
                            <li key={idx} className="text-xs">
                              • {constraint}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Stakeholders:
                      </span>
                      <ul className="text-slate-600 mt-1 space-y-1">
                        {entity.context.stakeholders.map((stakeholder, idx) => (
                          <li key={idx} className="text-xs">
                            • {stakeholder}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Institutional Learning Flashcards */}
      <InstitutionalFlashcards />

      {/* Response Quality Assessment Guide */}
      <ResponseQualityGuide />

      {/* Comparison Grid */}
      {selectedEntities.length >= 2 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-heading font-semibold text-slate-900">
              {CONTENT_TYPES.find(t => t.key === selectedContentType)?.label}{' '}
              Comparison
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Notice how the same core message gets tailored to each
              institution's unique context, constraints, and decision-making
              process. This isn't just different wording - it reflects
              fundamentally different institutional realities.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 ${
              selectedEntities.length === 2
                ? 'md:grid-cols-2'
                : selectedEntities.length === 3
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-2 lg:grid-cols-4'
            } divide-y md:divide-y-0 md:divide-x divide-gray-200`}
          >
            {selectedEntities.map(entityId => {
              const entity = IDENTITY_LABELS[entityId];
              const content = getContentForEntity(
                entityId,
                selectedContentType
              );
              const IconComponent = entity.icon;

              return (
                <div key={entityId} className="p-6">
                  {/* Entity Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--ecic-purple)' }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-slate-900">
                        {entity.label}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {content.length}{' '}
                        {content.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Content Items */}
                  <div className="space-y-4">
                    {content.length === 0 ? (
                      <div className="text-sm text-slate-500 italic py-4">
                        No specific {selectedContentType} content for{' '}
                        {entity.label.toLowerCase()}
                      </div>
                    ) : (
                      content.map(item => (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="space-y-2">
                            {item.type === 'opener' && (
                              <div className="text-sm text-slate-700 leading-relaxed">
                                "
                                {
                                  (item as Extract<Node, { type: 'opener' }>)
                                    .text
                                }
                                "
                              </div>
                            )}

                            {item.type === 'guide' && (
                              <div className="text-sm text-slate-700 leading-relaxed">
                                {(() => {
                                  const guide = item as Extract<
                                    Node,
                                    { type: 'guide' }
                                  >;
                                  const sections = guide.sections;
                                  if (sections) {
                                    return `${sections.ask} ${sections.implementation} ${sections.reporting} ${sections.risk}`;
                                  }
                                  return 'No guidance content available';
                                })()}
                              </div>
                            )}

                            {item.type === 'key_point' && (
                              <div>
                                <h5 className="font-heading font-semibold text-slate-900 text-sm mb-1">
                                  {
                                    (
                                      item as Extract<
                                        Node,
                                        { type: 'key_point' }
                                      >
                                    ).title
                                  }
                                </h5>
                                <div className="text-sm text-slate-700 leading-relaxed">
                                  {
                                    (
                                      item as Extract<
                                        Node,
                                        { type: 'key_point' }
                                      >
                                    ).body
                                  }
                                </div>
                              </div>
                            )}

                            {/* Additional targeting context */}
                            {(item.targets?.audience ||
                              item.targets?.venue) && (
                              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                                {item.targets.audience && (
                                  <span>
                                    Audience:{' '}
                                    {item.targets.audience.join(', ')}{' '}
                                  </span>
                                )}
                                {item.targets.venue && (
                                  <span>
                                    Venue: {item.targets.venue.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}

                            <GitHubFeedback node={item} size="sm" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedEntities.length < 2 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-12 shadow-sm text-center">
          <div className="text-slate-400 mb-3">
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
            Select Entities to Compare
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Choose at least 2 entity types above to see how content and
            messaging approaches differ across different institutional contexts.
          </p>
        </div>
      )}
    </div>
  );
}
