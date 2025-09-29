import { DEFAULT_DATASET_VERSION } from '../../legacy/app-classic/src/lib/constants';
import type { BriefContext } from '../../legacy/app-classic/src/lib/schema';
import { buildFactCheckReport } from '../../legacy/app-classic/src/lib/factCheck';
import {
  buildExportForContext,
  contextKey,
  enumerateContexts,
  hasContent,
} from '../../legacy/app-classic/src/lib/factCheckBundle';

type NodeRecord = Record<string, unknown>;
type PlaylistRecord = {
  id: string;
  kind: string;
  items: Array<{ ref: string; overrides?: unknown; conditions?: unknown }>;
  targets?: Record<string, unknown>;
};
type SourceRecord = Record<string, unknown> & { id: string };
type AssertionRecord = Record<string, unknown> & { id: string };
type EntityProfile = Record<string, unknown> & { id: string };

interface ManifestPayload {
  version?: string;
  schema: string;
  nodes: string;
  playlists: string;
  sources?: string;
  assertions?: string;
  entities?: string;
  fallbackVersion?: string;
}

interface NodesDocumentPayload {
  nodes: NodeRecord[];
}

interface PlaylistsDocumentPayload {
  playlists: PlaylistRecord[];
}

interface SourcesDocumentPayload {
  sources: SourceRecord[];
}

interface AssertionsDocumentPayload {
  assertions: AssertionRecord[];
}

interface EntitiesDocumentPayload {
  entities: EntityProfile[];
}

interface Dataset {
  version: string;
  manifest: ManifestPayload;
  schema: Record<string, unknown>;
  nodes: NodeRecord[];
  playlists: PlaylistRecord[];
  sources: SourceRecord[];
  assertions: AssertionRecord[];
  entities: EntityProfile[];
  nodeIndex: Record<string, NodeRecord>;
  sourceIndex: Record<string, SourceRecord>;
  assertionIndex: Record<string, AssertionRecord>;
  entityIndex: Record<string, EntityProfile>;
  playlistById: Record<string, PlaylistRecord>;
  playlistsByKind: Record<string, PlaylistRecord[]>;
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function buildDataset(
  datasetVersion: string,
  manifest: ManifestPayload,
  schemaDoc: Record<string, unknown>,
  nodeDoc: NodesDocumentPayload,
  playlistDoc: PlaylistsDocumentPayload,
  sourcesDoc?: SourcesDocumentPayload,
  assertionsDoc?: AssertionsDocumentPayload,
  entitiesDoc?: EntitiesDocumentPayload
): Dataset {
  const nodes = Array.isArray(nodeDoc?.nodes) ? nodeDoc.nodes : [];
  const playlists = Array.isArray(playlistDoc?.playlists) ? playlistDoc.playlists : [];
  const sources = Array.isArray(sourcesDoc?.sources) ? sourcesDoc!.sources : [];
  const assertions = Array.isArray(assertionsDoc?.assertions) ? assertionsDoc!.assertions : [];
  const entities = Array.isArray(entitiesDoc?.entities) ? entitiesDoc!.entities : [];

  const nodeIndex = Object.fromEntries(nodes.map((node) => [String(node.id), node]));
  const sourceIndex = Object.fromEntries(sources.map((source) => [String(source.id), source]));
  const assertionIndex = Object.fromEntries(assertions.map((assertion) => [String(assertion.id), assertion]));
  const entityIndex = Object.fromEntries(entities.map((entity) => [String(entity.id), entity]));
  const playlistById = Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist]));
  const playlistsByKind = playlists.reduce<Record<string, PlaylistRecord[]>>((acc, playlist) => {
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
    nodes,
    playlists,
    sources,
    assertions,
    entities,
    nodeIndex,
    sourceIndex,
    assertionIndex,
    entityIndex,
    playlistById,
    playlistsByKind,
  };
}

async function loadDataset(
  version: string,
  options?: { basePath?: string; fallbackVersion?: string }
): Promise<Dataset> {
  const basePath = options?.basePath ?? '/data';
  const manifestUrl = `${basePath}/${version}/manifest.json`;

  let manifest: ManifestPayload;
  try {
    manifest = await fetchJson<ManifestPayload>(manifestUrl);
  } catch (error) {
    const fallback = options?.fallbackVersion;
    if (fallback && fallback !== version) {
      return loadDataset(fallback, options);
    }
    throw error;
  }

  const schemaPromise = fetchJson<Record<string, unknown>>(`${basePath}/${version}/${manifest.schema}`);
  const nodesPromise = fetchJson<NodesDocumentPayload>(`${basePath}/${version}/${manifest.nodes}`);
  const playlistsPromise = fetchJson<PlaylistsDocumentPayload>(`${basePath}/${version}/${manifest.playlists}`);
  const sourcesPromise = manifest.sources
    ? fetchJson<SourcesDocumentPayload>(`${basePath}/${version}/${manifest.sources}`)
    : Promise.resolve<SourcesDocumentPayload | undefined>(undefined);
  const assertionsPromise = manifest.assertions
    ? fetchJson<AssertionsDocumentPayload>(`${basePath}/${version}/${manifest.assertions}`)
    : Promise.resolve<AssertionsDocumentPayload | undefined>(undefined);
  const entitiesPromise = manifest.entities
    ? fetchJson<EntitiesDocumentPayload>(`${basePath}/${version}/${manifest.entities}`)
    : Promise.resolve<EntitiesDocumentPayload | undefined>(undefined);

  const [schemaDoc, nodesDoc, playlistsDoc, sourcesDoc, assertionsDoc, entitiesDoc] = await Promise.all([
    schemaPromise,
    nodesPromise,
    playlistsPromise,
    sourcesPromise,
    assertionsPromise,
    entitiesPromise,
  ]);

  const datasetVersion = manifest.version ?? version;
  manifest.version = datasetVersion;

  return buildDataset(
    datasetVersion,
    manifest,
    schemaDoc,
    nodesDoc,
    playlistsDoc,
    sourcesDoc,
    assertionsDoc,
    entitiesDoc
  );
}

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const version = url.searchParams.get('version') ?? DEFAULT_DATASET_VERSION;
  const identity = url.searchParams.get('identity') ?? undefined;
  const audience = url.searchParams.get('audience') ?? undefined;
  const level = url.searchParams.get('level') ?? undefined;

  try {
    const basePath = `${url.origin}/data`;
    const dataset = await loadDataset(version, { basePath });

    const contexts = determineContexts(dataset, {
      identity,
      audience,
      level,
    });

    const reports = contexts
      .map(ctx => {
        const exportData = buildExportForContext(dataset, ctx);
        if (!hasContent(exportData)) return null;
        return buildFactCheckReport(exportData);
      })
      .filter((output): output is string => Boolean(output));

    if (!reports.length) {
      return new Response('No fact-check outputs available for the requested parameters.', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const body = reports.join('\n\n---\n\n');
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to build fact-check output', error);
    return new Response('Unable to generate fact-check output.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
};

const determineContexts = (
  dataset: Dataset,
  params: Partial<BriefContext>
): BriefContext[] => {
  if (params.identity) {
    const context: BriefContext = {
      identity: params.identity,
      level: params.level ?? dataset.schema?.taxonomies?.level?.[0] ?? 'plain',
    };
    if (params.audience) context.audience = params.audience;
    return [context];
  }

  return enumerateContexts(dataset);
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
