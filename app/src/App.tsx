import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PalestineStatement } from './components/PalestineStatement';
import { useSelectionParam } from './hooks/useSelectionParam';
import type { BriefExportData } from './lib/exporters';
import {
  initAnalytics,
  trackEvent,
  setAnalyticsConsent as setAnalyticsTrackingConsent,
  setAnalyticsContext,
} from './lib/analytics';
import {
  DEFAULT_PLAYLIST_ID,
  DEFAULT_DATASET_VERSION,
} from './lib/constants';
import { DisclaimerGate } from './components/DisclaimerGate';
import {
  matchesTargets,
  resolveByKind,
  resolveGuide,
  resolveOpener,
  resolvePlaylistNodes,
  selectPlaylistByKind,
} from './lib/resolve';
import { formatTaxonomyValue } from './lib/format';
import { QuickBriefContextPanel } from './components/QuickBriefContextPanel';
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
} from './lib/storage';

const DATASET_VERSION = DEFAULT_DATASET_VERSION;
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;

const FALLBACK_DEFAULTS: BriefParams = {
  identity: undefined,
  audience: undefined,
  venue: undefined,
  level: 'technical',
  motivation: undefined,
  motivationSecondary: undefined,
  playlist: undefined,
};

const MOTIVATION_COPY: Record<string, { label: string; helper: string }> = {
  regulatory_drivers: {
    label: 'Regulatory Drivers',
    helper: 'Compliance-first framing: legal risk, fiduciary duty, reporting controls.',
  },
  internal_leadership: {
    label: 'Internal Leadership',
    helper: 'Mission-first case building: donors, board values, program alignment.',
  },
  external_stakeholders: {
    label: 'External Stakeholders',
    helper: 'Campaign pressure & coalition momentum: community wins and reinvestment.',
  },
};

