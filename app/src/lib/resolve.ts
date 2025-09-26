import type { Dataset, Playlist, Targets, BriefContext, Node } from './schema';

const targetKeys: (keyof BriefContext)[] = [
  'identity',
  'audience',
  'venue',
  'level',
];

export function matchesTargets(
  targets: Targets | undefined,
  context: BriefContext
): boolean {
  if (!targets) return true;
  return targetKeys.every(key => {
    const targetValues = targets[key as keyof typeof targets];
    if (!targetValues) return true;
    const contextValue = context[key];
    if (!contextValue) return false;
    return targetValues.includes(contextValue);
  });
}

export function selectPlaylistByKind(
  playlistsByKind: Record<string, Playlist[]>,
  kind: string,
  context: BriefContext
): Playlist | undefined {
  const candidates = playlistsByKind[kind] ?? [];
  if (!candidates.length) return undefined;

  const exactMatches = candidates.filter(playlist =>
    matchesTargets(playlist.targets, context)
  );
  if (exactMatches.length) {
    return exactMatches[0];
  }

  return candidates[0];
}

export function filterNodesForContext<T extends Node>(
  nodes: T[],
  context: BriefContext
): T[] {
  return nodes.filter(node => matchesTargets(node.targets, context));
}

export function uniqueNodes<T extends Node>(nodes: T[]): T[] {
  const seen = new Set<string>();
  return nodes.filter(node => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

export function resolvePlaylistNodes(
  dataset: Dataset,
  playlist: Playlist,
  context: BriefContext
): Node[] {
  const nodes: Node[] = [];
  for (const item of playlist.items) {
    if (item.conditions && !matchesTargets(item.conditions, context)) {
      continue;
    }
    const node = dataset.nodeIndex[item.ref];
    if (!node) continue;
    if (!matchesTargets(node.targets, context)) continue;
    nodes.push(node);
  }
  return uniqueNodes(nodes);
}

export function resolveByKind(
  dataset: Dataset,
  kind: string,
  context: BriefContext
): { playlist?: Playlist; nodes: Node[] } {
  const playlist = selectPlaylistByKind(dataset.playlistsByKind, kind, context);
  if (!playlist) {
    return { nodes: [] };
  }
  const nodes = resolvePlaylistNodes(dataset, playlist, context);
  return { playlist, nodes };
}

export function resolveOpener(dataset: Dataset, context: BriefContext) {
  const openers = dataset.nodes.filter(
    (node): node is Extract<Node, { type: 'opener' }> => node.type === 'opener'
  );
  let best: (typeof openers)[number] | undefined;
  let bestScore = -1;
  for (const opener of openers) {
    let score = 0;
    if (
      context.identity &&
      opener.targets?.identity?.includes(context.identity)
    ) {
      score += 2;
    }
    if (context.venue && opener.targets?.venue?.includes(context.venue)) {
      score += 1;
    }
    if (score > bestScore) {
      best = opener;
      bestScore = score;
    }
  }
  return best;
}

export function resolveGuide(dataset: Dataset, context: BriefContext) {
  const guides = dataset.nodes.filter(
    (node): node is Extract<Node, { type: 'guide' }> => node.type === 'guide'
  );
  let fallback = guides[0];
  for (const guide of guides) {
    if (
      context.identity &&
      guide.targets?.identity?.includes(context.identity)
    ) {
      return guide;
    }
    if (!guide.targets && !fallback) {
      fallback = guide;
    }
  }
  return fallback;
}
