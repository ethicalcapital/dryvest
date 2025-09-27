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
  nextSteps: Array<Extract<Node, { type: 'next_step' }>>;
  screeningNode?: Extract<Node, { type: 'policy_statement' }>;
  policyAlignment?: Extract<Node, { type: 'policy_statement' }>;
  templates: Array<Extract<Node, { type: 'template_snippet' }>>;
  selectedOnePagers: Array<Extract<Node, { type: 'one_pager' }>>;
  sources: Array<Extract<Node, { type: 'source' }>>;
  sourceLookup: Record<string, Extract<Node, { type: 'source' }>>;
}

// Tufte-style layout helpers for PDF export
const tufteHeader = (label: string) => `\n## ${label}\n`;
const tufteMarginNote = (note: string) => `^[${note}]`;
const tufteSection = (content: string) => `${content}\n`;

const divider = (label: string) => `## ${label}`;

const gatherCitations = (
  ids: string[] | undefined,
  lookup: Record<string, Extract<Node, { type: 'source' }>>
) =>
  (ids ?? [])
    .map(id => lookup[id])
    .filter((source): source is Extract<Node, { type: 'source' }> =>
      Boolean(source)
    );

const formatCitationText = (source: Extract<Node, { type: 'source' }>) =>
  source.citationText ?? `${source.label}. ${source.url}`;

const formatCitationList = (
  sources: Array<Extract<Node, { type: 'source' }>>
) =>
  sources.length ? sources.map(source => `- ${formatCitationText(source)}`).join('\n') : undefined;

const pickScreeningBody = (
  node: Extract<Node, { type: 'policy_statement' }> | undefined,
  tone: BriefTone
): string | undefined => {
  if (!node) return undefined;
  if (node.variants?.length) {
    const variant =
      node.variants.find(item => item.transforms?.tone === tone) ??
      node.variants[0];
    return variant.body;
  }
  return node.body ?? undefined;
};

export function buildMarkdown(data: BriefExportData, tone: BriefTone): string {
  const {
    meta,
    opener,
    guide,
    keyPoints,
    nextSteps,
    screeningNode,
    policyAlignment,
    templates,
    selectedOnePagers,
    sources,
    sourceLookup,
  } = data;
  const lines: string[] = [];

  // Tufte-style title page
  lines.push('# Investment Brief');
  lines.push('');
  lines.push(`**Prepared for:** ${meta.audience ?? 'Investment Decision-Makers'}`);
  lines.push(`**Context:** ${meta.identity ?? 'Institutional Investor'} • ${meta.venue ?? 'Strategic Review'}`);
  lines.push(`**Analysis:** ${tone === 'technical' ? 'Technical Assessment' : 'Executive Summary'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

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
    lines.push(tufteHeader('Key Assessment Points'));
    keyPoints.forEach((point, index) => {
      const citationSources = gatherCitations(point.citations, sourceLookup);
      const marginSummary = citationSources
        .map(formatCitationText)
        .join('; ');
      const marginNote = marginSummary ? tufteMarginNote(marginSummary) : '';

      lines.push(`### ${index + 1}. ${point.title}${marginNote}`);
      if (point.body) {
        lines.push(tufteSection(point.body));
      }
    });
  }

  const screeningBody = pickScreeningBody(screeningNode, tone);
  if (screeningBody) {
    lines.push(divider('Screening Intelligence'));
    lines.push(screeningBody);
  }

  // Note: Pushback section excluded from PDF export for strategic reasons

  if (nextSteps.length) {
    lines.push(divider('Next Steps'));
    nextSteps.forEach(step => {
      lines.push(`- ${step.text}`);
    });
  }

  if (policyAlignment?.bullets?.length) {
    lines.push(divider('Policy Alignment'));
    policyAlignment.bullets.forEach(item => lines.push(`- ${item}`));
    const references = formatCitationList(
      gatherCitations(policyAlignment.citations, sourceLookup)
    );
    if (references) {
      lines.push(references);
    }
  }

  if (templates.length) {
    lines.push(divider('Templates'));
    templates.forEach(snippet => {
      lines.push(`### ${snippet.title}`);
      if (snippet.markdown) {
        lines.push('```');
        lines.push(snippet.markdown.trim());
        lines.push('```');
      }
      if (snippet.lines?.length) {
        snippet.lines.forEach(line => lines.push(`- ${line}`));
      }
    });
  }

  if (selectedOnePagers.length) {
    lines.push(divider('Attachments'));
    selectedOnePagers.forEach(doc => {
      lines.push(`- ${doc.title} (${doc.markdownPath})`);
    });
  }

  // Tufte-style bibliography
  if (sources.length) {
    lines.push('\n---\n');
    lines.push('## References');
    lines.push('');
    sources.forEach((source, index) => {
      lines.push(`${index + 1}. ${formatCitationText(source)}`);
    });
  }

  // Add metadata footer
  lines.push('\n---');
  lines.push('');
  lines.push(`*Generated by Dryvest v.${meta.datasetVersion} • ${new Date().toLocaleDateString()} • Strategic intelligence - not investment advice*`);

  return lines.join('\n');
}
