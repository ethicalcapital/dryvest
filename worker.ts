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
    return assets.fetch(request);
  },
};
