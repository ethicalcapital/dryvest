import { describe, expect, it, vi, afterEach } from 'vitest';
import { onRequest } from '../contact';

describe('contact worker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores submission and forwards to webhook', async () => {
    const kvPut = vi.fn().mockResolvedValue(undefined);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    const env = {
      HOOKS: { put: kvPut },
      LACRM_WEBHOOK_URL: 'https://example.com/hook',
    } as const;

    const payload = {
      name: 'Ali Activist',
      email: 'ali@example.com',
      message: 'Please review the latest divestment scenario.',
      newsletterOptIn: true,
      meta: { identity: 'endowment' },
    };

    const request = new Request('https://dryvest.test/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await onRequest({ request, env } as any);

    expect(response.status).toBe(204);
    expect(kvPut).toHaveBeenCalledTimes(1);
    const [key, storedValue] = kvPut.mock.calls[0];
    expect(key).toMatch(/^submission:/);
    const stored = JSON.parse(storedValue);
    expect(stored).toMatchObject({
      email: 'ali@example.com',
      newsletterOptIn: true,
      meta: { identity: 'endowment' },
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('rejects invalid email addresses', async () => {
    const env = { HOOKS: { put: vi.fn() } } as const;
    const request = new Request('http://test/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Valid message for review.',
        email: 'not-an-email',
      }),
    });

    const response = await onRequest({ request, env } as any);
    expect(response.status).toBe(400);
    expect(env.HOOKS.put).not.toHaveBeenCalled();
  });

  it('enforces minimum message length', async () => {
    const env = { HOOKS: { put: vi.fn() } } as const;
    const request = new Request('http://test/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'too short' }),
    });

    const response = await onRequest({ request, env } as any);
    expect(response.status).toBe(400);
  });
});
