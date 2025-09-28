interface D1PreparedStatement<T = unknown> {
  bind(...values: unknown[]): D1PreparedStatement<T>;
  first<R = T>(): Promise<R | null>;
  all<R = T>(): Promise<{ results: R[] }>;
}

interface D1Database {
  prepare<T = unknown>(query: string): D1PreparedStatement<T>;
}

interface Env {
  DRYVEST_DB: D1Database;
}

interface DatasetVersionRow {
  version: string;
  manifest: string;
  schema: string;
  fallback_version: string | null;
}

interface PayloadRow {
  payload: string;
}

const toJsonArray = async (
  stmt: D1PreparedStatement<PayloadRow>
): Promise<unknown[]> => {
  const { results } = await stmt.all<PayloadRow>();
  return results.map(record => JSON.parse(record.payload));
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedVersion = url.searchParams.get('version') ?? undefined;
  const pretty = url.searchParams.get('pretty') === '1';

  const latestRow = await env.DRYVEST_DB.prepare<DatasetVersionRow>(
    requestedVersion
      ? 'SELECT version, manifest, schema, fallback_version FROM dataset_versions WHERE version = ?'
      : 'SELECT version, manifest, schema, fallback_version FROM dataset_versions ORDER BY created_at DESC LIMIT 1'
  )
    .bind(requestedVersion)
    .first<DatasetVersionRow>();

  if (!latestRow) {
    const status = requestedVersion ? 404 : 500;
    return new Response(
      JSON.stringify({
        error: requestedVersion
          ? `Dataset version ${requestedVersion} not found`
          : 'No dataset versions have been published',
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }

  const version = latestRow.version;

  const [nodes, playlists, sources, assertions, entities] = await Promise.all([
    toJsonArray(
      env.DRYVEST_DB
        .prepare<PayloadRow>(
          'SELECT payload FROM nodes WHERE version = ? ORDER BY json_extract(payload, "$.id")'
        )
        .bind(version)
    ),
    toJsonArray(
      env.DRYVEST_DB
        .prepare<PayloadRow>(
          'SELECT payload FROM playlists WHERE version = ? ORDER BY json_extract(payload, "$.id")'
        )
        .bind(version)
    ),
    toJsonArray(
      env.DRYVEST_DB
        .prepare<PayloadRow>(
          'SELECT payload FROM sources WHERE version = ? ORDER BY json_extract(payload, "$.id")'
        )
        .bind(version)
    ),
    toJsonArray(
      env.DRYVEST_DB
        .prepare<PayloadRow>(
          'SELECT payload FROM assertions WHERE version = ? ORDER BY json_extract(payload, "$.id")'
        )
        .bind(version)
    ),
    toJsonArray(
      env.DRYVEST_DB
        .prepare<PayloadRow>(
          'SELECT payload FROM entities WHERE version = ? ORDER BY json_extract(payload, "$.id")'
        )
        .bind(version)
    ),
  ]);

  const manifest = JSON.parse(latestRow.manifest);
  if (!manifest.version) {
    manifest.version = version;
  }
  if (latestRow.fallback_version && !manifest.fallbackVersion) {
    manifest.fallbackVersion = latestRow.fallback_version;
  }

  const schemaDoc = JSON.parse(latestRow.schema);

  const dataset = {
    version,
    manifest,
    schema: schemaDoc,
    nodes,
    playlists,
    sources,
    assertions,
    entities,
  };

  const body = pretty
    ? JSON.stringify(dataset, null, 2)
    : JSON.stringify(dataset);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
