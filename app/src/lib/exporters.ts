import type { BriefContext, Node } from './schema';

export type BriefTone = 'plain' | 'technical';

export interface BriefExportMeta {
  identity?: string;
  audience?: string;
  venue?: string;
  level?: string;
  playlistId: string;
  datasetVersion: string;
}

export interface BriefExportData {
  meta: BriefExportMeta;
  context: BriefContext;
  opener?: Extract<Node, { type: 'opener' }>;
  guide?: Extract<Node, { type: 'guide' }>;
  keyPoints: Array<Extract<Node, { type: 'key_point' }>>;
  counters: Array<Extract<Node, { type: 'counter' }>>;
  nextSteps: Array<Extract<Node, { type: 'next_step' }>>;
  screeningNode?: Extract<Node, { type: 'policy_statement' }>;
  policyAlignment?: Extract<Node, { type: 'policy_statement' }>;
  templates: Array<Extract<Node, { type: 'template_snippet' }>>;
  selectedOnePagers: Array<Extract<Node, { type: 'one_pager' }>>;
  sources: Array<Extract<Node, { type: 'source' }>>;
  sourceLookup: Record<string, Extract<Node, { type: 'source' }>>;
}

const divider = (label: string) => `## ${label}`;

const formatCitations = (
  ids: string[] | undefined,
  lookup: Record<string, Extract<Node, { type: 'source' }>>
): string | undefined => {
  if (!ids?.length) return undefined;
  const parts = ids
    .map((id) => lookup[id])
    .filter((source): source is Extract<Node, { type: 'source' }> => Boolean(source))
    .map((source) => `- [${source.label}](${source.url})`);
  return parts.length ? parts.join('\n') : undefined;
};

const pickScreeningBody = (
  node: Extract<Node, { type: 'policy_statement' }> | undefined,
  tone: BriefTone
): string | undefined => {
  if (!node) return undefined;
  if (node.variants?.length) {
    const variant = node.variants.find((item) => item.transforms?.tone === tone) ?? node.variants[0];
    return variant.body;
  }
  return node.body ?? undefined;
};

export function buildMarkdown(data: BriefExportData, tone: BriefTone): string {
  const { meta, opener, guide, keyPoints, counters, nextSteps, screeningNode, policyAlignment, templates, selectedOnePagers, sources, sourceLookup } = data;
  const lines: string[] = [];

  lines.push('# Dryvestment Brief');
  lines.push(`- Dataset version: ${meta.datasetVersion}`);
  lines.push(`- Identity: ${meta.identity ?? 'n/a'}`);
  lines.push(`- Audience: ${meta.audience ?? 'n/a'}`);
  lines.push(`- Venue: ${meta.venue ?? 'n/a'}`);
  lines.push(`- Tone: ${tone}`);
  lines.push(`- Playlist: ${meta.playlistId}`);

  if (opener) {
    lines.push(divider('Opening Angle'));
    lines.push(opener.text);
  }

  if (guide) {
    lines.push(divider('Recommended Approach'));
    lines.push(`- Lead with: ${guide.sections.ask}`);
    lines.push(`- Implementation: ${guide.sections.implementation}`);
    lines.push(`- Reporting: ${guide.sections.reporting}`);
    lines.push(`- Risk discipline: ${guide.sections.risk}`);
  }

  if (keyPoints.length) {
    lines.push(divider('Key Points'));
    keyPoints.forEach((point, index) => {
      const header = `${index + 1}. **${point.title}**`;
      const body = point.body ? `\n${point.body}` : '';
      const citations = formatCitations(point.citations, sourceLookup);
      lines.push([header, body, citations ? `\n${citations}` : ''].join(''));
    });
  }

  const screeningBody = pickScreeningBody(screeningNode, tone);
  if (screeningBody) {
    lines.push(divider('Screening Intelligence'));
    lines.push(screeningBody);
  }

  if (counters.length) {
    lines.push(divider('Likely Pushback & Responses'));
    counters.forEach((counter, index) => {
      lines.push(`${index + 1}. **Claim:** ${counter.claim}`);
      lines.push(`   **Response:** ${counter.response}`);
      const references = formatCitations(counter.citations, sourceLookup);
      if (references) {
        lines.push('   **Sources:**');
        lines.push(references.split('\n').map((line) => `   ${line}`).join('\n'));
      }
    });
  }

  if (nextSteps.length) {
    lines.push(divider('Next Steps'));
    nextSteps.forEach((step) => {
      lines.push(`- ${step.text}`);
    });
  }

  if (policyAlignment?.bullets?.length) {
    lines.push(divider('Policy Alignment'));
    policyAlignment.bullets.forEach((item) => lines.push(`- ${item}`));
    const references = formatCitations(policyAlignment.citations, sourceLookup);
    if (references) {
      lines.push(references);
    }
  }

  if (templates.length) {
    lines.push(divider('Templates'));
    templates.forEach((snippet) => {
      lines.push(`### ${snippet.title}`);
      if (snippet.markdown) {
        lines.push('```');
        lines.push(snippet.markdown.trim());
        lines.push('```');
      }
      if (snippet.lines?.length) {
        snippet.lines.forEach((line) => lines.push(`- ${line}`));
      }
    });
  }

  if (selectedOnePagers.length) {
    lines.push(divider('Attachments'));
    selectedOnePagers.forEach((doc) => {
      lines.push(`- ${doc.title} (${doc.markdownPath})`);
    });
  }

  if (sources.length) {
    lines.push(divider('Sources'));
    sources.forEach((source) => {
      lines.push(`- [${source.label}](${source.url})`);
    });
  }

  return lines.join('\n\n');
}
