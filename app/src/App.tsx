import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { useDataset } from './hooks/useDataset';
import { useBriefParams } from './hooks/useBriefParams';
import type { BriefParams } from './hooks/useBriefParams';
import type { BriefContext, Node } from './lib/schema';
// import { FiltersPanel } from './components/FiltersPanel';
import { PreviewPane } from './components/PreviewPane';
import { ActionsPanel } from './components/ActionsPanel';
import { ModeSelector, type BriefMode } from './components/ModeSelector';
import { CustomBriefBuilder } from './components/CustomBriefBuilder';
import { ComparisonView } from './components/ComparisonView';
import { FactCheckView } from './components/FactCheckView';
import { ToneToggle, type BriefTone } from './components/ToneToggle';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BetaDisclaimer } from './components/BetaDisclaimer';
import { PalestineStatement } from './components/PalestineStatement';
import { ScenarioCards, type Scenario } from './components/ScenarioCards';
import { TemperatureControls } from './components/TemperatureControls';
import { useSelectionParam } from './hooks/useSelectionParam';
import type { BriefExportData } from './lib/exporters';
import { initAnalytics, trackEvent } from './lib/analytics';
import { DisclaimerGate } from './components/DisclaimerGate';
import {
  matchesTargets,
  resolveByKind,
  resolveGuide,
  resolveOpener,
  resolvePlaylistNodes,
  selectPlaylistByKind,
} from './lib/resolve';

const DATASET_VERSION = '2025-09-27';
const DEFAULT_PLAYLIST_ID = 'brief_key_points_default';
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;

const FALLBACK_DEFAULTS: BriefParams = {
  identity: 'individual',
  audience: 'family_friends',
  venue: 'one_on_one',
  level: 'plain',
  playlist: DEFAULT_PLAYLIST_ID,
};

function ensureAllowed(value: string | undefined, allowed?: string[]) {
  if (!allowed || !allowed.length) return value;
  if (value && allowed.includes(value)) return value;
  return allowed[0];
}

const toKeyPointNodes = (nodes: Node[]) =>
  nodes.filter(
    (node): node is Extract<Node, { type: 'key_point' }> =>
      node.type === 'key_point'
  );


const toNextStepNodes = (nodes: Node[]) =>
  nodes.filter(
    (node): node is Extract<Node, { type: 'next_step' }> =>
      node.type === 'next_step'
  );

