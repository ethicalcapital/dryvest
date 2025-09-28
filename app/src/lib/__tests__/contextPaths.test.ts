import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  NodesDocumentSchema,
  PlaylistsDocumentSchema,
  SchemaDocumentSchema,
  ManifestSchema,
  SourcesDocumentSchema,
  AssertionsDocumentSchema,
  EntitiesDocumentSchema,
} from '../schema';
import type {
  Dataset,
  Node,
  Playlist,
  BriefContext,
} from '../schema';
import {
  matchesTargets,
  resolvePlaylistNodes,
  selectPlaylistByKind,
} from '../resolve';

type Kind = 'key_points' | 'next_steps' | 'counters';

type CoverageExpectation = {
  name: string;
  context: BriefContext;
  minimum: {
    keyPoints: number;
    nextSteps: number;
    counters: number;
    templates: number;
  };
};

type ContextComparison = {
  lhs: { name: string; context: BriefContext };
  rhs: { name: string; context: BriefContext };
  maxJaccard: number;
};

let dataset: Dataset;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDatasetFixture(version: string): Dataset {
  const baseDir = path.resolve(__dirname, '../../../public/data', version);
  const manifest = ManifestSchema.parse(
    JSON.parse(readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'))
  );

  const schemaDoc = SchemaDocumentSchema.parse(
    JSON.parse(readFileSync(path.join(baseDir, manifest.schema), 'utf8'))
  );
  const nodesDoc = NodesDocumentSchema.parse(
    JSON.parse(readFileSync(path.join(baseDir, manifest.nodes), 'utf8'))
  );
  const playlistsDoc = PlaylistsDocumentSchema.parse(
    JSON.parse(readFileSync(path.join(baseDir, manifest.playlists), 'utf8'))
  );

  const sourcesDoc = manifest.sources
    ? SourcesDocumentSchema.parse(
        JSON.parse(readFileSync(path.join(baseDir, manifest.sources), 'utf8'))
      )
    : { sources: [] };
  const assertionsDoc = manifest.assertions
    ? AssertionsDocumentSchema.parse(
        JSON.parse(readFileSync(path.join(baseDir, manifest.assertions), 'utf8'))
      )
    : { assertions: [] };
  const entitiesDoc = manifest.entities
    ? EntitiesDocumentSchema.parse(
        JSON.parse(readFileSync(path.join(baseDir, manifest.entities), 'utf8'))
      )
    : { entities: [] };

  const filteredNodes = nodesDoc.nodes.filter(node => node.type !== 'source');
  const nodeIndex = Object.fromEntries(filteredNodes.map(node => [node.id, node]));
  const playlistById = Object.fromEntries(
    playlistsDoc.playlists.map(playlist => [playlist.id, playlist])
  );
  const playlistsByKind = playlistsDoc.playlists.reduce(
    (acc, playlist) => {
      (acc[playlist.kind] ??= []).push(playlist);
      return acc;
    },
    {} as Record<string, Playlist[]>
  );

  return {
    version: manifest.version ?? version,
    manifest,
    schema: schemaDoc,
    nodes: filteredNodes,
    playlists: playlistsDoc.playlists,
    sources: sourcesDoc.sources,
    assertions: assertionsDoc.assertions,
    entities: entitiesDoc.entities,
    nodeIndex,
    sourceIndex: Object.fromEntries(
      sourcesDoc.sources.map(source => [source.id, source])
    ),
    assertionIndex: Object.fromEntries(
      assertionsDoc.assertions.map(assertion => [assertion.id, assertion])
    ),
    entityIndex: Object.fromEntries(
      entitiesDoc.entities.map(entity => [entity.id, entity])
    ),
    playlistById,
    playlistsByKind,
  } satisfies Dataset;
}

function getNodesForKind(kind: Kind, context: BriefContext): Node[] {
  const playlist = selectPlaylistByKind(dataset.playlistsByKind, kind, context);
  if (!playlist) return [];
  const nodes = resolvePlaylistNodes(dataset, playlist, context);
  const expectedType =
    kind === 'key_points'
      ? 'key_point'
      : kind === 'next_steps'
      ? 'next_step'
      : 'counter';
  return nodes.filter(node => node.type === expectedType);
}

function getTemplates(context: BriefContext): Node[] {
  return dataset.nodes.filter(
    node => node.type === 'template_snippet' && matchesTargets(node.targets, context)
  );
}

function uniqueIds(nodes: Node[]): string[] {
  return Array.from(new Set(nodes.map(node => node.id))).sort();
}

function jaccard(lhs: string[], rhs: string[]): number {
  const setA = new Set(lhs);
  const setB = new Set(rhs);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const value of setA) {
    if (setB.has(value)) {
      intersection += 1;
    }
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

const coverageExpectations: CoverageExpectation[] = [
  {
    name: 'Foundation board – internal leadership',
    context: {
      identity: 'foundation',
      audience: 'boards',
      motivation: 'internal_leadership',
      level: 'plain',
    },
    minimum: { keyPoints: 4, nextSteps: 1, counters: 1, templates: 1 },
  },
  {
    name: 'Foundation staff – internal leadership',
    context: {
      identity: 'foundation',
      audience: 'staff',
      motivation: 'internal_leadership',
      level: 'technical',
    },
    minimum: { keyPoints: 3, nextSteps: 2, counters: 1, templates: 1 },
  },
  {
    name: 'Public pension board – regulatory drivers (committee hearing)',
    context: {
      identity: 'public_pension',
      audience: 'boards',
      motivation: 'regulatory_drivers',
      level: 'technical',
      venue: 'committee_hearing',
    },
    minimum: { keyPoints: 6, nextSteps: 1, counters: 2, templates: 1 },
  },
  {
    name: 'Public pension staff – regulatory drivers',
    context: {
      identity: 'public_pension',
      audience: 'staff',
      motivation: 'regulatory_drivers',
      level: 'technical',
    },
    minimum: { keyPoints: 4, nextSteps: 2, counters: 1, templates: 1 },
  },
  {
    name: 'Policy scaffold scenario – public pension board',
    context: {
      identity: 'public_pension',
      audience: 'boards',
      motivation: 'regulatory_drivers',
      level: 'technical',
      venue: 'full_board_meeting',
    },
    minimum: { keyPoints: 4, nextSteps: 0, counters: 0, templates: 1 },
  },
];

const comparisonExpectations: ContextComparison[] = [
  {
    lhs: {
      name: 'Foundation board',
      context: {
        identity: 'foundation',
        audience: 'boards',
        motivation: 'internal_leadership',
        level: 'plain',
      },
    },
    rhs: {
      name: 'Public pension board',
      context: {
        identity: 'public_pension',
        audience: 'boards',
        motivation: 'regulatory_drivers',
        level: 'technical',
        venue: 'committee_hearing',
      },
    },
    maxJaccard: 0.4,
  },
  {
    lhs: {
      name: 'Public pension board (committee hearing)',
      context: {
        identity: 'public_pension',
        audience: 'boards',
        motivation: 'regulatory_drivers',
        level: 'technical',
        venue: 'committee_hearing',
      },
    },
    rhs: {
      name: 'Policy scaffold board (full board meeting)',
      context: {
        identity: 'public_pension',
        audience: 'boards',
        motivation: 'regulatory_drivers',
        level: 'technical',
        venue: 'full_board_meeting',
      },
    },
    maxJaccard: 0.4,
  },
  {
    lhs: {
      name: 'Foundation board',
      context: {
        identity: 'foundation',
        audience: 'boards',
        motivation: 'internal_leadership',
        level: 'plain',
      },
    },
    rhs: {
      name: 'Foundation staff',
      context: {
        identity: 'foundation',
        audience: 'staff',
        motivation: 'internal_leadership',
        level: 'technical',
      },
    },
    maxJaccard: 0.9,
  },
];

function getKeyPointIds(context: BriefContext): string[] {
  return uniqueIds(getNodesForKind('key_points', context));
}

beforeAll(() => {
  dataset = loadDatasetFixture('2025-09-27');
});

describe('Context coverage', () => {
  coverageExpectations.forEach(({ name, context, minimum }) => {
    it(`${name} has sufficient content`, () => {
      const keyPoints = getNodesForKind('key_points', context);
      const nextSteps = getNodesForKind('next_steps', context);
      const counters = getNodesForKind('counters', context);
      const templates = getTemplates(context);

      expect(keyPoints.length).toBeGreaterThanOrEqual(minimum.keyPoints);
      expect(nextSteps.length).toBeGreaterThanOrEqual(minimum.nextSteps);
      expect(counters.length).toBeGreaterThanOrEqual(minimum.counters);
      expect(templates.length).toBeGreaterThanOrEqual(minimum.templates);
    });
  });
});

describe('Path similarity checks', () => {
  comparisonExpectations.forEach(({ lhs, rhs, maxJaccard }) => {
    it(`${lhs.name} vs ${rhs.name} key point overlap ≤ ${Math.round(
      maxJaccard * 100
    )}%`, () => {
      const lhsIds = getKeyPointIds(lhs.context);
      const rhsIds = getKeyPointIds(rhs.context);
      const similarity = jaccard(lhsIds, rhsIds);
      expect(similarity).toBeLessThanOrEqual(maxJaccard);
    });
  });
});

describe('Snapshot coverage for signature contexts', () => {
  it('Foundation board key points snapshot', () => {
    expect(
      getKeyPointIds({
        identity: 'foundation',
        audience: 'boards',
        motivation: 'internal_leadership',
        level: 'plain',
      })
    ).toMatchSnapshot();
  });

  it('Public pension board (committee hearing) key points snapshot', () => {
    expect(
      getKeyPointIds({
        identity: 'public_pension',
        audience: 'boards',
        motivation: 'regulatory_drivers',
        level: 'technical',
        venue: 'committee_hearing',
      })
    ).toMatchSnapshot();
  });

  it('Policy scaffold board key points snapshot', () => {
    expect(
      getKeyPointIds({
        identity: 'public_pension',
        audience: 'boards',
        motivation: 'regulatory_drivers',
        level: 'technical',
        venue: 'full_board_meeting',
      })
    ).toMatchSnapshot();
  });
});
