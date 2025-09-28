import { describe, it, expect } from 'vitest';

import { matchesTargets, selectPlaylistByKind, resolvePlaylistNodes } from '../resolve';
import type { BriefContext, Playlist, Node, Dataset } from '../schema';

describe('resolve.ts helpers', () => {
  describe('matchesTargets', () => {
    const context: BriefContext = {
      identity: 'foundation',
      audience: 'boards',
      motivation: 'internal_leadership',
      level: 'plain',
    };

    it('returns true when targets are empty', () => {
      expect(matchesTargets(undefined, context)).toBe(true);
      expect(matchesTargets({}, context)).toBe(true);
    });

    it('returns true when all specified keys match', () => {
      expect(
        matchesTargets(
          {
            identity: ['foundation'],
            audience: ['boards'],
            motivation: ['internal_leadership', 'external_stakeholders'],
          },
          context
        )
      ).toBe(true);
    });

    it('returns false when a required key does not match', () => {
      expect(
        matchesTargets(
          {
            identity: ['foundation'],
            audience: ['staff'],
          },
          context
        )
      ).toBe(false);

      expect(
        matchesTargets(
          {
            identity: ['public_pension'],
          },
          context
        )
      ).toBe(false);
    });
  });

  describe('selectPlaylistByKind / resolvePlaylistNodes', () => {
    const nodes: Node[] = [
      {
        id: 'kp_foundation_example',
        type: 'key_point',
        title: 'Mission alignment is part of prudence',
        body: 'Sample body',
        targets: {
          identity: ['foundation'],
          audience: ['boards'],
        },
      },
      {
        id: 'kp_shared',
        type: 'key_point',
        title: 'Shared key point',
        body: 'Applies broadly',
        targets: {
          identity: ['foundation', 'public_pension'],
          audience: ['boards'],
        },
      },
      {
        id: 'kp_staff_only',
        type: 'key_point',
        title: 'Staff key point',
        body: 'For staff context',
        targets: {
          identity: ['foundation'],
          audience: ['staff'],
        },
      },
    ];

    const playlistBoards: Playlist = {
      id: 'key_points_foundation_boards',
      kind: 'key_points',
      title: 'Boards',
      targets: {
        identity: ['foundation'],
        audience: ['boards'],
      },
      items: [
        { ref: 'kp_foundation_example' },
        { ref: 'kp_shared' },
      ],
    };

    const playlistGeneric: Playlist = {
      id: 'key_points_generic',
      kind: 'key_points',
      title: 'Generic',
      items: [{ ref: 'kp_shared' }],
    };

    const dataset = {
      version: 'test',
      manifest: undefined as any,
      schema: undefined as any,
      nodes,
      playlists: [playlistBoards, playlistGeneric],
      sources: [],
      assertions: [],
      entities: [],
      nodeIndex: Object.fromEntries(nodes.map(node => [node.id, node])),
      sourceIndex: {},
      assertionIndex: {},
      entityIndex: {},
      playlistById: {
        [playlistBoards.id]: playlistBoards,
        [playlistGeneric.id]: playlistGeneric,
      },
      playlistsByKind: {
        key_points: [playlistBoards, playlistGeneric],
      },
    } satisfies Dataset;

    const boardContext: BriefContext = {
      identity: 'foundation',
      audience: 'boards',
      motivation: 'internal_leadership',
    };

    const staffContext: BriefContext = {
      identity: 'foundation',
      audience: 'staff',
    };

    it('selects the most specific playlist for a context', () => {
      const playlist = selectPlaylistByKind(
        dataset.playlistsByKind,
        'key_points',
        boardContext
      );
      expect(playlist?.id).toBe('key_points_foundation_boards');
    });

    it('falls back to generic playlists when necessary', () => {
      const playlist = selectPlaylistByKind(
        dataset.playlistsByKind,
        'key_points',
        staffContext
      );
      expect(playlist?.id).toBe('key_points_generic');
    });

    it('resolves nodes and filters by node targets', () => {
      const playlist = selectPlaylistByKind(
        dataset.playlistsByKind,
        'key_points',
        boardContext
      );
      const nodes = playlist
        ? resolvePlaylistNodes(dataset, playlist, boardContext)
        : [];
      const ids = nodes.map(node => node.id);
      expect(ids).toEqual(['kp_foundation_example', 'kp_shared']);
    });

    it('filters out nodes that do not match the context targets', () => {
      const playlist = selectPlaylistByKind(
        dataset.playlistsByKind,
        'key_points',
        staffContext
      );
      const resolved = playlist
        ? resolvePlaylistNodes(dataset, playlist, staffContext)
        : [];
      const ids = resolved.map(node => node.id);
      expect(ids).toEqual([]);
    });
  });
});
