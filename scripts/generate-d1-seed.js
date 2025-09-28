#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const version = process.argv[2] ?? '2025-09-27';
const outputPath = process.argv[3] ?? path.join(__dirname, '..', 'database', `seed-${version}.sql`);

const basePath = path.join(__dirname, '..', 'app', 'public', 'data', version);

const requiredFiles = [
  'manifest.json',
  'schema.json',
  'nodes.json',
  'playlists.json',
  'sources.json',
  'assertions.json',
  'entities.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(basePath, file))) {
    console.error(`Missing ${file} in ${basePath}`);
    process.exit(1);
  }
}

const readJson = file =>
  JSON.parse(fs.readFileSync(path.join(basePath, file), 'utf8'));

const manifest = readJson('manifest.json');
const schemaDoc = readJson('schema.json');
const nodesDoc = readJson('nodes.json');
const playlistsDoc = readJson('playlists.json');
const sourcesDoc = readJson('sources.json');
const assertionsDoc = readJson('assertions.json');
const entitiesDoc = readJson('entities.json');

const escape = value => String(value).replace(/'/g, "''");
const json = value => escape(JSON.stringify(value));

const statements = [];
statements.push(
  `INSERT INTO dataset_versions (version, manifest, schema, fallback_version) VALUES ('${escape(
    version
  )}', '${json(manifest)}', '${json(schemaDoc)}', ${
    manifest.fallbackVersion ? `'${escape(manifest.fallbackVersion)}'` : 'NULL'
  }) ON CONFLICT(version) DO UPDATE SET manifest=excluded.manifest, schema=excluded.schema, fallback_version=excluded.fallback_version;`
);

const tables = [
  { name: 'nodes', items: nodesDoc.nodes, key: 'id' },
  { name: 'playlists', items: playlistsDoc.playlists, key: 'id' },
  { name: 'sources', items: sourcesDoc.sources, key: 'id' },
  { name: 'assertions', items: assertionsDoc.assertions, key: 'id' },
  { name: 'entities', items: entitiesDoc.entities, key: 'id' },
];

for (const table of tables) {
  statements.push(`DELETE FROM ${table.name} WHERE version='${escape(version)}';`);
  for (const item of table.items) {
  statements.push(
    `INSERT INTO ${table.name} (version, id, payload) VALUES ('${escape(version)}', '${escape(
        item[table.key]
      )}', '${json(item)}') ON CONFLICT(version, id) DO UPDATE SET payload=excluded.payload;`
  );
}
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, statements.join('\n') + '\n', 'utf8');

console.log(`Wrote ${outputPath}`);
