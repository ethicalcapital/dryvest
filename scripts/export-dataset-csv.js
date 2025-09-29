#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_VERSION = '2025-09-27';
const OUTPUT_DIR = path.join(__dirname, '..', 'exports');
const DATA_ROOT = path.join(__dirname, '..', 'app', 'public', 'data');

const args = process.argv.slice(2);
const options = {
  version: DEFAULT_VERSION,
  fromApi: false,
  apiBase: process.env.DRYVEST_DATASET_API || 'http://localhost:8788/api/dataset',
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--version' || arg === '-v') {
    options.version = args[++i];
  } else if (arg === '--api') {
    options.fromApi = true;
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      options.apiBase = next;
      i++;
    }
  } else if (arg === '--help' || arg === '-h') {
    console.log(`Usage: node scripts/export-dataset-csv.js [--version YYYY-MM-DD] [--api [url]]\n\n` +
      `Without --api the script reads the legacy JSON bundle at app/public/data/<version>.\n` +
      `With --api it fetches from the dataset endpoint (default http://localhost:8788/api/dataset).\n` +
      `CSV files are written to ${OUTPUT_DIR}.`);
    process.exit(0);
  }
}

const ensureDir = dir => fs.mkdirSync(dir, { recursive: true });

const loadDatasetFromJson = version => {
  const base = path.join(DATA_ROOT, version);
  const required = ['nodes.json', 'playlists.json', 'sources.json', 'assertions.json', 'entities.json', 'schema.json', 'manifest.json'];
  for (const file of required) {
    if (!fs.existsSync(path.join(base, file))) {
      throw new Error(`Missing ${file} in ${base}`);
    }
  }
  return {
    version,
    manifest: JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8')),
    schema: JSON.parse(fs.readFileSync(path.join(base, 'schema.json'), 'utf8')),
    nodes: JSON.parse(fs.readFileSync(path.join(base, 'nodes.json'), 'utf8')).nodes,
    playlists: JSON.parse(fs.readFileSync(path.join(base, 'playlists.json'), 'utf8')).playlists,
    sources: JSON.parse(fs.readFileSync(path.join(base, 'sources.json'), 'utf8')).sources,
    assertions: JSON.parse(fs.readFileSync(path.join(base, 'assertions.json'), 'utf8')).assertions,
    entities: JSON.parse(fs.readFileSync(path.join(base, 'entities.json'), 'utf8')).entities,
  };
};

