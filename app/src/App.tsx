import { useEffect, useMemo, useRef } from 'react';
import './App.css';
import { useDataset } from './hooks/useDataset';
import { useBriefParams } from './hooks/useBriefParams';
import type { BriefParams } from './hooks/useBriefParams';
import type { BriefContext, Node } from './lib/schema';
import { FiltersPanel } from './components/FiltersPanel';
import { PreviewPane } from './components/PreviewPane';
import { ActionsPanel } from './components/ActionsPanel';
import { useSelectionParam } from './hooks/useSelectionParam';
import type { BriefExportData } from './lib/exporters';
import { initAnalytics, trackEvent } from './lib/analytics';
import {
  matchesTargets,
  resolveByKind,
  resolveGuide,
  resolveOpener,
  resolvePlaylistNodes,
  selectPlaylistByKind,
  uniqueNodes,
} from './lib/resolve';

const DATASET_VERSION = '2025-09-25';
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
  nodes.filter((node): node is Extract<Node, { type: 'key_point' }> => node.type === 'key_point');

const toCounterNodes = (nodes: Node[]) =>
  nodes.filter((node): node is Extract<Node, { type: 'counter' }> => node.type === 'counter');

const toNextStepNodes = (nodes: Node[]) =>
  nodes.filter((node): node is Extract<Node, { type: 'next_step' }> => node.type === 'next_step');

const toSourceNodes = (nodes: Node[]) =>
  nodes.filter((node): node is Extract<Node, { type: 'source' }> => node.type === 'source');

