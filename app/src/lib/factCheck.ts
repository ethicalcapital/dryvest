import type { BriefExportData } from './exporters';

const indent = (value: string, spaces = 2) =>
  value
    .split(/\r?\n/)
    .map(line => `${' '.repeat(spaces)}${line.trim()}`)
    .join('\n');

const asCitationText = (
  source: Extract<BriefExportData['sources'][number], { id: string }>
) => source.citationText ?? `${source.label}. ${source.url}`;

const gatherCitations = (
  ids: string[] | undefined,
  lookup: BriefExportData['sourceLookup']
) =>
  (ids ?? [])
    .map(id => lookup[id])
    .filter((source): source is Extract<BriefExportData['sources'][number], { id: string }> =>
      Boolean(source)
    );

const appendMultiline = (lines: string[], label: string, value?: string | null) => {
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  lines.push(`${label}: |`);
  lines.push(indent(trimmed));
};

const appendCitations = (
  lines: string[],
  label: string,
  ids: string[] | undefined,
  lookup: BriefExportData['sourceLookup']
) => {
  const sources = gatherCitations(ids, lookup);
  if (!sources.length) return;
  lines.push(`${label}:`);
  sources.forEach(source => {
    lines.push(`  - [${source.id}] ${asCitationText(source)}`);
  });
};

const pickScreeningBody = (
  data: BriefExportData
) => {
  const node = data.screeningNode;
  if (!node) return undefined;
  if (node.variants?.length) {
    const tone = data.context.level;
    const variant =
      node.variants.find(item => item.transforms?.tone === tone) ??
      node.variants[0];
    return variant.body;
  }
  return node.body;
};

export function buildFactCheckReport(data: BriefExportData): string {
  const lines: string[] = [];
  const { meta, context, opener, guide, keyPoints, nextSteps, templates, selectedOnePagers, sources, sourceLookup } = data;

  lines.push('=== FACT CHECK PACKAGE ===');
  lines.push(`DATASET_VERSION: ${meta.datasetVersion}`);
  lines.push(`PLAYLIST_ID: ${meta.playlistId}`);
  lines.push(`GENERATED_AT: ${new Date().toISOString()}`);
  lines.push('CONTEXT:');
  lines.push(`  IDENTITY: ${context.identity ?? 'n/a'}`);
  lines.push(`  AUDIENCE: ${context.audience ?? 'n/a'}`);
  lines.push(`  VENUE: ${context.venue ?? 'n/a'}`);
  lines.push(`  LEVEL: ${context.level ?? 'n/a'}`);
  lines.push('SUMMARY:');
  lines.push(`  KEY_POINTS: ${keyPoints.length}`);
  lines.push(`  NEXT_STEPS: ${nextSteps.length}`);
  lines.push(`  TEMPLATES: ${templates.length}`);
  lines.push(`  ATTACHMENTS: ${selectedOnePagers.length}`);
  lines.push(`  SOURCES: ${sources.length}`);
  lines.push('');

  if (opener) {
    lines.push('OPENER:');
    lines.push(`  NODE_ID: ${opener.id}`);
    appendMultiline(lines, '  TEXT', opener.text);
    lines.push('');
  }

  if (guide) {
    lines.push('GUIDE:');
    lines.push(`  NODE_ID: ${guide.id}`);
    appendMultiline(lines, '  ASK', guide.sections.ask);
    appendMultiline(lines, '  IMPLEMENTATION', guide.sections.implementation);
    appendMultiline(lines, '  REPORTING', guide.sections.reporting);
    appendMultiline(lines, '  RISK', guide.sections.risk);
    lines.push('');
  }

  if (keyPoints.length) {
    keyPoints.forEach((point, index) => {
      lines.push(`KEY_POINT_${index + 1}:`);
      lines.push(`  NODE_ID: ${point.id}`);
      appendMultiline(lines, '  TITLE', point.title);
      appendMultiline(lines, '  ASSERTION', point.body);
      appendCitations(lines, '  CITATIONS', point.citations, sourceLookup);
      lines.push('');
    });
  }

  if (nextSteps.length) {
    lines.push('NEXT_STEPS:');
    nextSteps.forEach((step, index) => {
      lines.push(`  - STEP_${index + 1}: ${step.text.trim()}`);
    });
    lines.push('');
  }

  const screeningBody = pickScreeningBody(data);
  if (screeningBody) {
    lines.push('SCREENING_STRATEGY:');
    appendMultiline(lines, '  BODY', screeningBody);
    appendCitations(lines, '  CITATIONS', data.screeningNode?.citations, sourceLookup);
    lines.push('');
  }

  if (data.policyAlignment) {
    lines.push('POLICY_ALIGNMENT:');
    lines.push(`  NODE_ID: ${data.policyAlignment.id}`);
    if (data.policyAlignment.bullets?.length) {
      lines.push('  BULLETS:');
      data.policyAlignment.bullets.forEach((item, idx) => {
        lines.push(`    - BULLET_${idx + 1}: ${item.trim()}`);
      });
    }
    appendCitations(lines, '  CITATIONS', data.policyAlignment.citations, sourceLookup);
    lines.push('');
  }

  if (data.venueSnippet?.lines?.length) {
    lines.push('VENUE_CUES:');
    data.venueSnippet.lines.forEach((line: string, idx: number) => {
      lines.push(`  - CUE_${idx + 1}: ${line.trim()}`);
    });
    lines.push('');
  }

  if (templates.length) {
    lines.push('TEMPLATES:');
    templates.forEach(snippet => {
      lines.push(`  - TEMPLATE_ID: ${snippet.id}`);
      lines.push(`    TITLE: ${snippet.title}`);
      if (snippet.markdown) {
        lines.push('    MARKDOWN: |');
        lines.push(indent(snippet.markdown.trim(), 6));
      }
      if (snippet.lines?.length) {
        lines.push('    LINES:');
        snippet.lines.forEach((line, idx) => {
          lines.push(`      - LINE_${idx + 1}: ${line.trim()}`);
        });
      }
    });
    lines.push('');
  }

  if (selectedOnePagers.length) {
    lines.push('ATTACHMENTS:');
    selectedOnePagers.forEach(doc => {
      lines.push(`  - DOCUMENT_ID: ${doc.id}`);
      lines.push(`    TITLE: ${doc.title}`);
      appendMultiline(lines, '    DESCRIPTION', doc.description);
      lines.push(`    MARKDOWN_PATH: ${doc.markdownPath}`);
    });
    lines.push('');
  }

  if (sources.length) {
    lines.push('SOURCES:');
    sources.forEach(source => {
      lines.push(`  - SOURCE_ID: ${source.id}`);
      lines.push(`    LABEL: ${source.label}`);
      lines.push(`    URL: ${source.url}`);
      appendMultiline(lines, '    CITATION', asCitationText(source));
    });
    lines.push('');
  }

  lines.push('=== END FACT CHECK PACKAGE ===');
  return lines.join('\n');
}
