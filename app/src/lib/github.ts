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

  // Map content-based nodes to content files
  const contentMappings: Record<string, string> = {
    'policy_screening_knowledge': 'content/bds_pack.json',
    'policy_alignment': 'content/bds_pack.json',
    // Map guide/opener/etc based on patterns
  };

  if (contentMappings[nodeId]) {
    return contentMappings[nodeId];
  }

  // For most content nodes, they likely come from bds_pack.json
  if (['policy_statement', 'key_point', 'counter', 'template_snippet', 'guide', 'opener'].includes(nodeId.split('_')[0])) {
    return 'content/bds_pack.json';
  }

  return null;
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