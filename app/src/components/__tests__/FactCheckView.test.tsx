import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FactCheckView } from '../FactCheckView';
import type { BriefExportData } from '../../lib/exporters';
import type {
  Dataset,
  Manifest,
  Node,
  Playlist,
  SchemaDocument,
} from '../../lib/schema';
import { trackEvent } from '../../lib/analytics';

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const buildNode = <T extends Node>(node: T) => node;

const baseSource = buildNode({
  id: 'src_primary',
  type: 'source',
  label: 'Journal of Institutional Literacy',
  url: 'https://example.com/source',
  citationText: 'Doe, J. (2024). Institutional literacy matters. Journal of Change.',
});

const assertionRecord = {
  id: 'assert_benchmark_grade_exclusions',
  title: 'Benchmark grade exclusions maintain performance',
  statement:
    'NBIM maintains benchmark-like performance after exclusions by rebalancing and controlling factor exposures.',
  evidence: ['src_primary'],
  confidence: 'high' as const,
};

const exportData: BriefExportData = {
  meta: {
    identity: 'endowment',
    audience: 'board',
    level: 'plain',
    playlistId: 'test-playlist',
    datasetVersion: '2025-09-27',
  },
  context: {
    identity: 'endowment',
    audience: 'board',
    level: 'plain',
  },
  opener: buildNode({
    id: 'opener-1',
    type: 'opener',
    text: 'Start with the fiduciary guardrails briefing.',
  }),
  guide: buildNode({
    id: 'guide-1',
    type: 'guide',
    sections: {
      ask: 'Frame the screening upgrade as risk management.',
      implementation: 'Adopt exclusions in line with NBIM process.',
      reporting: 'Quarterly dashboards with variance commentary.',
      risk: 'Tracking error budget capped at 1.5%.',
    },
  }),
  keyPoints: [
    buildNode({
      id: 'kp-1',
      type: 'key_point',
      title: 'Benchmark-grade implementation exists',
      body: 'NBIM and PFZW maintain benchmark-like performance while enforcing exclusions.',
      citations: ['src_primary'],
    }),
  ],
  nextSteps: [
    buildNode({
      id: 'ns-1',
      type: 'next_step',
      text: 'Draft policy amendment referencing NBIM guidance.',
    }),
  ],
  screeningNode: buildNode({
    id: 'screen-1',
    type: 'policy_statement',
    body: 'Adopt staged exclusions with annual variance review.',
  }),
  policyAlignment: buildNode({
    id: 'policy-1',
    type: 'policy_statement',
    bullets: ['Matches existing IPS risk budget.'],
    citations: ['src_primary'],
  }),
  templates: [
    buildNode({
      id: 'template-1',
      type: 'template_snippet',
      title: 'Board email opener',
      lines: ['Sharing Dryvest benchmarking pack…'],
    }),
  ],
  selectedOnePagers: [
    buildNode({
      id: 'doc-1',
      type: 'one_pager',
      title: 'Fiduciary guardrails',
      description: 'Checklist outlining staged exclusions.',
      markdownPath: 'content/fiduciary_guardrails.md',
    }),
  ],
  sources: [baseSource],
  sourceLookup: { src_primary: baseSource },
  assertions: [assertionRecord],
  assertionLookup: { assert_benchmark_grade_exclusions: assertionRecord },
};

const manifest: Manifest = {
  version: '2025-09-27',
  schema: 'schema.json',
  nodes: 'nodes.json',
  playlists: 'playlists.json',
  sources: 'sources.json',
};

const schemaDoc: SchemaDocument = {
  version: '2025-09-27',
  createdAt: '2025-09-27T00:00:00.000Z',
  taxonomies: {
    identity: ['endowment'],
    audience: ['board'],
    level: ['plain'],
  },
};

const playlist: Playlist = {
  id: 'test-playlist',
  kind: 'key_points',
  title: 'Test Key Points',
  items: [{ ref: 'kp-1' }],
};

const nextStepsPlaylist: Playlist = {
  id: 'test-next-steps',
  kind: 'next_steps',
  title: 'Test Next Steps',
  items: [{ ref: 'ns-1' }],
};

const nodes: Node[] = [
  exportData.opener!,
  exportData.guide!,
  exportData.keyPoints[0],
  exportData.nextSteps[0],
  exportData.screeningNode!,
  exportData.policyAlignment!,
  exportData.templates[0],
];

nodes.forEach(node => {
  if (!node.targets) {
    node.targets = {
      identity: ['endowment'],
      audience: ['board'],
    };
  }
});

const dataset: Dataset = {
  version: '2025-09-27',
  manifest,
  schema: schemaDoc,
  nodes,
  playlists: [playlist, nextStepsPlaylist],
  sources: [baseSource],
  assertions: [assertionRecord],
  entities: [],
  nodeIndex: Object.fromEntries(nodes.map(node => [node.id, node])),
  sourceIndex: { src_primary: baseSource },
  assertionIndex: { assert_benchmark_grade_exclusions: assertionRecord },
  entityIndex: {},
  playlistById: {
    'test-playlist': playlist,
    'test-next-steps': nextStepsPlaylist,
  },
  playlistsByKind: {
    key_points: [playlist],
    next_steps: [nextStepsPlaylist],
  },
};

let originalClipboard: Clipboard | undefined;
let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;
let clickSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeAll(() => {
  originalClipboard = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => 'blob:fact-check');
  URL.revokeObjectURL = vi.fn();
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  clickSpy?.mockRestore();
});

describe('FactCheckView', () => {
  it('renders fact check workspace summary', () => {
    render(
      <FactCheckView
        dataset={dataset}
        context={exportData.context}
        exportData={exportData}
      />
    );

    expect(screen.getByText(/fact check workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/key points \(active\)/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/next steps \(active\)/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/unique sources \(active\)/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/assertions linked \(active\)/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/contexts covered/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/view fact-check output/i)).toBeInTheDocument();
  });

  it('copies the report to clipboard and records analytics', async () => {
    render(
      <FactCheckView
        dataset={dataset}
        context={exportData.context}
        exportData={exportData}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /copy fact-check bundle/i })
    );

    const clipboardMock = navigator.clipboard as unknown as { writeText: ReturnType<typeof vi.fn> };
    expect(clipboardMock.writeText).toHaveBeenCalledTimes(1);
    expect(clipboardMock.writeText.mock.calls[0][0]).toContain('KEY_POINT_1');
    expect(trackEvent).toHaveBeenCalledWith('copy_clicked', {
      format: 'fact-check',
      contexts: 1,
    });
  });

  it('downloads the report as text and records analytics', async () => {
    render(
      <FactCheckView
        dataset={dataset}
        context={exportData.context}
        exportData={exportData}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /download .txt/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('download_clicked', {
      format: 'fact-check',
      datasetVersion: '2025-09-27',
      contexts: 1,
    });
  });
});

afterAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: originalClipboard,
    configurable: true,
  });
});
