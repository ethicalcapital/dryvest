import { z } from 'zod';

interface Env {
  DRYVEST_ANALYTICS: DurableObjectNamespace;
}

const EventSchema = z.object({
  name: z.string().min(1),
  timestamp: z.string().optional(),
  contextHash: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

type IncomingEvent = z.infer<typeof EventSchema>;

type Category = 'engagement' | 'content' | 'usage' | 'feedback' | 'other';

const CATEGORY_MAP: Record<string, Category> = {
  app_opened: 'engagement',
  params_changed: 'engagement',
  mode_selected: 'engagement',
  scenario_selected: 'engagement',
  context_finalized: 'engagement',
  brief_built: 'engagement',
  time_in_mode: 'engagement',
  key_point_toggled: 'content',
  custom_keypoint_saved: 'content',
  compare_context_viewed: 'content',
  fact_check_context_viewed: 'content',
  download_clicked: 'usage',
  copy_clicked: 'usage',
  pdf_generated: 'usage',
  anki_export: 'usage',
  fact_check_bundle_downloaded: 'usage',
  mailing_opt_in: 'feedback',
  contact_submitted: 'feedback',
  feedback_link_clicked: 'feedback',
  analytics_consent_changed: 'feedback',
};

interface PersistedEvent {
  name: string;
  category: Category;
  timestamp: string;
  contextHash?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsState {
  buffer: PersistedEvent[];
  counts: Record<Category, number>;
}

const BUFFER_KEY = 'buffer';
const COUNTS_KEY = 'counts';
const LAST_FLUSH_KEY = 'lastFlush';
const FLUSH_SIZE = 100;

const DEFAULT_STATE: AnalyticsState = {
  buffer: [],
  counts: {
    engagement: 0,
    content: 0,
    usage: 0,
    feedback: 0,
    other: 0,
  },
};

export class DryvestAnalyticsDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private buffer: PersistedEvent[] = [];
  private counts: Record<Category, number> = { ...DEFAULT_STATE.counts };
  private init: Promise<void>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.init = this.state.blockConcurrencyWhile(async () => {
      const storedBuffer = await this.state.storage.get<PersistedEvent[]>(BUFFER_KEY);
      const storedCounts = await this.state.storage.get<Record<Category, number>>(COUNTS_KEY);
      this.buffer = storedBuffer ?? [];
      this.counts = storedCounts ?? { ...DEFAULT_STATE.counts };
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.init;
    const url = new URL(request.url);

    if (request.method === 'POST') {
      const raw = await request.json().catch(() => undefined);
      if (!raw) {
        return new Response('Invalid JSON payload', { status: 400 });
      }

      const eventsArray = Array.isArray(raw?.events) ? raw.events : [raw];
      const events: PersistedEvent[] = [];

      for (const candidate of eventsArray) {
        const parsed = EventSchema.safeParse(candidate);
        if (!parsed.success) {
          console.error('Invalid analytics event', parsed.error.flatten());
          continue;
        }
        const data = parsed.data;
        const category = CATEGORY_MAP[data.name] ?? 'other';
        const event: PersistedEvent = {
          name: data.name,
          category,
          timestamp: data.timestamp ?? new Date().toISOString(),
          contextHash: data.contextHash,
          metadata: sanitizeMetadata(data.metadata),
        };
        events.push(event);
      }

      if (!events.length) {
        return new Response(null, { status: 204 });
      }

      for (const event of events) {
        this.buffer.push(event);
        this.counts[event.category] = (this.counts[event.category] ?? 0) + 1;
      }

      await this.state.storage.put(BUFFER_KEY, this.buffer);
      await this.state.storage.put(COUNTS_KEY, this.counts);

      if (this.buffer.length >= FLUSH_SIZE) {
        await this.flushToKV();
      }

      return new Response(null, { status: 204 });
    }

    if (request.method === 'GET') {
      if (url.pathname.endsWith('/stats')) {
        const lastFlush = (await this.state.storage.get<number>(LAST_FLUSH_KEY)) ?? 0;
        return new Response(
          JSON.stringify({
            counts: this.counts,
            bufferSize: this.buffer.length,
            lastFlush,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }

      // Optional manual flush trigger
      if (url.pathname.endsWith('/flush')) {
        await this.flushToKV();
        return new Response(null, { status: 204 });
      }

      return new Response('Not found', { status: 404 });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async flushToKV() {
    if (!this.buffer.length) return;
    try {
      const batchKey = `analytics:${Date.now()}`;
      await this.env.HOOKS.put(
        batchKey,
        JSON.stringify({
          flushedAt: new Date().toISOString(),
          counts: this.counts,
          events: this.buffer,
        })
      );
    } catch (error) {
      console.error('Failed to flush analytics batch', error);
    } finally {
      this.buffer = [];
      await this.state.storage.put(BUFFER_KEY, this.buffer);
      await this.state.storage.put(LAST_FLUSH_KEY, Date.now());
    }
  }
}

const sanitizeMetadata = (
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!metadata) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      cleaned[key] = value;
    } else if (Array.isArray(value)) {
      cleaned[key] = value
        .filter(item => ['string', 'number', 'boolean'].includes(typeof item))
        .map(item => (typeof item === 'number' ? Number(item.toFixed?.(4) ?? item) : item));
    }
  }
  return Object.keys(cleaned).length ? cleaned : undefined;
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const id = env.DRYVEST_ANALYTICS.idFromName('dryvest-analytics');
  const stub = env.DRYVEST_ANALYTICS.get(id);
  const url = new URL(request.url);

 if (request.method === 'POST') {
   const body = await request.text();
    const response = await stub.fetch(`https://analytics.do/${url.pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return withCors(response.status, await response.text());
  }

  if (request.method === 'GET') {
    const targetPath = url.pathname.endsWith('stats')
      ? 'stats'
      : url.pathname.endsWith('flush')
        ? 'flush'
        : 'stats';
    const response = await stub.fetch(`https://analytics.do/${targetPath}`);
    return withCors(response.status, await response.text(), response.headers.get('Content-Type') ?? 'application/json');
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    },
  });
};

const withCors = (status: number, body: string, contentType = 'application/json') =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    },
  });
