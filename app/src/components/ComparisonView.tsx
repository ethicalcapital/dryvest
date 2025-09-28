import { useEffect, useMemo, useState } from 'react';
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
  Users,
  Megaphone,
} from 'lucide-react';
import type {
  Dataset,
  Node,
  EntityProfile,
  AssertionRecord,
  SourceRecord,
  BriefContext,
} from '../lib/schema';
import { GitHubFeedback } from './GitHubFeedback';
import { ResponseQualityGuide } from './ResponseQualityGuide';
import { InstitutionalFlashcards } from './InstitutionalFlashcards';
import { trackEvent } from '../lib/analytics';
import { matchesTargets } from '../lib/resolve';

interface ComparisonViewProps {
  dataset: Dataset;
  context: BriefContext;
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  individual: UserCircle,
  corporate_pension: Building,
  public_pension: Landmark,
  endowment: Building2,
  foundation: Handshake,
  insurance: ShieldCheck,
  central_bank: Banknote,
  government: Megaphone,
  swf: Globe,
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

const DEFAULT_SELECTION: string[] = ['endowment', 'corporate_pension'];

type ComparisonContentType = (typeof CONTENT_TYPES)[number]['key'];

const getIcon = (entityId: string) => ENTITY_ICONS[entityId] ?? Users;

const formatCitation = (source: SourceRecord) =>
  source.citationText ?? `${source.label}. ${source.url}`;

const AssertionEvidence = ({
  assertion,
  sourceIndex,
}: {
  assertion: AssertionRecord;
  sourceIndex: Record<string, SourceRecord>;
}) => {
  if (!assertion.evidence?.length) return null;
  const sources = assertion.evidence
    .map(id => sourceIndex[id])
    .filter((record): record is SourceRecord => Boolean(record));
  if (!sources.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-500">
      {sources.map(source => (
        <li key={`${assertion.id}-${source.id}`}>{formatCitation(source)}</li>
      ))}
    </ul>
  );
};

export function ComparisonView({ dataset, context }: ComparisonViewProps) {
  const [selectedEntities, setSelectedEntities] = useState<string[]>(
    DEFAULT_SELECTION
  );
  const [selectedContentType, setSelectedContentType] =
    useState<ComparisonContentType>('opener');

  const entityProfiles = useMemo(
    () => dataset.entities.filter(profile => ENTITY_ICONS[profile.id]),
    [dataset.entities]
  );

  const availableEntityIds = useMemo(
    () => entityProfiles.map(profile => profile.id),
    [entityProfiles]
  );

  useEffect(() => {
    if (!selectedEntities.length) return;
    trackEvent('compare_context_viewed', {
      entities: selectedEntities.slice().sort().join(','),
      contentType: selectedContentType,
    });
  }, [selectedEntities, selectedContentType]);

  useEffect(() => {
    if (!availableEntityIds.length) return;
    setSelectedEntities(prev => {
      const filtered = prev.filter(id => availableEntityIds.includes(id));
      const needed = Math.max(0, 2 - filtered.length);
      if (needed <= 0) return filtered.slice(0, 4);
      const additions = availableEntityIds.filter(
        id => !filtered.includes(id)
      );
      return [...filtered, ...additions.slice(0, needed)];
    });
  }, [availableEntityIds.join('|')]);

  const toggleEntity = (entityId: string) => {
    if (!availableEntityIds.includes(entityId)) return;
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, entityId];
    });
  };

  const getContentForEntity = (
    entityId: string,
    contentType: ComparisonContentType
  ): Node[] => {
    const entityContext: BriefContext = {
      ...context,
      identity: entityId,
    };
    return dataset.nodes.filter(node => {
      if (node.type !== contentType) return false;
      const identityTargets = node.targets?.identity;
      if (!identityTargets || !identityTargets.includes(entityId)) {
        return false;
      }
      return matchesTargets(node.targets, entityContext);
    });
  };

  const resolveEntityProfile = (entityId: string): EntityProfile | undefined =>
    dataset.entityIndex[entityId];

  const resolveEntitySources = (profile?: EntityProfile): SourceRecord[] => {
    if (!profile?.sources?.length) return [];
    return profile.sources
      .map(id => dataset.sourceIndex[id])
      .filter((record): record is SourceRecord => Boolean(record));
  };

  const resolveEntityAssertions = (
    profile?: EntityProfile
  ): AssertionRecord[] => {
    if (!profile?.assertions?.length) return [];
    return profile.assertions
      .map(id => dataset.assertionIndex[id])
      .filter((record): record is AssertionRecord => Boolean(record));
  };

  const renderSourceList = (sources: SourceRecord[]) => {
    if (!sources.length) return null;
    return (
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-700">Sources</p>
        <ul className="mt-1 space-y-1 text-xs text-slate-500">
          {sources.map(source => (
            <li key={source.id}>{formatCitation(source)}</li>
          ))}
        </ul>
      </div>
    );
  };

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
          {availableEntityIds.map(entityId => {
            const profile = resolveEntityProfile(entityId);
            if (!profile) return null;
            const isSelected = selectedEntities.includes(entityId);
            const IconComponent = getIcon(entityId);

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
                    {profile.label}
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

      {/* Institutional Context Cards */}
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
              const profile = resolveEntityProfile(entityId);
              if (!profile) return null;
              const IconComponent = getIcon(entityId);
              const entitySources = resolveEntitySources(profile);
              const entityAssertions = resolveEntityAssertions(profile);

              return (
                <div key={entityId} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--ecic-purple)' }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-slate-900">
                        {profile.label}
                      </h4>
                      {profile.shortDescription ? (
                        <p className="text-xs text-slate-500 mt-1">
                          {profile.shortDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        Time horizon
                      </span>
                      <p className="text-slate-600 mt-1">
                        {profile.timeHorizon ?? 'Varies by institution'}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Withdrawal / spending cadence
                      </span>
                      <p className="text-slate-600 mt-1">
                        {profile.typicalWithdrawal ?? 'Mandate dependent'}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-slate-700">
                        Governance
                      </span>
                      <p className="text-slate-600 mt-1">
                        {profile.governanceStyle ?? 'Varies by governing body'}
                      </p>
                    </div>

                    {profile.keyConstraints?.length ? (
                      <div>
                        <span className="font-medium text-slate-700">
                          Key constraints
                        </span>
                        <ul className="text-slate-600 mt-1 space-y-1">
                          {profile.keyConstraints.map((constraint, idx) => (
                            <li key={idx} className="text-xs">
                              • {constraint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {profile.stakeholders?.length ? (
                      <div>
                        <span className="font-medium text-slate-700">
                          Stakeholders
                        </span>
                        <ul className="text-slate-600 mt-1 space-y-1">
                          {profile.stakeholders.map((stakeholder, idx) => (
                            <li key={idx} className="text-xs">
                              • {stakeholder}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {entityAssertions.length ? (
                      <div>
                        <span className="font-medium text-slate-700">
                          Assertions to cite
                        </span>
                        <ul className="mt-1 space-y-2 text-xs text-slate-600">
                          {entityAssertions.map(assertion => (
                            <li key={assertion.id}>
                              <p className="font-semibold text-slate-700">
                                {assertion.title}
                              </p>
                              <p className="text-slate-600 mt-1">
                                {assertion.statement}
                              </p>
                              <AssertionEvidence
                                assertion={assertion}
                                sourceIndex={dataset.sourceIndex}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {renderSourceList(entitySources)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <section id="institutional-literacy" className="space-y-6">
        <InstitutionalFlashcards />
        <ResponseQualityGuide />
      </section>

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
              process. This isn't just different wording—it reflects
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
              const profile = resolveEntityProfile(entityId);
              if (!profile) return null;
              const content = getContentForEntity(entityId, selectedContentType);
              const IconComponent = getIcon(entityId);

              return (
                <div key={entityId} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--ecic-purple)' }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-slate-900">
                        {profile.label}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {content.length}{' '}
                        {content.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {content.length === 0 ? (
                      <div className="text-sm text-slate-500 italic py-4">
                        No specific {selectedContentType} content for{' '}
                        {profile.label.toLowerCase()}
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
                                “
                                {
                                  (item as Extract<Node, { type: 'opener' }>).
                                    text
                                }
                                ”
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
                                    return (
                                      <div className="space-y-2">
                                        <div>
                                          <strong>Ask:</strong> {sections.ask}
                                        </div>
                                        <div>
                                          <strong>Implementation:</strong>{' '}
                                          {sections.implementation}
                                        </div>
                                        <div>
                                          <strong>Reporting:</strong>{' '}
                                          {sections.reporting}
                                        </div>
                                        <div>
                                          <strong>Risk:</strong> {sections.risk}
                                        </div>
                                      </div>
                                    );
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
                                      item as Extract<Node, { type: 'key_point' }>
                                    ).title
                                  }
                                </h5>
                                <div className="text-sm text-slate-700 leading-relaxed">
                                  {
                                    (
                                      item as Extract<Node, { type: 'key_point' }>
                                    ).body
                                  }
                                </div>
                              </div>
                            )}

                            {(item.targets?.audience || item.targets?.venue) && (
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