function App() {
  const { dataset, error, loading } = useDataset(DATASET_VERSION);

  // New state for dual-mode interface
  const [briefMode, setBriefMode] = useState<BriefMode>('quick');
  const [briefTone, setBriefTone] = useState<BriefTone>('plain');
  const [customKeyPoints, setCustomKeyPoints] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState<BriefContext>({});
  const quickStartRef = useRef<HTMLDivElement | null>(null);

  // Scenario-based quick brief state
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [directness, setDirectness] = useState<'diplomatic' | 'direct'>('diplomatic');

  const defaults = useMemo<BriefParams>(() => {
    if (!dataset?.schema?.taxonomies) {
      return FALLBACK_DEFAULTS;
    }

    const { taxonomies } = dataset.schema;
    const base: BriefParams = { ...FALLBACK_DEFAULTS };

    base.identity = ensureAllowed(base.identity, taxonomies.identity);
    base.audience = ensureAllowed(base.audience, taxonomies.audience);
    base.venue = ensureAllowed(base.venue, taxonomies.venue);
    base.level = ensureAllowed(base.level, taxonomies.level);
    base.playlist = FALLBACK_DEFAULTS.playlist;

    return base;
  }, [dataset]);

  const [params, setParams] = useBriefParams(defaults);
  const hasTrackedOpen = useRef(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('dryvest:disclaimer-accepted') === 'true';
  });

  useEffect(() => {
    initAnalytics({ token: analyticsToken, spa: true });
  }, []);

  useEffect(() => {
    if (!dataset || hasTrackedOpen.current) return;
    trackEvent('app_opened', {
      version: dataset.version,
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      level: params.level,
    });
    hasTrackedOpen.current = true;
  }, [dataset, params.identity, params.audience, params.level, params.venue]);

  useEffect(() => {
    if (!dataset) return;
    trackEvent('params_changed', {
      version: dataset.version,
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      level: params.level,
      playlist: params.playlist,
    });
  }, [
    dataset,
    params.identity,
    params.audience,
    params.level,
    params.venue,
    params.playlist,
  ]);

  useEffect(() => {
    if (!dataset) return;
    const corrections: Partial<BriefParams> = {};
    const { schema, playlistById } = dataset;

    const maybeCorrect = (key: keyof BriefContext, allowed?: string[]) => {
      const current = params[key];
      const next = ensureAllowed(current, allowed);
      if (next && next !== current) {
        corrections[key] = next;
      }
    };

    maybeCorrect('identity', schema.taxonomies?.identity);
    maybeCorrect('audience', schema.taxonomies?.audience);
    maybeCorrect('venue', schema.taxonomies?.venue);
    maybeCorrect('level', schema.taxonomies?.level);

    if (params.playlist && !playlistById[params.playlist]) {
      corrections.playlist = FALLBACK_DEFAULTS.playlist;
    }

    if (Object.keys(corrections).length) {
      setParams(corrections);
    }
  }, [dataset, params, setParams]);

  // Context depends on mode - quick uses params, custom uses customContext
  const context = useMemo<BriefContext>(
    () =>
      briefMode === 'quick'
        ? {
            identity: params.identity,
            audience: params.audience,
            venue: params.venue,
            level: briefTone, // Use briefTone instead of params.level
          }
        : {
            ...customContext,
            level: briefTone, // Always use briefTone for level
          },
    [
      briefMode,
      params.identity,
      params.audience,
      params.venue,
      briefTone,
      customContext,
    ]
  );

  const onePagers = useMemo(
    () =>
      dataset?.nodes.filter(
        (node): node is Extract<Node, { type: 'one_pager' }> =>
          node.type === 'one_pager'
      ) ?? [],
    [dataset]
  );

  const onePagerIds = useMemo(() => onePagers.map(doc => doc.id), [onePagers]);

  const [selectedDocs, , setSelectedDocs] = useSelectionParam('docs', {
    allowed: onePagerIds,
    defaults: [],
  });

  const selectedOnePagers = useMemo(
    () =>
      selectedDocs
        .map(id => dataset?.nodeIndex[id])
        .filter(
          (node): node is Extract<Node, { type: 'one_pager' }> =>
            !!node && node.type === 'one_pager'
        ),
    [dataset, selectedDocs]
  );


  const keyPointPlaylist = useMemo(() => {
    if (!dataset) return undefined;
    if (params.playlist && dataset.playlistById[params.playlist]) {
      return dataset.playlistById[params.playlist];
    }
    return selectPlaylistByKind(dataset.playlistsByKind, 'key_points', context);
  }, [dataset, params.playlist, context]);

  const keyPointNodes = useMemo(() => {
    if (!dataset) return [];

    if (briefMode === 'custom') {
      // In custom mode, use selected key points
      return customKeyPoints
        .map(id => dataset.nodeIndex[id])
        .filter(
          (node): node is Extract<Node, { type: 'key_point' }> =>
            node && node.type === 'key_point'
        );
    } else {
      // In quick mode, use playlist-based selection
      if (!keyPointPlaylist) return [];
      return toKeyPointNodes(
        resolvePlaylistNodes(dataset, keyPointPlaylist, context)
      );
    }
  }, [dataset, briefMode, customKeyPoints, keyPointPlaylist, context]);


  const nextStepNodes = useMemo(() => {
    if (!dataset) return [];
    const { nodes } = resolveByKind(dataset, 'next_steps', context);
    return toNextStepNodes(nodes);
  }, [dataset, context]);

  const sourceLookup = dataset?.sourceIndex ?? {};

  const screeningNode =
    dataset?.nodeIndex['policy_screening_knowledge']?.type ===
    'policy_statement'
      ? (dataset.nodeIndex['policy_screening_knowledge'] as Extract<
          Node,
          { type: 'policy_statement' }
        >)
      : undefined;

  const policyAlignment =
    dataset?.nodeIndex['policy_alignment']?.type === 'policy_statement'
      ? (dataset.nodeIndex['policy_alignment'] as Extract<
          Node,
          { type: 'policy_statement' }
        >)
      : undefined;

  const sourceNodes = useMemo(() => {
    const datasetRef = dataset;
    if (!datasetRef) return [];

    const ids = new Set<string>();

    const collectCitations = (citations?: string[]) => {
      citations?.forEach(id => ids.add(id));
    };

    keyPointNodes.forEach(point => collectCitations(point.citations));
    collectCitations(policyAlignment?.citations);
    collectCitations(screeningNode?.citations);

    const sourcesPlaylist = selectPlaylistByKind(
      datasetRef.playlistsByKind,
      'sources',
      context
    );

    if (sourcesPlaylist) {
      sourcesPlaylist.items.forEach(item => {
        if (item.conditions && !matchesTargets(item.conditions, context)) {
          return;
        }
        ids.add(item.ref);
      });
    }

    const records = Array.from(ids)
      .map(id => datasetRef.sourceIndex[id])
      .filter(
        (record): record is (typeof datasetRef.sources)[number] => Boolean(record)
      );

    return records.length ? records : datasetRef.sources;
  }, [dataset, keyPointNodes, policyAlignment, screeningNode, context]);

  const opener = useMemo(
    () => (dataset ? resolveOpener(dataset, context) : undefined),
    [dataset, context]
  );
  const guide = useMemo(
    () => (dataset ? resolveGuide(dataset, context) : undefined),
    [dataset, context]
  );

  const templateSnippets = useMemo(
    () =>
      dataset?.nodes.filter(
        (node): node is Extract<Node, { type: 'template_snippet' }> => {
          if (node.type !== 'template_snippet') return false;
          if (
            ![
              'tmpl_model_resolution',
              'tmpl_government_policy',
              'note_cio',
            ].includes(node.id)
          )
            return false;
          return matchesTargets(node.targets, context);
        }
      ) ?? [],
    [dataset, context]
  );

  const venueSnippet = dataset?.nodes.find(
    (node): node is Extract<Node, { type: 'template_snippet' }> =>
      node.type === 'template_snippet' &&
      !!context.venue &&
      !!node.targets?.venue?.includes(context.venue) &&
      Boolean(node.lines?.length)
  );

  const activeVenueSnippet = venueSnippet;

  const exportData = useMemo<BriefExportData>(
    () => ({
      meta: {
        identity: params.identity,
        audience: params.audience,
        venue: params.venue,
        level: params.level,
        playlistId: keyPointPlaylist?.id ?? DEFAULT_PLAYLIST_ID,
        datasetVersion: dataset?.version ?? DATASET_VERSION,
      },
      context,
      opener,
      guide,
      keyPoints: keyPointNodes,
      nextSteps: nextStepNodes,
      screeningNode,
      policyAlignment,
      templates: templateSnippets,
      venueSnippet: activeVenueSnippet,
      selectedOnePagers,
      sources: sourceNodes,
      sourceLookup,
      assertions: dataset?.assertions ?? [],
      assertionLookup: dataset?.assertionIndex ?? {},
    }),
    [
      context,
      opener,
      guide,
      keyPointNodes,
      nextStepNodes,
      screeningNode,
      policyAlignment,
      templateSnippets,
      activeVenueSnippet,
      selectedOnePagers,
      sourceNodes,
      sourceLookup,
      params.identity,
      params.audience,
      params.venue,
      params.level,
      dataset?.version,
      keyPointPlaylist?.id,
    ]
  );

  useEffect(() => {
    if (!dataset) return;
    trackEvent('brief_built', {
      version: dataset.version,
      key_points: keyPointNodes.length,
      next_steps: nextStepNodes.length,
      attachments: selectedOnePagers.length,
      sources: sourceNodes.length,
    });
  }, [
    dataset,
    keyPointNodes.length,
    nextStepNodes.length,
    selectedOnePagers.length,
    sourceNodes.length,
  ]);

  if (loading && !dataset) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-lg font-medium">Loading institutional intelligence…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 text-red-900 flex items-center justify-center p-6">
        <div className="max-w-xl space-y-3">
          <h1 className="text-2xl font-semibold">Data failed to load</h1>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return null;
  }

  const handleQuickStart = () => {
    setBriefMode('quick');
    window.requestAnimationFrame(() => {
      quickStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    // Set the context from the scenario
    setParams(scenario.context);
    // Auto-select the scenario's one-pagers
    setSelectedDocs(scenario.onePagers);
    // Set appropriate tone
    setBriefTone(scenario.context.level as BriefTone);
  };

  const handleDisclaimerAccept = () => {
    setHasAcceptedDisclaimer(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dryvest:disclaimer-accepted', 'true');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-light text-slate-900">
      {!hasAcceptedDisclaimer ? (
        <DisclaimerGate onAccept={handleDisclaimerAccept} />
      ) : null}
      <Header />
      <PalestineStatement />
      <BetaDisclaimer />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
          <div className="mb-8">
            <p
              className="text-xs uppercase tracking-wide font-heading font-medium"
              style={{ color: 'var(--ecic-purple)' }}
            >
              v.0.0.1
            </p>
            <h1 className="text-5xl font-heading font-bold text-slate-900 mb-2">
              Dryvest: Make divestment so boring it happens
            </h1>
            <div className="mt-3 max-w-4xl space-y-2">
              <p className="text-slate-600 text-lg">
                Dryvest turns moral demands into technical language that can be implemented as investment policy.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  Dataset version{' '}
                  <span className="font-mono">{dataset.version}</span>
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  •
                </span>
                <a
                  href="https://github.com/ethicalcapital/dryvest/issues/new?labels=question"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: 'var(--ecic-teal)' }}
                >
                  Ask for clarification
                </a>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-indigo-100 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-2">
                  <p className="text-sm uppercase tracking-wide font-heading text-indigo-600">
                    How Dryvest helps
                  </p>
                  <p className="text-sm text-slate-600">
                    Choose the briefing flow that fits your meeting. Quick Brief assembles an institutional script in under a minute, Custom Brief lets you curate the strategy, and Compare shows how different institutions respond.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <button
                    type="button"
                    onClick={handleQuickStart}
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-heading font-semibold text-white shadow-sm transition"
                    style={{ backgroundColor: 'var(--ecic-purple)' }}
                  >
                    Start with Quick Brief
                  </button>
                  <span className="text-xs text-slate-500">
                    Educational intelligence – not investment advice.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <ModeSelector mode={briefMode} onModeChange={setBriefMode} />

          {/* Custom Brief Builder (only in custom mode) */}
          {briefMode === 'custom' && dataset && (
            <CustomBriefBuilder
              dataset={dataset}
              context={customContext}
              onContextChange={setCustomContext}
              selectedKeyPoints={customKeyPoints}
              onKeyPointsChange={setCustomKeyPoints}
            />
          )}

          {/* Comparison View (only in compare mode) */}
          {briefMode === 'compare' && dataset && (
            <ComparisonView dataset={dataset} />
          )}

          {/* Tone Toggle - only show for quick and custom modes */}
          {briefMode !== 'compare' && (
            <ToneToggle
              tone={briefTone}
              onToneChange={setBriefTone}
            />
          )}

          {briefMode === 'fact_check' && (
            <FactCheckView exportData={exportData} />
          )}

          {/* Scenario selection - full width */}
          {briefMode === 'quick' && !selectedScenario && (
              <div className="max-w-4xl mx-auto">
                <ScenarioCards onScenarioSelect={handleScenarioSelect} />
              </div>
            )}

            {/* Main content grid - only show when scenario is selected or not in quick mode */}
            {briefMode !== 'fact_check' &&
              (briefMode !== 'quick' || selectedScenario) && (
              <div
                ref={briefMode === 'quick' ? quickStartRef : undefined}
                className={`grid gap-6 ${
                  briefMode === 'quick'
                    ? 'lg:grid-cols-[280px,1fr,260px] xl:grid-cols-[320px,1fr,280px]'
                    : 'lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px]'
                }`}
              >
                {/* Quick Brief Flow - Temperature controls and scenario info */}
                {briefMode === 'quick' && selectedScenario && (
                  <div className="space-y-6">
                    <TemperatureControls
                      complexity={briefTone}
                      directness={directness}
                      onComplexityChange={setBriefTone}
                      onDirectnessChange={setDirectness}
                    />

                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-heading font-semibold text-slate-900">
                            {selectedScenario.title}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {selectedScenario.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedScenario(null)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                      >
                        ← Choose different scenario
                      </button>
                    </div>
                  </div>
                )}

              {/* Only show preview when scenario is selected in quick mode, or always in other modes */}
              {(briefMode !== 'quick' || selectedScenario) && (
                <PreviewPane
                  context={context}
                  opener={opener}
                  guide={guide}
                  keyPoints={keyPointNodes}
                  nextSteps={nextStepNodes}
                  sources={sourceNodes}
                  screeningNode={screeningNode}
                  policyAlignment={policyAlignment}
                  venueSnippet={venueSnippet}
                  templates={templateSnippets}
                  selectedOnePagers={selectedOnePagers}
                  sourceLookup={sourceLookup}
                />
              )}

              {/* Only show actions when scenario is selected in quick mode, or always in other modes */}
              {(briefMode !== 'quick' || selectedScenario) && (
                <ActionsPanel
                  params={params}
                  selectedDocs={selectedDocs}
                  exportData={exportData}
                  tone={briefTone}
                />
              )}
            </div>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
