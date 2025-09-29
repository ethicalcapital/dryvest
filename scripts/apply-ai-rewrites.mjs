#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  FACTS,
  KEY_POINTS,
} from '../app/src/data.js';

const OUTPUT_DIR = path.resolve('exports');
const REFS_DIR = path.resolve('references');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(REFS_DIR)) fs.mkdirSync(REFS_DIR, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const outputPath = path.join(OUTPUT_DIR, `rewrite-matrix-${today}-ai.csv`);
const jsonPath = path.join(OUTPUT_DIR, `rewrite-matrix-${today}-ai.json`);

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clarify(text, mode = 'generic') {
  const response = await fetch('https://dryvest.ethicic.com/api/clarify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode }),
  });
  if (!response.ok) {
    throw new Error(`Clarify failed (${response.status})`);
  }
  const data = await response.json();
  return data.summary ?? '';
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function snapshot(url, id, idx) {
  if (!url || !/^https?:/i.test(url)) return null;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const fileName = `${sanitizeFileName(id)}_${idx}.html`;
    const filePath = path.join(REFS_DIR, fileName);
    fs.writeFileSync(filePath, html, 'utf8');
    return path.relative(process.cwd(), filePath);
  } catch (error) {
    console.warn(`[snapshot] ${id} ${url} -> ${error.message}`);
    return null;
  }
}

async function main() {
  const rows = [];

  for (const fact of FACTS) {
    const citationsWithUrls = fact.citations.filter((c) => c.url);
    const text = `Claim: ${fact.claim}\nSupport: ${fact.support}\nSources:\n${citationsWithUrls.map((c) => `- ${c.title}${c.url ? ` (${c.url})` : ''}`).join('\n')}`;
    let plainDraft = '';
    try {
      plainDraft = await clarify(text, 'fact');
    } catch (error) {
      console.warn(`[clarify] fact ${fact.id} -> ${error.message}`);
    }

    const snapshotPaths = [];
    const snapshotTargets = citationsWithUrls.slice(0, 3);
    for (let i = 0; i < snapshotTargets.length; i += 1) {
      const refPath = await snapshot(snapshotTargets[i].url, fact.id, i + 1);
      if (refPath) snapshotPaths.push(refPath);
      await sleep(250);
    }

    rows.push({
      type: 'fact',
      id: fact.id,
      title: fact.claim,
      original: fact.support,
      citations: citationsWithUrls.map((c) => `${c.title}${c.url ? ` (${c.url})` : ''}`).join('\n'),
      plain_draft: plainDraft,
      approved_text: '',
      review_notes: '',
      snapshot_paths: snapshotPaths.join('\n'),
    });

    await sleep(400);
  }

  for (const point of KEY_POINTS) {
    const text = `Title: ${point.title}\nBody: ${point.body}`;
    let plainDraft = '';
    try {
      plainDraft = await clarify(text, 'doc');
    } catch (error) {
      console.warn(`[clarify] key_point ${point.id} -> ${error.message}`);
    }

    rows.push({
      type: 'key_point',
      id: point.id,
      title: point.title,
      original: point.body,
      citations: (point.citations || []).join('\n'),
      plain_draft: plainDraft,
      approved_text: '',
      review_notes: '',
      snapshot_paths: '',
    });

    await sleep(400);
  }

  writeCsv(rows, HEADER, outputPath);
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} rows to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
