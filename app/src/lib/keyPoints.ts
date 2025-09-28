import type { BriefContext, Dataset, Node, Playlist } from './schema';
import { matchesTargets, resolvePlaylistNodes } from './resolve';

const filterKeyPointNodes = (
  nodes: Node[]
): Array<Extract<Node, { type: 'key_point' }>> =>
  nodes.filter(
    (node): node is Extract<Node, { type: 'key_point' }> =>
      node.type === 'key_point'
  );

export function getKeyPointsForContext(
  dataset: Dataset,
  context: BriefContext
): Array<Extract<Node, { type: 'key_point' }>> {
  return filterKeyPointNodes(
    dataset.nodes.filter(node => matchesTargets(node.targets, context))
  );
}

export function getKeyPointsFromPlaylist(
  dataset: Dataset,
  playlist: Playlist,
  context: BriefContext
): Array<Extract<Node, { type: 'key_point' }>> {
  const nodes = resolvePlaylistNodes(dataset, playlist, context);
  return filterKeyPointNodes(nodes);
}