const loadDatasetFromApi = async (version, apiBase) => {
  const url = new URL(apiBase);
  url.searchParams.set('version', version);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset from ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const joinList = value => (Array.isArray(value) ? value.join('; ') : value ?? '');

const quote = value => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/["\n,]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const writeCsv = (rows, headers, filePath) => {
  const csv = [headers.map(h => quote(h.label)).join(',')];
  for (const row of rows) {
    csv.push(headers.map(({ key, transform }) => quote(transform ? transform(row) : row[key])).join(','));
  }
  fs.writeFileSync(filePath, csv.join('\n'), 'utf8');
  console.log(`✓ Wrote ${filePath}`);
};

const buildRows = dataset => {
  const { nodes, playlists, sources, assertions, entities } = dataset;

  const nodeRows = nodes.map(node => ({
    id: node.id,
    type: node.type,
    title: node.title ?? node.text ?? '',
    summary: node.body ?? node.description ?? '',
    citations: joinList(node.citations),
    assertions: joinList(node.assertions),
    tags: joinList(node.tags),
    targets_identity: joinList(node.targets?.identity),
    targets_audience: joinList(node.targets?.audience),
    targets_level: joinList(node.targets?.level),
    targets_motivation: joinList(node.targets?.motivation),
  }));

  const playlistRows = playlists.map(playlist => ({
    id: playlist.id,
    kind: playlist.kind,
    title: playlist.title,
    targets_identity: joinList(playlist.targets?.identity),
    targets_audience: joinList(playlist.targets?.audience),
    targets_motivation: joinList(playlist.targets?.motivation),
    items: playlist.items.length,
  }));

  const sourceRows = sources.map(source => ({
    id: source.id,
    label: source.label,
    url: source.url,
    citation: source.citationText ?? '',
    tags: joinList(source.tags),
  }));

  const assertionRows = assertions.map(assertion => ({
    id: assertion.id,
    title: assertion.title,
    statement: assertion.statement,
    evidence: joinList(assertion.evidence),
    supports: joinList(assertion.supports),
    confidence: assertion.confidence ?? '',
  }));

  const entityRows = entities.map(entity => ({
    id: entity.id,
    label: entity.label,
    shortDescription: entity.shortDescription ?? '',
    timeHorizon: entity.timeHorizon ?? '',
    typicalWithdrawal: entity.typicalWithdrawal ?? '',
    governanceStyle: entity.governanceStyle ?? '',
    keyConstraints: joinList(entity.keyConstraints),
    stakeholders: joinList(entity.stakeholders),
  }));

  return { nodeRows, playlistRows, sourceRows, assertionRows, entityRows };
};

(async () => {
  try {
    const dataset = options.fromApi
      ? await loadDatasetFromApi(options.version, options.apiBase)
      : loadDatasetFromJson(options.version);

    ensureDir(OUTPUT_DIR);

    const { nodeRows, playlistRows, sourceRows, assertionRows, entityRows } = buildRows(dataset);

    const versionSlug = options.version.replace(/[^a-z0-9]+/gi, '-');

    writeCsv(
      nodeRows,
      [
        { key: 'id', label: 'ID' },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title / Text' },
        { key: 'summary', label: 'Summary / Body' },
        { key: 'citations', label: 'Citations' },
        { key: 'assertions', label: 'Assertions' },
        { key: 'tags', label: 'Tags' },
        { key: 'targets_identity', label: 'Targets: Identity' },
        { key: 'targets_audience', label: 'Targets: Audience' },
        { key: 'targets_level', label: 'Targets: Level' },
        { key: 'targets_motivation', label: 'Targets: Motivation' },
      ],
      path.join(OUTPUT_DIR, `${versionSlug}-nodes.csv`)
    );

    writeCsv(
      playlistRows,
      [
        { key: 'id', label: 'ID' },
        { key: 'kind', label: 'Kind' },
        { key: 'title', label: 'Title' },
        { key: 'targets_identity', label: 'Targets: Identity' },
        { key: 'targets_audience', label: 'Targets: Audience' },
        { key: 'targets_motivation', label: 'Targets: Motivation' },
        { key: 'items', label: 'Item Count' },
      ],
      path.join(OUTPUT_DIR, `${versionSlug}-playlists.csv`)
    );

    writeCsv(
      sourceRows,
      [
        { key: 'id', label: 'ID' },
        { key: 'label', label: 'Label' },
        { key: 'url', label: 'URL' },
        { key: 'citation', label: 'Citation' },
        { key: 'tags', label: 'Tags' },
      ],
      path.join(OUTPUT_DIR, `${versionSlug}-sources.csv`)
    );

    writeCsv(
      assertionRows,
      [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'statement', label: 'Statement' },
        { key: 'evidence', label: 'Evidence IDs' },
        { key: 'supports', label: 'Supports Nodes' },
        { key: 'confidence', label: 'Confidence' },
      ],
      path.join(OUTPUT_DIR, `${versionSlug}-assertions.csv`)
    );

    writeCsv(
      entityRows,
      [
        { key: 'id', label: 'ID' },
        { key: 'label', label: 'Label' },
        { key: 'shortDescription', label: 'Short Description' },
        { key: 'timeHorizon', label: 'Time Horizon' },
        { key: 'typicalWithdrawal', label: 'Typical Withdrawal' },
        { key: 'governanceStyle', label: 'Governance Style' },
        { key: 'keyConstraints', label: 'Key Constraints' },
        { key: 'stakeholders', label: 'Stakeholders' },
      ],
      path.join(OUTPUT_DIR, `${versionSlug}-entities.csv`)
    );

    console.log('\nExport complete.');
  } catch (error) {
    console.error('Failed to export dataset:', error);
    process.exit(1);
  }
})();
