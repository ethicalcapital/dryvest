import { z } from 'zod';
import {
  ManifestSchema,
  NodesDocumentSchema,
  PlaylistsDocumentSchema,
  SchemaDocumentSchema,
} from './schema';
import type { Dataset, Manifest, SchemaDocument } from './schema';

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
    throw new DatasetError(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    throw new DatasetError(`Failed to parse JSON from ${url}`, error);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new DatasetError(`Validation failed for ${url}: ${parsed.error.message}`);
  }
  return parsed.data;
}

function indexPlaylists(datasetVersion: string, manifestVersion: string, data: SchemaDocument): void {
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
  playlistsDoc: z.infer<typeof PlaylistsDocumentSchema>
): Dataset {
  indexPlaylists(nodesDoc.version, manifest.version, schemaDoc);

  const nodeIndex = Object.fromEntries(nodesDoc.nodes.map((node) => [node.id, node]));
  const playlistById = Object.fromEntries(playlistsDoc.playlists.map((playlist) => [playlist.id, playlist]));
  const playlistsByKind = playlistsDoc.playlists.reduce<Record<string, typeof playlistsDoc.playlists>>(
    (acc, playlist) => {
      if (!acc[playlist.kind]) {
        acc[playlist.kind] = [];
      }
      acc[playlist.kind].push(playlist);
      return acc;
    },
    {}
  );

  return {
    version: manifest.version,
    manifest,
    schema: schemaDoc,
    nodes: nodesDoc.nodes,
    playlists: playlistsDoc.playlists,
    nodeIndex,
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

  try {
    const [schemaDoc, nodesDoc, playlistsDoc] = await Promise.all([
      fetchJson(schemaUrl, SchemaDocumentSchema),
      fetchJson(nodesUrl, NodesDocumentSchema),
      fetchJson(playlistsUrl, PlaylistsDocumentSchema),
    ]);

    return buildDataset(manifest, schemaDoc, nodesDoc, playlistsDoc);
  } catch (error) {
    if (manifest.fallbackVersion && manifest.fallbackVersion !== version) {
      return loadDataset(manifest.fallbackVersion, options);
    }
    throw error;
  }
}

export { DatasetError };
