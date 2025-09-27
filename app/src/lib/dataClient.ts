import { z } from 'zod';
import {
  ManifestSchema,
  NodesDocumentSchema,
  PlaylistsDocumentSchema,
  SchemaDocumentSchema,
  SourcesDocumentSchema,
  AssertionsDocumentSchema,
} from './schema';
import type {
  Dataset,
  Manifest,
  SchemaDocument,
  SourceRecord,
  SourcesDocument,
  AssertionRecord,
  AssertionsDocument,
} from './schema';

const DATA_BASE_PATH = '/data';

class DatasetError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatasetError';
    if (cause) {
      (this as Error).cause = cause as Error;
    }
  }
}

async function fetchJson<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new DatasetError(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    throw new DatasetError(`Failed to parse JSON from ${url}`, error);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new DatasetError(
      `Validation failed for ${url}: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

function indexPlaylists(
  datasetVersion: string,
  manifestVersion: string,
  data: SchemaDocument
): void {
  if (data.version && data.version !== datasetVersion) {
    console.warn(
      `Schema document version ${data.version} does not match dataset version ${datasetVersion} (manifest ${manifestVersion}).`
    );
  }
}

function buildDataset(
  manifest: Manifest,
  schemaDoc: SchemaDocument,
  nodesDoc: z.infer<typeof NodesDocumentSchema>,
  playlistsDoc: z.infer<typeof PlaylistsDocumentSchema>,
  sourcesDoc?: SourcesDocument,
  assertionsDoc?: AssertionsDocument
): Dataset {
  indexPlaylists(nodesDoc.version, manifest.version, schemaDoc);
  const filteredNodes = nodesDoc.nodes.filter(node => node.type !== 'source');

  const sources: SourceRecord[] = sourcesDoc
    ? sourcesDoc.sources
    : nodesDoc.nodes
        .filter(node => node.type === 'source')
        .map(node => ({
          id: node.id,
          label: (node as any).label,
          url: (node as any).url,
          citationText: (node as any).citationText,
        }));

  const assertions: AssertionRecord[] = assertionsDoc
    ? assertionsDoc.assertions
    : [];

  const nodeIndex = Object.fromEntries(
    filteredNodes.map(node => [node.id, node])
  );
  const playlistById = Object.fromEntries(
    playlistsDoc.playlists.map(playlist => [playlist.id, playlist])
  );
  const playlistsByKind = playlistsDoc.playlists.reduce<
    Record<string, typeof playlistsDoc.playlists>
  >((acc, playlist) => {
    if (!acc[playlist.kind]) {
      acc[playlist.kind] = [];
    }
    acc[playlist.kind].push(playlist);
    return acc;
  }, {});

  return {
    version: manifest.version,
    manifest,
    schema: schemaDoc,
    nodes: filteredNodes,
    playlists: playlistsDoc.playlists,
    sources,
    assertions,
    nodeIndex,
    sourceIndex: Object.fromEntries(sources.map(source => [source.id, source])),
    assertionIndex: Object.fromEntries(assertions.map(assertion => [assertion.id, assertion])),
    playlistById,
    playlistsByKind,
  };
}

export async function loadDataset(
  version: string,
  options?: { basePath?: string; fallbackVersion?: string }
): Promise<Dataset> {
  const basePath = options?.basePath ?? DATA_BASE_PATH;
  const manifestUrl = `${basePath}/${version}/manifest.json`;
  let manifest: Manifest;

  try {
    manifest = await fetchJson(manifestUrl, ManifestSchema);
  } catch (error) {
    const fallback = options?.fallbackVersion;
    if (fallback && fallback !== version) {
      return loadDataset(fallback, options);
    }
    throw error;
  }

  const schemaUrl = `${basePath}/${version}/${manifest.schema}`;
  const nodesUrl = `${basePath}/${version}/${manifest.nodes}`;
  const playlistsUrl = `${basePath}/${version}/${manifest.playlists}`;

  const sourcesUrl = manifest.sources
    ? `${basePath}/${version}/${manifest.sources}`
    : undefined;
  const assertionsUrl = manifest.assertions
    ? `${basePath}/${version}/${manifest.assertions}`
    : undefined;

  try {
    const [schemaDoc, nodesDoc, playlistsDoc, sourcesDoc, assertionsDoc] =
      await Promise.all([
        fetchJson(schemaUrl, SchemaDocumentSchema),
        fetchJson(nodesUrl, NodesDocumentSchema),
        fetchJson(playlistsUrl, PlaylistsDocumentSchema),
        sourcesUrl
          ? fetchJson(sourcesUrl, SourcesDocumentSchema)
          : Promise.resolve(undefined),
        assertionsUrl
          ? fetchJson(assertionsUrl, AssertionsDocumentSchema)
          : Promise.resolve(undefined),
      ]);

    return buildDataset(
      manifest,
      schemaDoc,
      nodesDoc,
      playlistsDoc,
      sourcesDoc,
      assertionsDoc
    );
  } catch (error) {
    if (manifest.fallbackVersion && manifest.fallbackVersion !== version) {
      return loadDataset(manifest.fallbackVersion, options);
    }
    throw error;
  }
}

export { DatasetError };
