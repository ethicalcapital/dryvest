interface KVNamespace {
  put(key: string, value: string): Promise<void>;
}

interface Env {
  HOOKS: KVNamespace;
  LACRM_WEBHOOK_URL?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  message: string;
  newsletterOptIn?: boolean;
  meta?: Record<string, unknown>;
}

const MAX_MESSAGE_LENGTH = 5000;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch (error) {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length < 10) {
    return new Response('Message must be at least 10 characters', {
      status: 400,
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response('Message exceeds maximum length', { status: 413 });
  }

  const email = body.email?.trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return new Response('Invalid email format', { status: 400 });
  }

  const submission = {
    name: body.name?.trim() || undefined,
    email: email || undefined,
    message,
    newsletterOptIn: Boolean(body.newsletterOptIn),
    meta: body.meta ?? {},
    receivedAt: new Date().toISOString(),
    clientIp: request.headers.get('cf-connecting-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };

  const storageKey = `submission:${Date.now()}:${crypto.randomUUID()}`;
  await env.HOOKS.put(storageKey, JSON.stringify(submission));

  if (env.LACRM_WEBHOOK_URL) {
    try {
      await fetch(env.LACRM_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Dryvest-Signature': storageKey,
        },
        body: JSON.stringify(submission),
      });
    } catch (error) {
      console.error('Failed to relay contact submission', error);
    }
  }

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
