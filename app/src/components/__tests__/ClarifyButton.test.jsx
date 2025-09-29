import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClarifyButton from '../ClarifyButton.jsx';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ summary: 'Plain-language summary' }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('clarify button requests summary and renders the response', async () => {
  render(<ClarifyButton text="Example text" mode="fact" />);

  const button = screen.getByRole('button', { name: /explain/i });
  fireEvent.click(button);

  expect(screen.getByText(/working/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Plain-language summary')).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith(
    '/api/clarify',
    expect.objectContaining({ method: 'POST' })
  );
});
