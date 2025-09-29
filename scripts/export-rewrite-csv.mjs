#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  FACTS,
  KEY_POINTS,
} from '../app/src/data.js';

const OUTPUT_DIR = path.resolve('exports');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const HEADER = [
  { id: 'type', title: 'type' },
  { id: 'id', title: 'id' },
  { id: 'title', title: 'title' },
  { id: 'original', title: 'original_text' },
  { id: 'citations', title: 'citations' },
  { id: 'plain_draft', title: 'plain_draft' },
  { id: 'approved_text', title: 'approved_text' },
  { id: 'review_notes', title: 'review_notes' },
  { id: 'snapshot_paths', title: 'snapshot_paths' },
];

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(records, header, outputPath) {
  const headerLine = header.map((h) => h.title).join(',');
  const lines = records.map((record) => header
    .map((h) => escapeCsv(record[h.id]))
    .join(','));
  const content = [headerLine, ...lines].join('\n');
  fs.writeFileSync(outputPath, content, 'utf8');
}

function buildFactRows() {
  return FACTS.map((fact) => ({
    type: 'fact',
    id: fact.id,
    title: fact.claim,
    original: fact.support,
    citations: fact.citations.map((c) => `${c.title}${c.url ? ` (${c.url})` : ''}`).join('\n'),
    plain_draft: '',
    approved_text: '',
    review_notes: '',
    snapshot_paths: '',
  }));
}

function buildPointRows() {
  return KEY_POINTS.map((point) => ({
    type: 'key_point',
    id: point.id,
    title: point.title,
    original: point.body,
    citations: (point.citations || []).join('\n'),
    plain_draft: '',
    approved_text: '',
    review_notes: '',
    snapshot_paths: '',
  }));
}

async function main() {
  const rows = [...buildFactRows(), ...buildPointRows()];
const stamp = new Date().toISOString().slice(0,10);
const outputPath = path.join(OUTPUT_DIR, `rewrite-matrix-${stamp}.csv`);
const jsonPath = path.join(OUTPUT_DIR, `rewrite-matrix-${stamp}.json`);

  writeCsv(rows, HEADER, outputPath);
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} rows to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