function App() {
  const { dataset, error, loading } = useDataset(DATASET_VERSION);

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
  }, [dataset, params.identity, params.audience, params.level, params.venue, params.playlist]);

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

  const context = useMemo<BriefContext>(
    () => ({
      identity: params.identity,
      audience: params.audience,
      venue: params.venue,
      level: params.level,
    }),
    [params.identity, params.audience, params.venue, params.level]
  );

  const onePagers = useMemo(
    () =>
      dataset?.nodes.filter((node): node is Extract<Node, { type: 'one_pager' }> => node.type === 'one_pager') ?? [],
    [dataset]
  );

  const onePagerIds = useMemo(() => onePagers.map((doc) => doc.id), [onePagers]);

  const [selectedDocs, toggleDoc] = useSelectionParam('docs', {
    allowed: onePagerIds,
    defaults: [],
  });

  const selectedOnePagers = useMemo(
    () =>
      selectedDocs
        .map((id) => dataset?.nodeIndex[id])
        .filter((node): node is Extract<Node, { type: 'one_pager' }> => !!node && node.type === 'one_pager'),
    [dataset, selectedDocs]
  );

  const playlistOptions = useMemo((): string[] => {
    const source = dataset?.playlistsByKind['key_points'];
    if (!source || source.length === 0) {
      return [DEFAULT_PLAYLIST_ID];
    }
    const ids: string[] = [];
    for (const playlist of source) {
      if (playlist.id) {
        ids.push(playlist.id);
      }
    }
    return ids.length ? ids : [DEFAULT_PLAYLIST_ID];
  }, [dataset]);

  const keyPointPlaylist = useMemo(() => {
    if (!dataset) return undefined;
    if (params.playlist && dataset.playlistById[params.playlist]) {
      return dataset.playlistById[params.playlist];
    }
    return selectPlaylistByKind(dataset.playlistsByKind, 'key_points', context);
  }, [dataset, params.playlist, context]);

  const keyPointNodes = useMemo(() => {
    if (!dataset || !keyPointPlaylist) return [];
    return toKeyPointNodes(resolvePlaylistNodes(dataset, keyPointPlaylist, context));
  }, [dataset, keyPointPlaylist, context]);

  const counterNodes = useMemo(() => {
    if (!dataset) return [];
    const { nodes } = resolveByKind(dataset, 'counters', context);
    return toCounterNodes(nodes);
  }, [dataset, context]);

  const nextStepNodes = useMemo(() => {
    if (!dataset) return [];
    const { nodes } = resolveByKind(dataset, 'next_steps', context);
    return toNextStepNodes(nodes);
  }, [dataset, context]);

  const sourceNodes = useMemo(() => {
    if (!dataset) return [];
    const { nodes } = resolveByKind(dataset, 'sources', context);
    return uniqueNodes(toSourceNodes(nodes));
  }, [dataset, context]);

  const allSourceNodes = useMemo(
    () => dataset?.nodes.filter((node): node is Extract<Node, { type: 'source' }> => node.type === 'source') ?? [],
    [dataset]
  );

  const sourceLookup = useMemo(
    () => Object.fromEntries(allSourceNodes.map((node) => [node.id, node])),
    [allSourceNodes]
  );

  const opener = useMemo(() => (dataset ? resolveOpener(dataset, context) : undefined), [dataset, context]);
  const guide = useMemo(() => (dataset ? resolveGuide(dataset, context) : undefined), [dataset, context]);

  const templateSnippets = useMemo(
    () =>
      dataset?.nodes.filter((node): node is Extract<Node, { type: 'template_snippet' }> => {
        if (node.type !== 'template_snippet') return false;
        if (!['tmpl_model_resolution', 'tmpl_government_policy', 'note_cio'].includes(node.id)) return false;
        return matchesTargets(node.targets, context);
      }) ?? [],
    [dataset, context]
  );

  const venueSnippet = dataset?.nodes.find(
    (node): node is Extract<Node, { type: 'template_snippet' }> =>
      node.type === 'template_snippet' &&
      !!context.venue &&
      !!node.targets?.venue?.includes(context.venue) &&
      Boolean(node.lines?.length)
  );

  const screeningNode = dataset?.nodeIndex['policy_screening_knowledge']?.type === 'policy_statement'
    ? (dataset.nodeIndex['policy_screening_knowledge'] as Extract<Node, { type: 'policy_statement' }>)
    : undefined;

  const policyAlignment = dataset?.nodeIndex['policy_alignment']?.type === 'policy_statement'
    ? (dataset.nodeIndex['policy_alignment'] as Extract<Node, { type: 'policy_statement' }>)
    : undefined;

  const exportData = useMemo<BriefExportData>(() => ({
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
    counters: counterNodes,
    nextSteps: nextStepNodes,
    screeningNode,
    policyAlignment,
    templates: templateSnippets,
    selectedOnePagers,
    sources: sourceNodes,
    sourceLookup,
  }), [
    context,
    opener,
    guide,
    keyPointNodes,
    counterNodes,
    nextStepNodes,
    screeningNode,
    policyAlignment,
    templateSnippets,
    selectedOnePagers,
    sourceNodes,
    sourceLookup,
    params.identity,
    params.audience,
    params.venue,
    params.level,
    dataset?.version,
    keyPointPlaylist?.id,
  ]);

  useEffect(() => {
    if (!dataset) return;
    trackEvent('brief_built', {
      version: dataset.version,
      key_points: keyPointNodes.length,
      counters: counterNodes.length,
      next_steps: nextStepNodes.length,
      attachments: selectedOnePagers.length,
      sources: sourceNodes.length,
    });
  }, [dataset, keyPointNodes.length, counterNodes.length, nextStepNodes.length, selectedOnePagers.length, sourceNodes.length]);

  if (loading && !dataset) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-lg font-medium">Loading Dryvestment data…</p>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-slate-500">Dryvestment</p>
          <h1 className="text-3xl font-semibold text-slate-900">Schema-driven brief builder</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Dataset version <span className="font-mono text-xs">{dataset.version}</span>. Adjust the filters to update the URL
            and regenerate the brief.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr,260px] xl:grid-cols-[320px,1fr,280px]">
          <FiltersPanel
            dataset={dataset}
            params={params}
            setParams={setParams}
            playlistsForKeyPoints={playlistOptions}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            onePagers={onePagers}
          />

          <PreviewPane
            context={context}
            opener={opener}
            guide={guide}
            keyPoints={keyPointNodes}
            counters={counterNodes}
            nextSteps={nextStepNodes}
            sources={sourceNodes}
            screeningNode={screeningNode}
            policyAlignment={policyAlignment}
            venueSnippet={venueSnippet}
            templates={templateSnippets}
            selectedOnePagers={selectedOnePagers}
            sourceLookup={sourceLookup}
          />

          <ActionsPanel params={params} selectedDocs={selectedDocs} exportData={exportData} />
        </div>
      </div>
    </div>
  );
}

export default App;
