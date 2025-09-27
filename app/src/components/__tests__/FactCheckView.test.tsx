import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FactCheckView } from '../FactCheckView';
import type { BriefExportData } from '../../lib/exporters';
import type { Node } from '../../lib/schema';
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

const exportData: BriefExportData = {
  meta: {
    identity: 'endowment',
    audience: 'board',
    venue: 'board_meeting',
    level: 'plain',
    playlistId: 'test-playlist',
    datasetVersion: '2025-09-25',
  },
  context: {
    identity: 'endowment',
    audience: 'board',
    venue: 'board_meeting',
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
  venueSnippet: buildNode({
    id: 'venue-1',
    type: 'template_snippet',
    title: 'Board cues',
    lines: ['Lead with audit committee precedent.'],
  }),
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
    render(<FactCheckView exportData={exportData} />);

    expect(screen.getByText(/fact check workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/key points/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/next steps/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/unique sources/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/fact check package/i)).toBeInTheDocument();
  });

  it('copies the report to clipboard and records analytics', async () => {
    render(<FactCheckView exportData={exportData} />);

    await userEvent.click(screen.getByRole('button', { name: /copy fact-check report/i }));

    const clipboardMock = navigator.clipboard as unknown as { writeText: ReturnType<typeof vi.fn> };
    expect(clipboardMock.writeText).toHaveBeenCalledTimes(1);
    expect(clipboardMock.writeText.mock.calls[0][0]).toContain('KEY_POINT_1');
    expect(trackEvent).toHaveBeenCalledWith('copy_clicked', { format: 'fact-check' });
  });

  it('downloads the report as text and records analytics', async () => {
    render(<FactCheckView exportData={exportData} />);

    await userEvent.click(screen.getByRole('button', { name: /download .txt/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('download_clicked', {
      format: 'fact-check',
      datasetVersion: '2025-09-25',
    });
  });
});

afterAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: originalClipboard,
    configurable: true,
  });
});
