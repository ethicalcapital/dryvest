#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';

const OUTPUT_DIR = path.resolve('exports');

function listMatrices() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs
    .readdirSync(OUTPUT_DIR)
    .filter((name) => name.startsWith('rewrite-matrix-') && name.endsWith('-ai.json'))
    .sort();
}

function loadMatrix(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveMatrix(rows, jsonPath, csvPath) {
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
  writeCsv(rows, csvPath);
}

const HEADER = [
  'type',
  'id',
  'title',
  'original_text',
  'citations',
  'plain_draft',
  'approved_text',
  'review_notes',
  'snapshot_paths',
];

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(rows, outputPath) {
  const headerLine = HEADER.join(',');
  const lines = rows.map((row) => HEADER
    .map((key) => escapeCsv(row[key] ?? ''))
    .join(','));
  const content = [headerLine, ...lines].join('\n');
  fs.writeFileSync(outputPath, content, 'utf8');
}

function printEntry(entry, index, total) {
  console.clear();
  console.log(`Entry ${index + 1} / ${total}`);
  console.log('='.repeat(80));
  console.log(`[${entry.type}] ${entry.id}`);
  console.log(entry.title);
  console.log('-'.repeat(80));
  console.log('Original:');
  console.log(entry.original_text || entry.original || '(none)');
  console.log('-'.repeat(80));
  console.log('AI draft:');
  console.log(entry.plain_draft || '(empty)');
  console.log('-'.repeat(80));
  if (entry.approved_text) {
    console.log('Approved:');
    console.log(entry.approved_text);
    console.log('-'.repeat(80));
  }
  if (entry.citations) {
    console.log('Citations:');
    console.log(entry.citations);
    console.log('-'.repeat(80));
  }
  if (entry.snapshot_paths) {
    console.log('Snapshots:');
    console.log(entry.snapshot_paths);
    console.log('-'.repeat(80));
  }
  if (entry.review_notes) {
    console.log('Notes:');
    console.log(entry.review_notes);
    console.log('-'.repeat(80));
  }
}

function openSnapshot(snapshotPaths) {
  if (!snapshotPaths) return;
  const paths = snapshotPaths.split('\n').filter(Boolean);
  if (!paths.length) return;
  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd'
      : 'xdg-open';
  for (const filePath of paths) {
    const absolute = path.resolve(filePath);
    if (!fs.existsSync(absolute)) {
      console.warn(`Snapshot missing: ${absolute}`);
      continue;
    }
    if (opener === 'cmd') {
      spawnSync('cmd', ['/c', 'start', '', absolute], { stdio: 'ignore' });
    } else {
      spawnSync(opener, [absolute], { stdio: 'ignore' });
    }
  }
}

async function editWithEditor(initialText) {
  const editor = process.env.EDITOR;
  if (!editor) {
    return multiLineInput(initialText);
  }

  const tempPath = path.join(os.tmpdir(), `dryvest-review-${Date.now()}.txt`);
  fs.writeFileSync(tempPath, initialText ?? '', 'utf8');
  const result = spawnSync(editor, [tempPath], { stdio: 'inherit' });
  if (result.error) {
    console.warn(`Failed to launch ${editor}: ${result.error.message}`);
    return initialText;
  }
  const updated = fs.readFileSync(tempPath, 'utf8');
  fs.unlinkSync(tempPath);
  return updated.trim();
}

async function multiLineInput(initialText) {
  console.log('Enter text (finish with a single "." on a new line):');
  if (initialText) {
    console.log(initialText);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const lines = [];
  for await (const line of rl) {
    if (line === '.') break;
    lines.push(line);
  }
  rl.close();
  return lines.join('\n').trim();
}

async function main() {
  const matrices = listMatrices();
  if (!matrices.length) {
    console.error('No rewrite matrix JSON files found in exports/. Run apply-ai first.');
    process.exit(1);
  }

  const targetName = matrices[matrices.length - 1];
  const targetPath = path.join(OUTPUT_DIR, targetName);
  const rows = loadMatrix(targetPath);
  let index = 0;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  while (index < rows.length) {
    const entry = rows[index];
    printEntry(entry, index, rows.length);

    const answer = await rl.question('(a)ccept AI  (e)dit  (n)ote  (o)pen snapshots  (p)rev  (s)kip  (q)uit > ');
    const cmd = answer.trim().toLowerCase();

    if (cmd === 'q') {
      break;
    }

    if (cmd === 'p') {
      index = Math.max(index - 1, 0);
      continue;
    }

    if (cmd === 'o') {
      openSnapshot(entry.snapshot_paths);
      await rl.question('Opened snapshots. Press Enter to continue.');
      continue;
    }

    if (cmd === 'a') {
      entry.approved_text = entry.plain_draft || entry.approved_text;
      index = Math.min(index + 1, rows.length - 1);
      continue;
    }

    if (cmd === 'n') {
      const note = await rl.question('Add review note: ');
      entry.review_notes = note.trim();
      continue;
    }

    if (cmd === 'e') {
      const updated = await editWithEditor(entry.approved_text || entry.plain_draft || '');
      entry.approved_text = updated;
      const note = await rl.question('Optional note (Enter to skip): ');
      if (note.trim()) {
        entry.review_notes = note.trim();
      }
      index = Math.min(index + 1, rows.length - 1);
      continue;
    }

    // Skip/default
    index = Math.min(index + 1, rows.length - 1);
  }

  rl.close();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = targetName.replace('-ai.json', '');
  const reviewedJson = path.join(OUTPUT_DIR, `${baseName}-reviewed-${timestamp}.json`);
  const reviewedCsv = path.join(OUTPUT_DIR, `${baseName}-reviewed-${timestamp}.csv`);

  saveMatrix(rows, reviewedJson, reviewedCsv);
  console.log(`Saved reviewed matrix to ${reviewedJson}`);
  console.log(`CSV exported to ${reviewedCsv}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
