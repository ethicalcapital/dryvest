import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
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

const DATASET_VERSION = DEFAULT_DATASET_VERSION;
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;

const FALLBACK_DEFAULTS: BriefParams = {
  identity: 'individual',
  audience: 'family_friends',
  venue: 'one_on_one',
  level: 'technical',
  motivation: 'regulatory_drivers',
  playlist: DEFAULT_PLAYLIST_ID,
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

type StepStatus = 'done' | 'active' | 'pending';

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
  const [briefMode, setBriefMode] = useState<BriefMode>('quick');
  const [customKeyPoints, setCustomKeyPoints] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState<BriefContext>({});
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('dryvest:analytics-consent') === 'granted';
  });
  const quickStartRef = useRef<HTMLDivElement | null>(null);
  const modeStartRef = useRef<number>(Date.now());
  const lastContextSignatureRef = useRef<string>('');

  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('dryvest:disclaimer-accepted') === 'true';
  });

  const { dataset, error, loading } = useDataset(DATASET_VERSION, {
    enabled: hasAcceptedDisclaimer,
  });

  const defaults = useMemo<BriefParams>(() => {
    if (!dataset?.schema?.taxonomies) {
      return FALLBACK_DEFAULTS;
    }

    const { taxonomies } = dataset.schema;
    const base: BriefParams = { ...FALLBACK_DEFAULTS };

    base.identity = ensureAllowed(base.identity, taxonomies.identity);
    base.audience = ensureAllowed(base.audience, taxonomies.audience);
    base.level = ensureAllowed(base.level, taxonomies.level);
    base.motivation = ensureAllowed(base.motivation, taxonomies.motivation);
    base.playlist = FALLBACK_DEFAULTS.playlist;

    return base;
  }, [dataset]);

  const [params, applyParams] = useBriefParams(defaults);
  const [contextTouched, setContextTouched] = useState(false);

  const setParams = useCallback(
    (next: Partial<BriefParams>, options: { touchContext?: boolean } = {}) => {
      const { touchContext = true } = options;
      if (
        touchContext &&
    (['identity', 'audience', 'motivation'] as (keyof BriefParams)[]).some(key =>
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'dryvest:analytics-consent',
        analyticsConsent ? 'granted' : 'denied'
      );
    }
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

    const maybeCorrect = (key: keyof BriefContext, allowed?: string[]) => {
      const current = params[key];
      const next = ensureAllowed(current, allowed);
      if (next && next !== current) {
        corrections[key] = next;
      }
    };

    maybeCorrect('identity', schema.taxonomies?.identity);
    maybeCorrect('audience', schema.taxonomies?.audience);
    maybeCorrect('level', schema.taxonomies?.level);
    maybeCorrect('motivation', schema.taxonomies?.motivation);

    if (params.playlist && !playlistById[params.playlist]) {
      corrections.playlist = FALLBACK_DEFAULTS.playlist;
    }

    if (Object.keys(corrections).length) {
      applyParams(corrections);
    }
  }, [dataset, params, applyParams]);

  // Context depends on mode - quick uses params, custom uses customContext
  const context = useMemo<BriefContext>(
    () =>
      briefMode === 'quick'
        ? {
            identity: params.identity,
            audience: params.audience,
            venue: params.venue,
            motivation: params.motivation,
            level: 'technical',
          }
        : {
            ...customContext,
            level: 'technical',
          },
    [
      briefMode,
      params.identity,
      params.audience,
      params.venue,
      params.motivation,
      customContext,
    ]
  );

  useEffect(() => {
    if (!hasAcceptedDisclaimer) return;
    setAnalyticsContext(context, dataset?.version);
    const signature = JSON.stringify([
      context.identity ?? '',
      context.audience ?? '',
      context.venue ?? '',
      context.motivation ?? '',
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

  const isQuickMode = briefMode === 'quick';
  const customContextReady = Boolean(
    customContext.identity && customContext.audience
  );
  const exportsReady = selectedOnePagers.length > 0;

  const sessionSteps = useMemo(
    () => {
      const modeMeta = (() => {
        switch (briefMode) {
          case 'custom':
            return {
              title: 'Custom Brief mode',
              description:
                'Curate each key point and supporting evidence to match your campaign.',
              badge: 'Advanced',
            };
          case 'compare':
            return {
              title: 'Compare Institutions',
              description:
                'Review how different institution types respond so you can tailor asks.',
              badge: 'Analysis',
            };
          case 'fact_check':
            return {
              title: 'Fact Check workspace',
              description:
                'Audit every citation and export a parser-friendly reference dossier.',
              badge: 'Quality',
            };
          default:
            return {
              title: 'Quick Brief active',
              description:
                'Default guided flow with scenario-specific institutional language.',
              badge: 'Default flow',
            };
        }
      })();

      const contextMeta = (() => {
        if (isQuickMode) {
          const parts = [
            params.identity
              ? `Identity: ${formatTaxonomyValue(params.identity)}`
              : null,
            params.audience
              ? `Audience: ${formatTaxonomyValue(params.audience)}`
              : null,
            params.motivation
              ? `Motivation: ${formatTaxonomyValue(params.motivation)}`
              : null,
          ].filter(Boolean);
          const description = parts.join(' • ');

          if (contextTouched) {
            return {
              status: 'done' as StepStatus,
              title: 'Context ready',
              description: description || 'Custom context captured.',
              helper:
                'Adjust identity, audience, or motivation to explore alternate governance.',
            };
          }

          return {
            status: 'active' as StepStatus,
            title: 'Select your context',
            description:
              description ? `Defaults → ${description}` : 'Update the selections above to lock context.',
            helper:
              'Choose institution, audience, and driver so the brief reflects the portfolio in front of you.',
          };
        }

        if (customContextReady) {
          const parts = [
            customContext.identity
              ? `Identity: ${formatTaxonomyValue(customContext.identity)}`
              : null,
            customContext.audience
              ? `Audience: ${formatTaxonomyValue(customContext.audience)}`
              : null,
            customContext.motivation
              ? `Motivation: ${formatTaxonomyValue(customContext.motivation)}`
              : null,
          ].filter(Boolean);

          return {
            status: 'done' as StepStatus,
            title: 'Context ready',
            description: parts.join(' • ') || 'Custom context captured.',
            helper: 'Adjust any field to explore alternate governance paths.',
          };
        }

        return {
          status: 'active' as StepStatus,
          title: 'Set your context',
          description:
            'Add identity and audience so outputs reference the right process.',
          helper: 'Dryvest uses these details to lock in tone and procedural steps.',
        };
      })();

      const exportMeta = exportsReady
        ? {
            status: 'done' as StepStatus,
            title: 'Exports queued',
            description: `${selectedOnePagers.length} supporting attachment${
              selectedOnePagers.length === 1 ? '' : 's'
            } ready`,
            helper: 'Download or share directly from the Actions panel when needed.',
          }
        : {
            status: 'pending' as StepStatus,
            title: 'Prep your exports',
            description:
              'Select attachments, downloads, or copies once your brief feels ready.',
            helper: 'Use the attachments step or Actions panel to add one-pagers and generate exports.',
          };

      return [
        {
          id: 'approach',
          step: 'Step 1',
          status: 'done' as StepStatus,
          title: modeMeta.title,
          description: modeMeta.description,
          badge: modeMeta.badge,
        },
        {
          id: 'context',
          step: 'Step 2',
          ...contextMeta,
        },
        {
          id: 'exports',
          step: 'Step 3',
          ...exportMeta,
        },
      ];
    }, [
      briefMode,
      customContext.identity,
      customContext.audience,
      customContext.motivation,
      exportsReady,
      isQuickMode,
      params.identity,
      params.audience,
      params.venue,
      params.motivation,
      contextTouched,
      selectedOnePagers.length,
    ]) as Array<
    {
      id: string;
      step: string;
      status: StepStatus;
      title: string;
      description: string;
      helper?: string;
      badge?: string;
    }
  >;

  const getStatusVisual = (status: StepStatus) => {
    switch (status) {
      case 'done':
        return {
          container: 'border-emerald-200 bg-emerald-50/70',
          iconWrapper: 'bg-emerald-100 text-emerald-600',
          stepClass: 'text-emerald-700',
          icon: <CheckCircle2 className="h-5 w-5" />,
        };
      case 'active':
        return {
          container: 'border-indigo-200 bg-indigo-50/70',
          iconWrapper: 'bg-indigo-100 text-indigo-600',
          stepClass: 'text-indigo-700',
          icon: <Clock3 className="h-5 w-5" />,
        };
      default:
        return {
          container: 'border-slate-200 bg-white',
          iconWrapper: 'bg-slate-100 text-slate-500',
          stepClass: 'text-slate-600',
          icon: <Circle className="h-5 w-5" />,
        };
    }
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
      tone: 'technical',
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

  const handleModeChange = (nextMode: BriefMode) => {
    if (nextMode === briefMode) return;
    const now = Date.now();
    const elapsed = now - modeStartRef.current;
    if (elapsed > 0) {
      trackEvent('time_in_mode', { mode: briefMode, milliseconds: elapsed });
    }
    modeStartRef.current = now;
    trackEvent('mode_selected', { mode: nextMode });
    setBriefMode(nextMode);
  };

  const handleQuickStart = () => {
    handleModeChange('quick');
    window.requestAnimationFrame(() => {
      quickStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dryvest:disclaimer-accepted', 'true');
    }

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

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'dryvest:analytics-consent',
        consent ? 'granted' : 'denied'
      );
      window.localStorage.setItem(
        'dryvest:mailing-opt-in',
        mailingOptIn ? 'true' : 'false'
      );
      window.localStorage.setItem(
        'dryvest:mailing-email',
        mailingOptIn && normalizedEmail ? normalizedEmail : ''
      );
    }

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

  return (
    <div className="min-h-screen flex flex-col bg-brand-light text-slate-900">
      <Header />
      <PalestineStatement />

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
            <div className="mt-6 rounded-xl border border-indigo-100 bg-white/85 p-6 shadow-sm">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl space-y-2">
                    <p className="text-sm uppercase tracking-wide font-heading text-indigo-600">
                      How Dryvest helps
                    </p>
                    <p className="text-sm text-slate-600">
                      Quick Brief opens automatically so you can drop straight into institutional language.
                      Switch modes whenever you need deliberate composition, benchmarking comparisons,
                      or a full documentation audit.
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <button
                      type="button"
                      onClick={handleQuickStart}
                      className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-heading font-semibold text-white shadow-sm transition"
                      style={{ backgroundColor: 'var(--ecic-purple)' }}
                    >
                      {isQuickMode ? 'Jump to outputs' : 'Return to Quick Brief'}
                    </button>
                    <span className="text-xs text-slate-500">
                      Educational intelligence – not investment advice.
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {sessionSteps.map(step => {
                    const visuals = getStatusVisual(step.status);
                    return (
                      <div
                        key={step.id}
                        className={`rounded-lg border p-4 transition ${visuals.container}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${visuals.iconWrapper}`}
                          >
                            {visuals.icon}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                              <span className={visuals.stepClass}>{step.step}</span>
                              {step.badge ? (
                                <span className="rounded-full border border-current/40 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                                  {step.badge}
                                </span>
                              ) : null}
                            </div>
                            <h3 className="text-sm font-heading font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <p className="text-sm text-slate-600">{step.description}</p>
                            {step.helper ? (
                              <p className="text-xs text-slate-500">{step.helper}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <ModeSelector mode={briefMode} onModeChange={handleModeChange} />

          {/* Custom Brief Builder (only in custom mode) */}
          {briefMode === 'custom' && dataset && (
            <CustomBriefBuilder
              dataset={dataset}
              context={customContext}
              onContextChange={handleCustomContextChange}
              selectedKeyPoints={customKeyPoints}
              onKeyPointsChange={setCustomKeyPoints}
            />
          )}

          {/* Comparison View (only in compare mode) */}
          {briefMode === 'compare' && dataset && (
            <ComparisonView dataset={dataset} context={context} />
          )}

          {briefMode === 'fact_check' && dataset && (
            <FactCheckView
              dataset={dataset}
              context={context}
              exportData={exportData}
            />
          )}

          {/* Main content grid */}
          {briefMode !== 'fact_check' && (
            briefMode === 'quick' ? (
              <div ref={quickStartRef} className="space-y-6">
                {dataset && (
                  <QuickBriefContextPanel
                    dataset={dataset}
                    params={params}
                    onParamChange={setParams}
                    motivationOptions={motivationOptions}
                    selectedDocs={selectedDocs}
                    toggleDoc={toggleDoc}
                    onePagers={onePagers}
                  />
                )}

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

                <ActionsPanel
                  params={params}
                  selectedDocs={selectedDocs}
                  exportData={exportData}
                  tone="technical"
                />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px]">
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

                <ActionsPanel
                  params={params}
                  selectedDocs={selectedDocs}
                  exportData={exportData}
                  tone="technical"
                />
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
