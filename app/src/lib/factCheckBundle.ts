import type { BriefContext, Dataset, Node, Playlist } from './schema';
import { matchesTargets, resolveByKind, resolveGuide, resolveOpener, selectPlaylistByKind } from './resolve';
import type { BriefExportData } from './exporters';
import { getKeyPointsFromPlaylist } from './keyPoints';
import { DEFAULT_PLAYLIST_ID } from './constants';

const SIGNATURE_TEMPLATE_IDS = new Set([
  'tmpl_model_resolution',
  'tmpl_government_policy',
  'note_cio',
]);

type TypedNode<T extends Node['type']> = Extract<Node, { type: T }>;

export const filterNodesByType = <T extends Node['type']>(
  nodes: Node[],
  type: T
): Array<TypedNode<T>> =>
  nodes.filter((node): node is TypedNode<T> => node.type === type);

export const collectAudiencesByIdentity = (dataset: Dataset) => {
  const map = new Map<string, Set<string | undefined>>();
  dataset.nodes.forEach(node => {
    const identities = node.targets?.identity;
    if (!identities?.length) return;
    identities.forEach(identity => {
      if (!map.has(identity)) {
        map.set(identity, new Set());
      }
      const audiences = node.targets?.audience;
      if (audiences?.length) {
        audiences.forEach(value => map.get(identity)?.add(value));
      } else {
        map.get(identity)?.add(undefined);
      }
    });
  });
  return map;
};

export const gatherSourcesForContext = (
  dataset: Dataset,
  context: BriefContext,
  keyPoints: Array<TypedNode<'key_point'>>,
  policyAlignment?: TypedNode<'policy_statement'>,
  screeningNode?: TypedNode<'policy_statement'>
) => {
  const ids = new Set<string>();
  const collect = (citations?: string[]) => {
    citations?.forEach(id => ids.add(id));
  };

  keyPoints.forEach(point => collect(point.citations));
  collect(policyAlignment?.citations);
  collect(screeningNode?.citations);

  const sourcesPlaylist = selectPlaylistByKind(
    dataset.playlistsByKind,
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
    .map(id => dataset.sourceIndex[id])
    .filter(
      (record): record is Dataset['sources'][number] => Boolean(record)
    );

  return records.length ? records : dataset.sources;
};

const selectKeyPointPlaylist = (
  dataset: Dataset,
  context: BriefContext
): Playlist | undefined =>
  selectPlaylistByKind(dataset.playlistsByKind, 'key_points', context);

export const buildExportForContext = (
  dataset: Dataset,
  context: BriefContext
): BriefExportData => {
  const playlist = selectKeyPointPlaylist(dataset, context);
  const keyPoints = playlist
    ? getKeyPointsFromPlaylist(dataset, playlist, context)
    : [];

  const { nodes: nextStepCandidates } = resolveByKind(
    dataset,
    'next_steps',
    context
  );
  const nextSteps = filterNodesByType(nextStepCandidates, 'next_step');

  const screeningNodeBase = dataset.nodeIndex['policy_screening_knowledge'];
  const screeningNode = screeningNodeBase?.type === 'policy_statement'
    ? (screeningNodeBase as TypedNode<'policy_statement'>)
    : undefined;

  const policyAlignmentBase = dataset.nodeIndex['policy_alignment'];
  const policyAlignment = policyAlignmentBase?.type === 'policy_statement'
    ? (policyAlignmentBase as TypedNode<'policy_statement'>)
    : undefined;

  const templateSnippets = dataset.nodes.filter(
    (node): node is TypedNode<'template_snippet'> =>
      node.type === 'template_snippet' &&
      SIGNATURE_TEMPLATE_IDS.has(node.id) &&
      matchesTargets(node.targets, context)
  );

  const sources = gatherSourcesForContext(
    dataset,
    context,
    keyPoints,
    policyAlignment,
    screeningNode
  );

  return {
    meta: {
      identity: context.identity,
      audience: context.audience,
      level: context.level,
      playlistId: playlist?.id ?? DEFAULT_PLAYLIST_ID,
      datasetVersion: dataset.version,
    },
    context,
    opener: resolveOpener(dataset, context) ?? undefined,
    guide: resolveGuide(dataset, context) ?? undefined,
    keyPoints,
    nextSteps,
    screeningNode,
    policyAlignment,
    templates: templateSnippets,
    selectedOnePagers: [],
    sources,
    sourceLookup: dataset.sourceIndex,
    assertions: dataset.assertions,
    assertionLookup: dataset.assertionIndex,
  };
};

export const hasContent = (data: BriefExportData) =>
  Boolean(
    data.opener ||
      data.guide ||
      data.keyPoints.length ||
      data.nextSteps.length ||
      data.templates.length ||
      data.screeningNode ||
      data.policyAlignment
  );

export const contextKey = (value: BriefContext) =>
  [
    value.identity ?? 'n/a',
    value.audience ?? 'n/a',
    value.level ?? 'n/a',
  ].join('|');

export const enumerateContexts = (
  dataset: Dataset,
  baseContext?: BriefContext
): BriefContext[] => {
  const identities = dataset.schema?.taxonomies?.identity ?? [];
  const levels = dataset.schema?.taxonomies?.level ?? ['plain', 'technical'];
  const audiencesByIdentity = collectAudiencesByIdentity(dataset);

  const contexts: BriefContext[] = [];
  const seen = new Set<string>();

  identities.forEach(identity => {
    const audienceSet = audiencesByIdentity.get(identity);
    const audiences = audienceSet && audienceSet.size ? Array.from(audienceSet) : [undefined];

    levels.forEach(level => {
      audiences.forEach(audience => {
        const candidate: BriefContext = { identity, level };
        if (audience) candidate.audience = audience;
        const key = contextKey(candidate);
        if (seen.has(key)) return;
        seen.add(key);
        contexts.push(candidate);
      });
    });
  });

  if (baseContext?.identity) {
    const key = contextKey(baseContext);
    if (!seen.has(key)) {
      contexts.unshift(baseContext);
    }
  }

  return contexts;
};
