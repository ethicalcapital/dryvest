import {
  onRequest as handleEvents,
  DryvestAnalyticsDO,
} from './functions/api/events';
import {
  onRequest as handleContact,
  onRequestOptions as handleContactOptions,
} from './functions/api/contact';
import {
  onRequest as handlePreferences,
  onRequestOptions as handlePreferencesOptions,
} from './functions/api/preferences';
import { onRequest as handleFactCheck, onRequestOptions as handleFactCheckOptions } from './functions/api/fact-check';
import { onRequest as handlePdf } from './functions/api/generate-pdf';
import {
  onRequest as handleDataset,
  onRequestOptions as handleDatasetOptions,
} from './functions/api/dataset';

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export { DryvestAnalyticsDO };

type PagesFunctionHandler<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  data: Record<string, unknown>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}) => Response | Promise<Response>;

type Route = {
  pattern: RegExp;
  methods: string[];
  handler: PagesFunctionHandler;
};

const handleAutoragSearch: PagesFunctionHandler = async ({ request, env }) => {
  try {
    const aiBinding = (env as Record<string, any>).AI;
    if (!aiBinding || typeof aiBinding.autorag !== 'function') {
      return new Response(
        JSON.stringify({ error: 'AI binding not configured on this worker.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let query = '';
    if (request.method === 'POST') {
      const json = await request.json().catch(() => null);
      query = typeof json?.query === 'string' ? json.query.trim() : '';
    } else {
      const url = new URL(request.url);
      query = url.searchParams.get('query')?.trim() ?? '';
    }

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Provide a query string.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rag = aiBinding.autorag('autumn-scene-316c');
    const answer = await rag.aiSearch({ query });

    return new Response(JSON.stringify({ query, answer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

const routes: Route[] = [
  {
    pattern: /^\/api\/events(?:\/.*)?$/,
    methods: ['GET', 'POST', 'OPTIONS'],
    handler: handleEvents,
  },
  {
    pattern: /^\/api\/contact$/,
    methods: ['POST'],
    handler: handleContact,
  },
  {
    pattern: /^\/api\/contact$/,
    methods: ['OPTIONS'],
    handler: handleContactOptions,
  },
  {
    pattern: /^\/api\/preferences$/,
    methods: ['POST'],
    handler: handlePreferences,
  },
  {
    pattern: /^\/api\/preferences$/,
    methods: ['OPTIONS'],
    handler: handlePreferencesOptions,
  },
  {
    pattern: /^\/api\/dataset$/,
    methods: ['GET'],
    handler: handleDataset,
  },
  {
    pattern: /^\/api\/dataset$/,
    methods: ['OPTIONS'],
    handler: handleDatasetOptions,
  },
  {
    pattern: /^\/api\/fact-check$/,
    methods: ['GET'],
    handler: handleFactCheck,
  },
  {
    pattern: /^\/api\/fact-check$/,
    methods: ['OPTIONS'],
    handler: handleFactCheckOptions,
  },
  {
    pattern: /^\/api\/generate-pdf$/,
    methods: ['POST'],
    handler: handlePdf,
  },
  {
    pattern: /^\/api\/generate-pdf$/,
    methods: ['OPTIONS'],
    handler: async () =>
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }),
  },
  {
    pattern: /^\/api\/autorag$/,
    methods: ['GET', 'POST'],
    handler: handleAutoragSearch,
  },
  {
    pattern: /^\/api\/autorag$/,
    methods: ['OPTIONS'],
    handler: async () =>
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }),
  },
  {
    pattern: /^\/api\/autorag\/bucket$/,
    methods: ['GET'],
    handler: async ({ request, env }) => {
      const r2 = (env as Record<string, unknown>).DRYVEST_R2 as any;
      if (!r2) {
        return new Response(JSON.stringify({ error: 'R2 binding DRYVEST_R2 not configured.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const url = new URL(request.url);
      const key = url.searchParams.get('key');
      try {
        if (!key) {
          const cursor = url.searchParams.get('cursor') || undefined;
          const limitParam = url.searchParams.get('limit');
          const limit = limitParam ? Number(limitParam) : undefined;
          const listing = await r2.list({ cursor, limit });
          return new Response(
            JSON.stringify({
              objects: listing.objects.map((obj) => ({
                key: obj.key,
                size: obj.size,
                uploaded: obj.uploaded,
                etag: obj.httpEtag,
                contentType: obj.httpMetadata?.contentType ?? null,
              })),
              truncated: listing.truncated,
              cursor: listing.cursor ?? null,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          );
        }

        const object = await r2.get(key, { rangeHeader: request.headers.get('Range') ?? undefined });
        if (!object) {
          return new Response(JSON.stringify({ error: 'Object not found', key }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const body = await object.text();
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': object.httpMetadata?.contentType ?? 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: (error as Error).message ?? 'Unknown error', key }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    },
  },
  {
    pattern: /^\/api\/autorag\/bucket$/,
    methods: ['OPTIONS'],
    handler: async () =>
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }),
  },
];

const runPagesFunction = async (
  handler: PagesFunctionHandler,
  request: Request,
  env: Record<string, unknown>,
  ctx: ExecutionContext
): Promise<Response> => {
  const next = async (input?: Request | string, init?: RequestInit) => {
    const targetRequest = input instanceof Request ? input : new Request(input ?? request, init);
    const assets = env.ASSETS as Fetcher;
    return assets.fetch(targetRequest);
  };

  const context = {
    request,
    env,
    params: {} as Record<string, string>,
    data: {},
    next,
    waitUntil: ctx.waitUntil.bind(ctx),
    passThroughOnException: ctx.passThroughOnException.bind(ctx),
  };

  return handler(context);
};

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    for (const route of routes) {
      if (route.pattern.test(url.pathname) && route.methods.includes(method)) {
        return runPagesFunction(route.handler, request, env, ctx);
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const assets = env.ASSETS as Fetcher;
    const assetUrl = new URL(request.url);

    if (assetUrl.pathname.startsWith('/assets/')) {
      assetUrl.pathname = `/client${assetUrl.pathname}`;
    } else if (
      assetUrl.pathname === '/favicon.svg' ||
      assetUrl.pathname === '/site.webmanifest' ||
      assetUrl.pathname === '/ecic-logo.svg'
    ) {
      assetUrl.pathname = `/client${assetUrl.pathname}`;
    }

    let response = await assets.fetch(new Request(assetUrl.toString(), request));

    if (response.status === 404 && request.method === 'GET') {
      const accept = request.headers.get('accept') ?? '';
      const isHtml = accept.includes('text/html');
      const isAsset = url.pathname.startsWith('/client/') || url.pathname.startsWith('/dryvest/');

      if (isHtml && !isAsset) {
        url.pathname = '/client/index.html';
        response = await assets.fetch(new Request(url.toString(), request));
      }
    }

    return response;
  },
};
