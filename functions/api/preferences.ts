interface KVNamespace {
  put(key: string, value: string): Promise<void>;
}

interface Env {
  HOOKS: KVNamespace;
}

interface PreferencePayload {
  analyticsConsent: boolean;
  mailingOptIn: boolean;
  email?: string;
  meta?: Record<string, unknown>;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: PreferencePayload;
  try {
    payload = (await request.json()) as PreferencePayload;
  } catch (error) {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  if (typeof payload.analyticsConsent !== 'boolean') {
    return new Response('analyticsConsent must be boolean', { status: 400 });
  }

  if (typeof payload.mailingOptIn !== 'boolean') {
    return new Response('mailingOptIn must be boolean', { status: 400 });
  }

  const email = payload.email?.trim();
  if (payload.mailingOptIn) {
    if (!email) {
      return new Response('Email is required for mailing list opt-in', {
        status: 400,
      });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return new Response('Invalid email format', { status: 400 });
    }
  }

  const record = {
    analyticsConsent: payload.analyticsConsent,
    mailingOptIn: payload.mailingOptIn,
    email: email ?? undefined,
    meta: payload.meta ?? {},
    receivedAt: new Date().toISOString(),
    clientIp: request.headers.get('cf-connecting-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };

  const key = `preferences:${Date.now()}:${crypto.randomUUID()}`;
  await env.HOOKS.put(key, JSON.stringify(record));

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