function ensureAllowed(value: string | undefined, allowed?: string[]) {
  if (!value) return undefined;
  if (!allowed || !allowed.length) return value;
  return allowed.includes(value) ? value : undefined;
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

const SUPPORTED_TEMPLATE_IDS = [
  'tmpl_model_resolution',
  'tmpl_government_policy',
  'note_cio',
  'tmpl_corporate_board_briefing',
  'tmpl_corporate_consultant_scope',
  'tmpl_corporate_fiduciary_override',
  'tmpl_spectrum_board_ladder',
  'tmpl_spectrum_stakeholder_update',
  'tmpl_insurance_alm_briefing',
  'tmpl_insurance_capital_committee',
  'tmpl_insurance_rating_agency',
  'tmpl_foundation_board_resolution',
  'tmpl_foundation_investment_committee_update',
  'tmpl_public_board_resolution',
  'tmpl_public_meeting_brief',
];

function App() {
  // New state for dual-mode interface
  const [briefMode, setBriefMode] = useState<BriefMode | null>(null);
  const [customKeyPoints, setCustomKeyPoints] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState<BriefContext>({});
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(() =>
    safeLocalStorageGet('dryvest:analytics-consent') === 'granted'
  );
  const quickStartRef = useRef<HTMLDivElement | null>(null);
  const modeStartRef = useRef<number>(Date.now());
  const lastContextSignatureRef = useRef<string>('');

  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(
    () => safeLocalStorageGet('dryvest:disclaimer-accepted') === 'true'
  );

  const { dataset, error, loading } = useDataset(DATASET_VERSION, {
    enabled: hasAcceptedDisclaimer,
  });

  const defaults = useMemo<BriefParams>(() => {
    if (!dataset?.schema?.taxonomies) {
      return FALLBACK_DEFAULTS;
    }

    const { taxonomies } = dataset.schema;
    return {
      ...FALLBACK_DEFAULTS,
      level: ensureAllowed(FALLBACK_DEFAULTS.level, taxonomies.level),
    };
  }, [dataset]);

  const [params, applyParams] = useBriefParams(defaults);
  const [contextTouched, setContextTouched] = useState(false);

  const setParams = useCallback(
    (next: Partial<BriefParams>, options: { touchContext?: boolean } = {}) => {
      const { touchContext = true } = options;
      if (
        touchContext &&
    (
      ['identity', 'audience', 'motivation', 'motivationSecondary'] as (keyof BriefParams)[]
    ).some(key =>
      Object.prototype.hasOwnProperty.call(next, key)
    )
  ) {
        setContextTouched(true);
      }
      applyParams(next);
    },
    [applyParams]
  );
  const hasTrackedOpen = useRef(false);
 
  useEffect(() => {
    if (!hasAcceptedDisclaimer) return;
    setAnalyticsTrackingConsent(analyticsConsent);
    safeLocalStorageSet(
      'dryvest:analytics-consent',
      analyticsConsent ? 'granted' : 'denied'
    );
  }, [analyticsConsent, hasAcceptedDisclaimer]);

  useEffect(() => {
    if (!hasAcceptedDisclaimer) return;
    if (!analyticsConsent || !analyticsToken) return;
    initAnalytics({ token: analyticsToken, spa: true });
  }, [analyticsConsent, analyticsToken, hasAcceptedDisclaimer]);

  useEffect(() => {
    if (!hasAcceptedDisclaimer || !dataset || hasTrackedOpen.current) return;
    trackEvent('app_opened', {
      version: dataset.version,
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      motivation: params.motivation,
      level: params.level,
    });
    hasTrackedOpen.current = true;
  }, [
    hasAcceptedDisclaimer,
    dataset,
    params.identity,
    params.audience,
    params.level,
    params.venue,
    params.motivation,
  ]);

  useEffect(() => {
    if (!hasAcceptedDisclaimer || !dataset) return;
    trackEvent('params_changed', {
      version: dataset.version,
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      motivation: params.motivation,
      motivation_secondary: params.motivationSecondary,
      level: params.level,
      playlist: params.playlist,
    });
  }, [
    hasAcceptedDisclaimer,
    dataset,
    params.identity,
    params.audience,
    params.level,
    params.motivation,
    params.venue,
    params.playlist,
  ]);

  useEffect(() => {
    if (!dataset) return;
    const corrections: Partial<BriefParams> = {};
    const { schema, playlistById } = dataset;

    const maybeUnsetIfInvalid = (key: keyof BriefContext, allowed?: string[]) => {
      const current = params[key];
      if (!current) return;
      if (!allowed || allowed.includes(current)) return;
      corrections[key] = undefined;
    };

    maybeUnsetIfInvalid('identity', schema.taxonomies?.identity);
    maybeUnsetIfInvalid('audience', schema.taxonomies?.audience);
    maybeUnsetIfInvalid('level', schema.taxonomies?.level);
    maybeUnsetIfInvalid('motivation', schema.taxonomies?.motivation);
    if (params.motivationSecondary && schema.taxonomies?.motivation) {
      if (!schema.taxonomies.motivation.includes(params.motivationSecondary)) {
        corrections.motivationSecondary = undefined;
      }
    }
    if (
      params.motivationSecondary &&
      params.motivationSecondary === params.motivation
    ) {
      corrections.motivationSecondary = undefined;
    }

    if (params.playlist && !playlistById[params.playlist]) {
      corrections.playlist = undefined;
    }

    if (Object.keys(corrections).length) {
      applyParams(corrections);
    }
  }, [dataset, params, applyParams]);

  // Context depends on mode - quick uses params, custom uses customContext
  const context = useMemo<BriefContext>(() => {
    if (briefMode === 'custom') {
      return {
        ...customContext,
        level: 'technical',
      };
    }

    return {
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      motivation: params.motivation,
      motivationSecondary: params.motivationSecondary,
      level: 'technical',
    };
  }, [
    briefMode,
    customContext,
    params.identity,
    params.audience,
    params.venue,
    params.motivation,
    params.motivationSecondary,
  ]);

  useEffect(() => {
    if (!hasAcceptedDisclaimer) return;
    setAnalyticsContext(context, dataset?.version);
    const signature = JSON.stringify([
      context.identity ?? '',
      context.audience ?? '',
      context.venue ?? '',
      context.motivation ?? '',
      context.motivationSecondary ?? '',
      context.level ?? '',
    ]);
    if (signature && signature !== lastContextSignatureRef.current) {
      lastContextSignatureRef.current = signature;
      trackEvent('context_finalized', {
        identity: context.identity,
        audience: context.audience,
        venue: context.venue,
      });
    }
  }, [
    hasAcceptedDisclaimer,
    context.identity,
    context.audience,
    context.venue,
    context.level,
    context.motivation,
    context.motivationSecondary,
    dataset?.version,
  ]);

  const onePagers = useMemo(
    () =>
      dataset?.nodes.filter(
        (node): node is Extract<Node, { type: 'one_pager' }> =>
          node.type === 'one_pager'
      ) ?? [],
    [dataset]
  );

  const onePagerIds = useMemo(() => onePagers.map(doc => doc.id), [onePagers]);

  const [selectedDocs, toggleDoc] = useSelectionParam('docs', {
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

  const identityOptions = dataset?.schema?.taxonomies?.identity ?? [];
  const audienceOptions = dataset?.schema?.taxonomies?.audience ?? [];

  const availableMotivations = useMemo(() => {
    const values = dataset?.schema?.taxonomies?.motivation;
    if (values && values.length) return values;
    return Object.keys(MOTIVATION_COPY);
  }, [dataset]);

  const motivationOptions = useMemo(
    () =>
      availableMotivations.map(value => ({
        value,
        label: MOTIVATION_COPY[value]?.label ?? formatTaxonomyValue(value),
        helper:
          MOTIVATION_COPY[value]?.helper ??
          'Tailor the narrative to match your campaign driver.',
      })),
    [availableMotivations]
  );

  const datasetVersion = dataset?.version;
  const identityCount = identityOptions.length;
  const audienceCount = audienceOptions.length;
  const motivationCount = availableMotivations.length;

  const contextHasSelectableOptions = useMemo(
    () => identityCount > 1 || audienceCount > 1 || motivationCount > 1,
    [identityCount, audienceCount, motivationCount]
  );

  useEffect(() => {
    if (!datasetVersion) return;
    setContextTouched(!contextHasSelectableOptions);
  }, [datasetVersion, contextHasSelectableOptions]);

  const customContextReady = Boolean(
    customContext.identity && customContext.audience && customContext.motivation
  );
  const quickPrimarySelections = Boolean(
    params.identity && params.audience && params.motivation
  );
  const quickContextReady = contextTouched && quickPrimarySelections;

  const quickChecklist = [
    'Choose the organization you’re targeting.',
    'Select who needs to approve or implement the change.',
    'Rank the primary campaign driver (add a secondary if it helps).',
  ];

  const customChecklist = [
    'Set the organization and audience in the builder controls above.',
    'Choose the campaign drivers that explain why the institution will move.',
    'Select the key points you want before exporting attachments or PDFs.',
  ];

  const modeSelectionSteps = [
    'Quick Brief: translate demands into policy-ready language in minutes.',
    'Custom Builder: handcraft strategy decks with bespoke components.',
    'Compare Institutions: benchmark governance patterns across investor types.',
    'Fact Check: audit citations and generate diligence-ready packets.',
  ];

  const renderContextGate = (
    title: string,
    description: string,
    steps: string[]
  ) => (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 shadow-sm">
      <h3 className="text-sm font-heading font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {steps.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const renderPreviewAndActions = (
    layout: 'stack' | 'grid' = 'grid',
    data: BriefExportData
  ) => {
    const preview = (
      <PreviewPane
        guide={guide}
        keyPoints={keyPointNodes}
        nextSteps={nextStepNodes}
        sources={sourceNodes}
        policyAlignment={policyAlignment}
        venueSnippet={venueSnippet}
        templates={templateSnippets}
        selectedOnePagers={selectedOnePagers}
        sourceLookup={sourceLookup}
      />
    );

    const actions = (
      <ActionsPanel
        params={params}
        selectedDocs={selectedDocs}
        exportData={data}
        tone="technical"
      />
    );

    if (layout === 'stack') {
      return (
        <>
          {preview}
          {actions}
        </>
      );
    }

    return (
      <div className="grid gap-6 lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px]">
        {preview}
        {actions}
      </div>
    );
  };

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

  const screeningCandidate =
    dataset?.nodeIndex['policy_screening_knowledge']?.type ===
    'policy_statement'
      ? (dataset.nodeIndex['policy_screening_knowledge'] as Extract<
          Node,
          { type: 'policy_statement' }
        >)
      : undefined;
  const screeningNode =
    screeningCandidate && matchesTargets(screeningCandidate.targets, context)
      ? screeningCandidate
      : undefined;

  const policyAlignmentCandidate =
    dataset?.nodeIndex['policy_alignment']?.type === 'policy_statement'
      ? (dataset.nodeIndex['policy_alignment'] as Extract<
          Node,
          { type: 'policy_statement' }
        >)
      : undefined;
  const policyAlignment =
    policyAlignmentCandidate &&
    matchesTargets(policyAlignmentCandidate.targets, context)
      ? policyAlignmentCandidate
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
          if (!SUPPORTED_TEMPLATE_IDS.includes(node.id))
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
        motivation: params.motivation,
        motivationSecondary: params.motivationSecondary,
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
      params.motivation,
      params.motivationSecondary,
      dataset?.version,
      keyPointPlaylist?.id,
    ]
  );

  const renderWorkspaceContent = () => {
    if (!dataset) return null;

    if (!briefMode) {
      return renderContextGate(
        'Select a workspace to begin',
        'Dryvest adapts to the job you need to tackle. Pick a mode above to unlock the right dataset view for this session.',
        modeSelectionSteps
      );
    }

    if (briefMode === 'quick') {
      return (
        <div ref={quickStartRef} className="space-y-6">
          <QuickBriefContextPanel
            dataset={dataset}
            params={params}
            onParamChange={setParams}
            motivationOptions={motivationOptions}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            onePagers={onePagers}
          />
          {quickContextReady
            ? renderPreviewAndActions('stack', exportData)
            : renderContextGate(
                'Configure your briefing to unlock recommendations',
                'Dial in the investor, decision audience, and campaign drivers above. Once the context is set, Dryvest will surface tailored strategy language and exports.',
                quickChecklist
              )}
        </div>
      );
    }

    if (briefMode === 'custom') {
      return (
        <div className="space-y-6">
          <CustomBriefBuilder
            dataset={dataset}
            context={customContext}
            onContextChange={handleCustomContextChange}
            selectedKeyPoints={customKeyPoints}
            onKeyPointsChange={setCustomKeyPoints}
          />
          {customContextReady
            ? renderPreviewAndActions('grid', exportData)
            : renderContextGate(
                'Set your context to curate a custom brief',
                'Fill in the organization, audience, and drivers in the builder controls above before selecting key points.',
                customChecklist
              )}
        </div>
      );
    }

    if (briefMode === 'compare') {
      return (
        <div className="space-y-6">
          <QuickBriefContextPanel
            dataset={dataset}
            params={params}
            onParamChange={setParams}
            motivationOptions={motivationOptions}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            onePagers={onePagers}
          />
          {quickContextReady ? (
            <>
              <ComparisonView dataset={dataset} context={context} />
              {renderPreviewAndActions('grid', exportData)}
            </>
          ) : (
            renderContextGate(
              'Lock your context to compare institutions',
              'Adjust the selections above so we know which investor journey to benchmark. Dryvest will then surface patterns and exports tailored to that identity.',
              quickChecklist
            )
          )}
        </div>
      );
    }

    if (briefMode === 'fact_check') {
      return (
        <div className="space-y-6">
          <QuickBriefContextPanel
            dataset={dataset}
            params={params}
            onParamChange={setParams}
            motivationOptions={motivationOptions}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            onePagers={onePagers}
          />
          {quickContextReady
            ? (
                <FactCheckView
                  dataset={dataset}
                  context={context}
                  exportData={exportData}
                />
              )
            : renderContextGate(
                'Lock your context before running fact check',
                'Set the investor, audience, and drivers so Dryvest can pull the correct citations and assertions for verification.',
                quickChecklist
              )}
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (!dataset) return;
    if (briefMode === 'quick' && !quickContextReady) return;
    trackEvent('brief_built', {
      version: dataset.version,
      key_points: keyPointNodes.length,
      next_steps: nextStepNodes.length,
      attachments: selectedOnePagers.length,
      sources: sourceNodes.length,
      tone: 'technical',
    });
  }, [
    dataset,
    keyPointNodes.length,
    nextStepNodes.length,
    selectedOnePagers.length,
    sourceNodes.length,
    briefMode,
    quickContextReady,
  ]);

  const handleModeChange = (nextMode: BriefMode) => {
    if (nextMode === briefMode) return;
    const now = Date.now();
    if (briefMode) {
      const elapsed = now - modeStartRef.current;
      if (elapsed > 0) {
        trackEvent('time_in_mode', { mode: briefMode, milliseconds: elapsed });
      }
    }
    modeStartRef.current = now;
    trackEvent('mode_selected', { mode: nextMode });
    setBriefMode(nextMode);
    if (nextMode !== 'custom') {
      setCustomKeyPoints([]);
      setCustomContext({});
    }
  };

  const handleCustomContextChange = (next: BriefContext) => {
    setCustomContext(next);
    trackEvent('params_changed', {
      identity: next.identity,
      audience: next.audience,
      venue: next.venue,
      source: 'custom_builder',
    });
  };

  const handleDisclaimerAccept = async ({
    analyticsConsent: consent,
    mailingOptIn,
    email,
  }: {
    analyticsConsent: boolean;
    mailingOptIn: boolean;
    email?: string;
  }) => {
    setHasAcceptedDisclaimer(true);
    safeLocalStorageSet('dryvest:disclaimer-accepted', 'true');

    setAnalyticsConsent(consent);

    const normalizedEmail = email?.trim();

    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticsConsent: consent,
          mailingOptIn,
          email: mailingOptIn ? normalizedEmail : undefined,
          meta: {
            datasetVersion: DATASET_VERSION,
            pathname:
              typeof window !== 'undefined'
                ? window.location.pathname
                : undefined,
            source: 'disclaimer_gate',
          },
        }),
      });
    } catch (error) {
      console.error('Failed to persist initial preferences', error);
    }

    trackEvent('analytics_consent_changed', { consent });
    if (mailingOptIn) {
      trackEvent('mailing_opt_in', { optedIn: true });
    }

    safeLocalStorageSet(
      'dryvest:analytics-consent',
      consent ? 'granted' : 'denied'
    );
    safeLocalStorageSet('dryvest:mailing-opt-in', mailingOptIn ? 'true' : 'false');
    safeLocalStorageSet(
      'dryvest:mailing-email',
      mailingOptIn && normalizedEmail ? normalizedEmail : ''
    );

    if (mailingOptIn && normalizedEmail) {
      const subject = encodeURIComponent('Dryvest mailing list opt-in');
      const body = encodeURIComponent(
        `Please add ${normalizedEmail} to the Dryvest updates mailing list.`
      );
      const link = `mailto:hello@ethicic.com?subject=${subject}&body=${body}`;
      if (typeof window !== 'undefined') {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (!hasAcceptedDisclaimer) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-light text-slate-900">
        <DisclaimerGate
          onAccept={handleDisclaimerAccept}
          defaultAnalyticsConsent={analyticsConsent}
        />
      </div>
    );
  }

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
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-lg font-medium">Preparing Dryvest dataset…</p>
      </div>
    );
  }

  const workspaceContent = renderWorkspaceContent();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />
      <PalestineStatement />

      <main className="flex-1 bg-slate-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-stretch lg:gap-10">
          <div className="max-w-sm space-y-6">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-heading uppercase tracking-[0.25em] text-white/70">
                v.0.0.2
              </p>
              <h1 className="text-3xl font-heading font-bold text-white">
                Make divestment so boring it happens
              </h1>
              <p className="text-sm text-white/70">
                Dryvest is your divestment briefing slide. Pick the room and we line up the talking points.
              </p>
            </div>
            <p className="text-sm text-white/65">
              To us, the decision to divest from companies involved in human rights abuses is cut-and-dry.
            </p>
            <p className="text-xs text-white/45">
              Outputs stay educational only. The dataset never guesses, and every claim stays cited.
            </p>
            <a
              href="mailto:hello@ethicic.com?subject=Dryvest%20clarification"
              className="inline-flex text-xs uppercase tracking-[0.28em] text-white/50 hover:text-white"
            >
              Ask for clarification
            </a>
          </div>

          <section className="flex flex-1 flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <ModeSelector mode={briefMode} onModeChange={handleModeChange} />
            </div>
            <div className="flex-1 p-6 sm:p-8">
              {workspaceContent ?? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Pick a workspace to build the briefing slide.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
