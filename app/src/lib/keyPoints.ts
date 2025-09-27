import type { BriefContext, Dataset, Node } from './schema';
import { matchesTargets } from './resolve';

export function getKeyPointsForContext(
  dataset: Dataset,
  context: BriefContext
): Array<Extract<Node, { type: 'key_point' }>> {
  return dataset.nodes.filter(
    (node): node is Extract<Node, { type: 'key_point' }> =>
      node.type === 'key_point' && matchesTargets(node.targets, context)
  );
}
