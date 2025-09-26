import type { Node } from './schema';

const GITHUB_BASE_URL = 'https://github.com/ethicalcapital/dryvest';
const ISSUES_URL = `${GITHUB_BASE_URL}/issues/new`;

/**
 * Generate GitHub edit link for a node's source content
 */
export function getGitHubEditLink(node: Node): string | null {
  // Try to map node ID to source file
  const sourceFile = mapNodeToSourceFile(node.id);
  if (sourceFile) {
    return `${GITHUB_BASE_URL}/edit/main/${sourceFile}`;
  }
  return null;
}

/**
 * Generate GitHub issue link for feedback on a node
 */
export function getGitHubFeedbackLink(node: Node): string {
  const title = encodeURIComponent(`Feedback on: ${getNodeTitle(node)}`);
  const body = encodeURIComponent(`**Node ID**: \`${node.id}\`
**Type**: ${node.type}

**Feedback**:
<!-- Please describe your suggestion here -->

---
*This feedback was submitted from the Dryvest knowledge platform.*`);

  return `${ISSUES_URL}?title=${title}&body=${body}&labels=content-feedback`;
}

/**
 * Map node ID to likely source file location
 */
function mapNodeToSourceFile(nodeId: string): string | null {
  // Handle source nodes that reference external URLs - no edit link
  if (nodeId.startsWith('src_')) {
    return null;
  }

  // Map one-pager nodes to their markdown files
  if (nodeId.startsWith('one_pager_')) {
    const fileName = nodeId.replace('one_pager_', '') + '.md';
    return `content/${fileName}`;
  }

  // Map encyclopedia entries to encyclopedia content
  if (nodeId.startsWith('encyclopedia_')) {
    return 'content/encyclopedia.json';
  }

  // Map specific content nodes more precisely
  const contentMappings: Record<string, string> = {
    'policy_screening_knowledge': 'content/policy_statements.json',
    'policy_alignment': 'content/policy_statements.json',
    // Map guides and openers
    ...Object.fromEntries(
      ['guide', 'opener'].flatMap(type =>
        ['individual', 'swf', 'public_pension', 'corporate_pension', 'endowment', 'foundation', 'insurance', 'central_bank', 'government'].map(identity =>
          [`${type}_${identity}`, `content/${type}s.json`]
        )
      )
    )
  };

  if (contentMappings[nodeId]) {
    return contentMappings[nodeId];
  }

  // Map by content type patterns
  if (nodeId.startsWith('kp_')) {
    return 'content/key_points.json';
  }
  if (nodeId.startsWith('counter_')) {
    return 'content/counters.json';
  }
  if (nodeId.startsWith('next_step_')) {
    return 'content/next_steps.json';
  }
  if (nodeId.startsWith('tmpl_')) {
    return 'content/templates.json';
  }

  // Fallback - only for truly unknown patterns
  return 'content/index.json';
}

/**
 * Get a human-readable title for a node
 */
function getNodeTitle(node: Node): string {
  switch (node.type) {
    case 'key_point':
    case 'policy_statement':
    case 'template_snippet':
      return node.title;
    case 'guide':
      return `${node.id} guide`;
    case 'opener':
      return `${node.id} opener`;
    case 'counter':
      return node.claim;
    case 'source':
      return node.label;
    case 'one_pager':
      return node.title;
    case 'next_step':
      return `Next step: ${node.text.slice(0, 50)}...`;
    default:
      return (node as any).id || 'Unknown';
  }
}