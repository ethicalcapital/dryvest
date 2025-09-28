import { z } from 'zod';
import {
  ManifestSchema,
  NodesDocumentSchema,
  PlaylistsDocumentSchema,
  SchemaDocumentSchema,
  SourcesDocumentSchema,
  AssertionsDocumentSchema,
  EntitiesDocumentSchema,
  DatasetResponseSchema,
} from './schema';
import type {
  Dataset,
  Manifest,
  SchemaDocument,
  SourceRecord,
  AssertionRecord,
  EntityProfile,
  Node,
  Playlist,
} from './schema';

const DATASET_ENDPOINT = '/api/dataset';
const LEGACY_DATA_BASE_PATH = '/data';

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

function buildDatasetFromPayloads(
  datasetVersion: string,
  manifest: Manifest,
  schemaDoc: SchemaDocument,
  nodePayloads: Node[],
  playlistPayloads: Playlist[],
  sources: SourceRecord[],
  assertions: AssertionRecord[],
  entities: EntityProfile[]
): Dataset {
  const manifestVersion = manifest.version ?? datasetVersion;
  manifest.version = manifestVersion;
  indexPlaylists(datasetVersion, manifestVersion, schemaDoc);

  const filteredNodes = nodePayloads.filter(node => node.type !== 'source');

  const nodeIndex = Object.fromEntries(
    filteredNodes.map(node => [node.id, node])
  );
  const playlistById = Object.fromEntries(
    playlistPayloads.map(playlist => [playlist.id, playlist])
  );
  const playlistsByKind = playlistPayloads.reduce<
    Record<string, typeof playlistPayloads>
  >((acc, playlist) => {
    if (!acc[playlist.kind]) {
      acc[playlist.kind] = [];
    }
    acc[playlist.kind].push(playlist);
    return acc;
  }, {});

  return {
    version: datasetVersion,
    manifest,
    schema: schemaDoc,
    nodes: filteredNodes,
    playlists: playlistPayloads,
    sources,
    assertions,
    entities,
    nodeIndex,
    sourceIndex: Object.fromEntries(sources.map(source => [source.id, source])),
    assertionIndex: Object.fromEntries(assertions.map(assertion => [assertion.id, assertion])),
    entityIndex: Object.fromEntries(entities.map(entity => [entity.id, entity])),
    playlistById,
    playlistsByKind,
  };
}

async function loadDatasetFromApi(
  version: string,
  fallbackVersion?: string
): Promise<Dataset> {
  const datasetUrl = `${DATASET_ENDPOINT}?version=${encodeURIComponent(version)}`;
  try {
    const doc = await fetchJson(datasetUrl, DatasetResponseSchema);
    return buildDatasetFromPayloads(
      doc.version,
      doc.manifest,
      doc.schema,
      doc.nodes,
      doc.playlists,
      doc.sources,
      doc.assertions,
      doc.entities
    );
  } catch (error) {
    if (fallbackVersion && fallbackVersion !== version) {
      return loadDatasetFromApi(fallbackVersion);
    }
    throw error;
  }
}

async function loadDatasetFromStatic(
  version: string,
  options?: { basePath?: string; fallbackVersion?: string }
): Promise<Dataset> {
  const basePath = options?.basePath ?? LEGACY_DATA_BASE_PATH;
  const manifestUrl = `${basePath}/${version}/manifest.json`;
  let manifest: Manifest;

  try {
    manifest = await fetchJson(manifestUrl, ManifestSchema);
  } catch (error) {
    const fallback = options?.fallbackVersion;
    if (fallback && fallback !== version) {
      return loadDatasetFromStatic(fallback, options);
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
  const entitiesUrl = manifest.entities
    ? `${basePath}/${version}/${manifest.entities}`
    : undefined;

  const [schemaDoc, nodesDoc, playlistsDoc, sourcesDoc, assertionsDoc, entitiesDoc] =
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
      entitiesUrl
        ? fetchJson(entitiesUrl, EntitiesDocumentSchema)
        : Promise.resolve(undefined),
    ]);

  const datasetVersion = manifest.version ?? version;
  manifest.version = datasetVersion;

  return buildDatasetFromPayloads(
    datasetVersion,
    manifest,
    schemaDoc,
    nodesDoc.nodes,
    playlistsDoc.playlists,
    sourcesDoc?.sources ?? [],
    assertionsDoc?.assertions ?? [],
    entitiesDoc?.entities ?? []
  );
}

export async function loadDataset(
  version: string,
  options?: { basePath?: string; fallbackVersion?: string }
): Promise<Dataset> {
  try {
    return await loadDatasetFromApi(version, options?.fallbackVersion);
  } catch (error) {
    console.warn('Failed to load dataset from API, attempting legacy bundle', error);
    return loadDatasetFromStatic(version, options);
  }
}

export { DatasetError };
