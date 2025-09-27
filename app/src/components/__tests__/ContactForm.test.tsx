import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContactForm } from '../ContactForm';
import type { BriefParams } from '../../hooks/useBriefParams';
import type { BriefTone } from '../../lib/exporters';
import { trackEvent } from '../../lib/analytics';

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

type FetchMock = ReturnType<typeof vi.fn>;

const baseParams: BriefParams = {
  identity: 'endowment',
  audience: 'investment_committee',
  venue: 'board_meeting',
  level: 'plain',
  playlist: 'default',
};

const renderForm = (overrides?: {
  params?: Partial<BriefParams>;
  tone?: BriefTone;
  datasetVersion?: string;
  attachmentCount?: number;
}) => {
  const { params, tone, datasetVersion, attachmentCount } = overrides ?? {};
  return render(
    <ContactForm
      params={{ ...baseParams, ...(params ?? {}) }}
      tone={tone ?? 'plain'}
      datasetVersion={datasetVersion ?? '2025-09-27'}
      attachmentCount={attachmentCount ?? 2}
    />
  );
};

const getSubmitButton = () => screen.getByRole('button', { name: /send/i });

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  vi.clearAllMocks();
  global.fetch = originalFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('ContactForm', () => {
  it('disables submit until message meets minimum length', () => {
    renderForm();

    const submit = getSubmitButton();
    expect(submit).toBeDisabled();

    const messageField = screen.getByLabelText(/what do you need/i);
    userEvent.type(messageField, 'short');
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submits payload and shows success state', async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const user = userEvent.setup();

    renderForm();

    await user.type(screen.getByLabelText(/name/i), ' Ali Activist ');
    await user.type(
      screen.getByLabelText(/email/i),
      'team@ethicalcapital.com'
    );
    await user.type(
      screen.getByLabelText(/what do you need/i),
      'Please review the sovereign wealth exclusions update.'
    );
    await user.click(screen.getByText(/send me the ethical capital briefing list/i));

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const fetchArgs = fetchMock.mock.calls[0];
    expect(fetchArgs[0]).toBe('/api/contact');
    const body = JSON.parse(fetchArgs[1].body as string);
    expect(body).toMatchObject({
      email: 'team@ethicalcapital.com',
      newsletterOptIn: true,
      message: expect.stringContaining('sovereign wealth exclusions'),
      meta: expect.objectContaining({ attachments: 2, tone: 'plain' }),
    });

    await waitFor(() => {
      expect(screen.getByText(/received—thank you/i)).toBeInTheDocument();
      expect(trackEvent).toHaveBeenCalledWith('contact_submitted', {
        newsletterOptIn: true,
        datasetVersion: '2025-09-27',
      });
    });

    expect(screen.getByLabelText(/what do you need/i)).toHaveValue('');

  });

  it('shows an error when submission fails', async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockRejectedValue(new Error('network unreachable'));
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const user = userEvent.setup();

    renderForm();

    await user.type(
      screen.getByLabelText(/what do you need/i),
      'Please audit the NABERS exposure data.'
    );

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/network unreachable/i)).toBeInTheDocument();
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
