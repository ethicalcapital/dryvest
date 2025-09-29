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

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
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

const sha256Hex = async (buffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const normalizePrefix = (prefix: string): string => {
  if (!prefix) {
    return '';
  }
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
};

const safeReplaceExtension = (key: string, extension: string): string => {
  const lastSlash = key.lastIndexOf('/');
  const basename = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
  const dirname = lastSlash >= 0 ? key.slice(0, lastSlash + 1) : '';
  const dotIndex = basename.lastIndexOf('.');
  const stem = dotIndex > 0 ? basename.slice(0, dotIndex) : basename;
  return `${dirname}${stem}${extension}`;
};

const collapseSpacedUppercase = (value: string): string =>
  value.replace(/\b([A-Z](?:\s[A-Z]){2,})\b/g, (match) => match.replace(/\s+/g, ''));

const cleanMarkdown = (markdown: string): string => {
  if (!markdown) {
    return markdown;
  }

  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const cleanedLines: string[] = [];
  let inCodeBlock = false;

  for (const originalLine of lines) {
    let line = originalLine;

    if (/^\s*```/.test(line)) {
      cleanedLines.push(line.trimEnd());
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      cleanedLines.push(line);
      continue;
    }

    let processed = collapseSpacedUppercase(line)
      .replace(/,\s*(###\s*Page\s+\d+)/g, '\n\n$1');

    if (!/^\s*\|/.test(processed)) {
      processed = processed.replace(/ {2,}/g, ' ');
    }

    if (/^\s*,\s*$/.test(processed)) {
      continue;
    }

    cleanedLines.push(processed.trimEnd());
  }

  const cleaned = cleanedLines.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n{2,}(###\s*Page\s+\d+)/g, '\n\n$1')
    .trim();

  return cleaned.length ? `${cleaned}\n` : cleaned;
};

const extractMarkdownFromResult = (result: unknown): string | null => {
  if (!result) {
    return null;
  }

  if (Array.isArray(result)) {
    const first = result[0];
    if (first && typeof first === 'object') {
      if ('data' in first && typeof (first as any).data === 'string') {
        return (first as any).data as string;
      }
      if ('markdown' in first && typeof (first as any).markdown === 'string') {
        return (first as any).markdown as string;
      }
    }
  }

  if (typeof result === 'object') {
    const maybeDocs = (result as any).documents;
    if (Array.isArray(maybeDocs) && maybeDocs.length > 0) {
      const doc = maybeDocs[0];
      if (doc && typeof doc === 'object') {
        if ('data' in doc && typeof doc.data === 'string') {
          return doc.data as string;
        }
        if ('markdown' in doc && typeof doc.markdown === 'string') {
          return doc.markdown as string;
        }
      }
    }
    if ('markdown' in (result as any) && typeof (result as any).markdown === 'string') {
      return (result as any).markdown as string;
    }
    if ('result' in (result as any) && typeof (result as any).result === 'string') {
      return (result as any).result as string;
    }
  }

  if (typeof result === 'string') {
    return result;
  }

  return null;
};

const runMarkdownConversion = async (ai: any, document: ArrayBuffer, filename: string) => {
  try {
    if (ai?.toMarkdown && typeof ai.toMarkdown === 'function') {
      const blob = new Blob([document], { type: 'application/octet-stream' });
      const result = await ai.toMarkdown([
        {
          name: filename,
          blob,
        },
      ]);
      const markdown = extractMarkdownFromResult(result);
      if (markdown && markdown.length) {
        return { markdown };
      }
      return { markdown: '', error: 'Markdown conversion returned empty result from toMarkdown.' };
    }

    const uint8 = new Uint8Array(document);
    const response = await ai.run('@cf/markdown-conversion', {
      document: Array.from(uint8),
    });
    const markdown = extractMarkdownFromResult(response);
    if (markdown && markdown.length) {
      return { markdown };
    }
    return { markdown: '', error: 'Markdown conversion returned empty result.' };
  } catch (error) {
    return { markdown: '', error: (error as Error).message ?? 'Markdown conversion failed' };
  }
};

const runStructuredSummary = async (ai: any, markdown: string) => {
  const schema = {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      key_claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            claim_text: { type: 'string' },
            claim_type: { type: 'string' },
          },
          required: ['claim_text', 'claim_type'],
        },
      },
    },
    required: ['summary', 'key_claims'],
  };

  const prompt = `You are an expert legal and financial analyst. Read the following document and produce JSON with two fields: summary (<=200 words) and key_claims (array of objects with claim_text and claim_type). The JSON must strictly follow the provided schema.\n\nDocument:\n---\n${markdown}\n---`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You analyze investment policy documents and respond only with JSON.' },
        { role: 'user', content: prompt },
      ],
      max_output_tokens: 1024,
      response_format: { type: 'json_schema', json_schema: schema },
    });

    let text: unknown = response;
    if (typeof response === 'object') {
      if ('output_text' in response && typeof response.output_text === 'string') {
        text = response.output_text;
      } else if ('result' in response && typeof (response as any).result === 'string') {
        text = (response as any).result;
      } else if ('response' in response && typeof (response as any).response === 'string') {
        text = (response as any).response;
      } else if ('json' in response && typeof (response as any).json === 'object') {
        text = (response as any).json;
      } else if ('outputs' in response && Array.isArray((response as any).outputs)) {
        const outputs = (response as any).outputs;
        const segments = outputs
          .flatMap((o: any) => (o?.content ?? []) as any[])
          .map((segment: any) => segment?.text ?? '')
          .filter(Boolean);
        if (segments.length > 0) {
          text = segments.join('');
        }
      }
    }

    if (typeof text === 'string') {
      return { json: JSON.parse(text) };
    }

    if (typeof text === 'object' && text !== null) {
      return { json: text };
    }

    return { json: null, error: 'LLM returned unexpected output.' };
  } catch (error) {
    return { json: null, error: (error as Error).message ?? 'LLM analysis failed' };
  }
};

const runAlignmentAnalysis = async (ai: any, markdown: string) => {
  const schema = {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      identities: { type: 'array', items: { type: 'string' } },
      audiences: { type: 'array', items: { type: 'string' } },
      motivations: { type: 'array', items: { type: 'string' } },
      notes: { type: 'string' },
    },
    required: ['summary', 'notes'],
  };

  const guidance = `You help align research papers with Dryvest's dataset.
Return JSON with:
- summary: 2-3 sentence neutral synopsis (max 120 words).
- identities: optional array of Dryvest identity tags (corporate_pension, public_pension, endowment, foundation, insurance, swf, government, central_bank, individual).
- audiences: optional array of Dryvest audience tags (boards, fiduciary, consultants, staff, stakeholders, regulated, colleagues, family_friends, individuals).
- motivations: optional array of campaign drivers (regulatory_drivers, internal_leadership, external_stakeholders).
- notes: short advisory on how the paper supports our institutional change workflow (guardrails, policy draft, operational plan, analytics, stakeholder pressure, etc.).
If uncertain about any category, return an empty array.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: guidance },
        { role: 'user', content: `Document:\n---\n${markdown}\n---` },
      ],
      max_output_tokens: 1024,
      response_format: { type: 'json_schema', json_schema: schema },
    });

    if (response && typeof response === 'object') {
      if ('response' in response && typeof (response as any).response === 'string') {
        return JSON.parse((response as any).response);
      }
      if ('result' in response && typeof (response as any).result === 'string') {
        return JSON.parse((response as any).result);
      }
      if ('output_text' in response && typeof (response as any).output_text === 'string') {
        return JSON.parse((response as any).output_text);
      }
      if ('json' in response && typeof (response as any).json === 'object') {
        return (response as any).json;
      }
    }
  } catch (error) {
    return {
      summary: '',
      identities: [],
      audiences: [],
      motivations: [],
      notes: (error as Error).message ?? 'Alignment analysis failed.',
    };
  }

  return {
    summary: '',
    identities: [],
    audiences: [],
    motivations: [],
    notes: 'No AI response.',
  };
};

const detectSecondaryMemo = (markdown: string) => {
  const hasSourcesHeader = /##\s+Sources/i.test(markdown);
  const bulletMatches = markdown.match(/(?:^|\n)[-*]\s+\[[^\]]+\]\([^\)]+\)/g);
  const bulletCount = bulletMatches ? bulletMatches.length : 0;
  const wordCount = markdown.trim().split(/\s+/).length;
  if (hasSourcesHeader && bulletCount >= 20 && wordCount >= 1500) {
    return {
      suspected: true,
      reason: `Detected ${bulletCount} sources and ${wordCount} words under a Sources section—likely a secondary synthesis.`,
      sourceLines: (markdown.split(/\n##/)[0] ?? markdown).split('\n')
        .filter((line) => line.startsWith('-') || line.startsWith('*')),
    };
  }
  return { suspected: false, reason: '', sourceLines: [] };
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
      const prefix = url.searchParams.get('prefix') || undefined;
      try {
        if (!key) {
          const cursor = url.searchParams.get('cursor') || undefined;
          const limitParam = url.searchParams.get('limit');
          const limit = limitParam ? Number(limitParam) : undefined;
          const listing = await r2.list({ cursor, limit, prefix });
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
  {
    pattern: /^\/api\/autorag\/upload$/,
    methods: ['POST'],
    handler: async ({ request, env }) => {
      const bucket = (env as Record<string, unknown>).DRYVEST_R2 as R2Bucket | undefined;
      const ai = (env as Record<string, any>).AI;
      const kv = (env as Record<string, any>).HOOKS as KVNamespace | undefined;
      const browser = (env as Record<string, any>).BROWSER as any | undefined;
      if (!bucket) {
        return new Response(
          JSON.stringify({ error: 'R2 binding DRYVEST_R2 not configured.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      const contentType = request.headers.get('content-type') ?? '';
      if (!contentType.includes('multipart/form-data')) {
        return new Response(
          JSON.stringify({ error: 'Upload must be multipart/form-data with one or more files.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      const form = await request.formData();
      const entries = form.getAll('files');
      const uploads: Array<{
        name: string;
        key: string;
        size: number;
        alignment?: {
          summary: string;
          identities: string[];
          audiences: string[];
          motivations: string[];
          notes: string;
        };
      }> = [];

      if (!entries.length) {
        return new Response(
          JSON.stringify({ error: 'No files provided.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      for (const entry of entries) {
        if (!(entry instanceof File)) {
          continue;
        }

        const safeName = entry.name
          ? entry.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          : 'upload';
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const key = `originals/${stamp}-${safeName}`;

        const arrayBuffer = await entry.arrayBuffer();
        const sha256 = await sha256Hex(arrayBuffer);

        if (kv) {
          const kvKey = `autorag:hash:${sha256}`;
          const existingKey = await kv.get(kvKey);
          if (existingKey) {
            uploads.push({
              name: entry.name,
              key,
              size: entry.size,
              duplicate: true,
              existingKey,
            });
            continue;
          }
          await kv.put(kvKey, key);
        }

        await bucket.put(key, arrayBuffer, {
          httpMetadata: {
            contentType: entry.type || 'application/octet-stream',
          },
        });

        let alignment;
        let suspectedSecondary = false;
        let secondaryReason = '';
        let archivedSources: string[] | undefined;

        if (ai) {
          const conversion = await runMarkdownConversion(ai, arrayBuffer, entry.name || key);
          const markdown = conversion.markdown ? cleanMarkdown(conversion.markdown) : '';
          if (markdown) {
            alignment = await runAlignmentAnalysis(ai, markdown);
            const secondaryCheck = detectSecondaryMemo(markdown);
            if (secondaryCheck.suspected) {
              suspectedSecondary = true;
              secondaryReason = secondaryCheck.reason;
              if (browser && typeof browser.newContext === 'function' && secondaryCheck.sourceLines.length) {
                archivedSources = [];
                const urls: string[] = [];
                secondaryCheck.sourceLines.forEach((line) => {
                  const match = line.match(/\((https?:[^)]+)\)/);
                  if (match && urls.length < 5) {
                    urls.push(match[1]);
                  }
                });
                if (urls.length) {
                  const context = await browser.newContext();
                  for (const [idx, urlValue] of urls.entries()) {
                    try {
                      const page = await context.newPage();
                      await page.goto(urlValue, { waitUntil: 'networkidle' });
                      const html = await page.content();
                      const referenceKey = `references/${stamp}-${safeName}-${idx}.html`;
                      await bucket.put(referenceKey, html, {
                        httpMetadata: { contentType: 'text/html; charset=utf-8' },
                      });
                      archivedSources.push(referenceKey);
                    } catch (error) {
                      // ignore individual fetch errors
                    }
                  }
                  await context.close();
                } else if (!browser || typeof browser.newContext !== 'function') {
                  secondaryReason += ' (Browser archival unavailable in this environment.)';
                }
              }
            }
          } else {
            alignment = {
              summary: '',
              identities: [],
              audiences: [],
              motivations: [],
              notes: conversion.error ?? 'No markdown available for analysis.',
            };
          }
        }

        uploads.push({
          name: entry.name,
          key,
          size: entry.size,
          alignment,
          suspectedSecondary,
          secondaryReason,
          archivedSources,
        });
      }

      return new Response(
        JSON.stringify({ uploaded: uploads }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    },
  },
  {
    pattern: /^\/api\/autorag\/upload$/,
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
    pattern: /^\/api\/autorag\/convert$/,
    methods: ['POST'],
    handler: async ({ request, env }) => {
      const bucket = (env as Record<string, unknown>).DRYVEST_R2 as R2Bucket | undefined;
      const ai = (env as Record<string, any>).AI;

      if (!bucket || !ai) {
        return new Response(
          JSON.stringify({ error: 'AI or R2 bindings missing. Verify wrangler.toml configuration.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        cursor?: string;
        limit?: number;
        sourcePrefix?: string;
        targetPrefix?: string;
        manifestPrefix?: string;
      };

      const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 20);
      const cursorInput = typeof body.cursor === 'string' ? body.cursor : undefined;
      const sourcePrefix = normalizePrefix(typeof body.sourcePrefix === 'string' && body.sourcePrefix.length > 0 ? body.sourcePrefix : 'originals');
      const targetPrefix = normalizePrefix(typeof body.targetPrefix === 'string' && body.targetPrefix.length > 0 ? body.targetPrefix : 'markdown');
      const manifestPrefix = normalizePrefix(
        typeof body.manifestPrefix === 'string' && body.manifestPrefix.length > 0 ? body.manifestPrefix : 'manifests/markdown'
      );

      const listResult = await bucket.list({ cursor: cursorInput, limit, prefix: sourcePrefix });
      const manifestRecords: Array<Record<string, unknown>> = [];

      for (const obj of listResult.objects) {
        if (obj.key.endsWith('/')) {
          continue;
        }

        const manifestBase: Record<string, unknown> = {
          sourceKey: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          processedAt: new Date().toISOString(),
        };

        try {
          const r2Object = await bucket.get(obj.key);
          if (!r2Object) {
            manifestRecords.push({ ...manifestBase, status: 'missing', issues: ['Object not found when fetching.'] });
            continue;
          }

          const buffer = await r2Object.arrayBuffer();
          const sha256 = await sha256Hex(buffer);
          const conversion = await runMarkdownConversion(ai, buffer, obj.key.split('/').pop() ?? obj.key);
          let markdown = conversion.markdown ?? '';
          const issues: string[] = [];

          if (conversion.error) {
            issues.push(conversion.error);
          }

          if (markdown) {
            markdown = cleanMarkdown(markdown);
          }

          if (!markdown) {
            manifestRecords.push({
              ...manifestBase,
              sha256,
              status: 'skipped',
              issues: issues.length ? issues : ['Markdown conversion returned empty output.'],
            });
            continue;
          }

          const relativeKey = sourcePrefix ? obj.key.slice(sourcePrefix.length) : obj.key;
          const sanitizedRelative = safeReplaceExtension(relativeKey, '.md');
          const targetKey = `${targetPrefix}${sanitizedRelative}`;

          const frontMatterLines = ['---'];
          frontMatterLines.push(`source_key: ${JSON.stringify(obj.key)}`);
          frontMatterLines.push(`sha256: ${JSON.stringify(sha256)}`);
          frontMatterLines.push(`original_size: ${obj.size}`);
          frontMatterLines.push(`uploaded_at: ${JSON.stringify(obj.uploaded)}`);
          frontMatterLines.push(`processed_at: ${JSON.stringify(manifestBase.processedAt)}`);
          frontMatterLines.push(`target_key: ${JSON.stringify(targetKey)}`);
          if (issues.length) {
            frontMatterLines.push(`ai_issues: ${JSON.stringify(issues)}`);
          }
          frontMatterLines.push('---');
          frontMatterLines.push('');

          let body = markdown;
          if (markdown.startsWith('---')) {
            const closingIndex = markdown.indexOf('\n---', 3);
            if (closingIndex !== -1) {
              body = markdown.slice(closingIndex + 4).trimStart();
            }
          }

          const finalMarkdown = `${frontMatterLines.join('\n')}${body}`;

          await bucket.put(targetKey, finalMarkdown, {
            httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
          });

          const markdownBytes = new TextEncoder().encode(finalMarkdown).length;

          manifestRecords.push({
            ...manifestBase,
            sha256,
            status: 'written',
            targetKey,
            markdownBytes,
            issues: issues.length ? issues : undefined,
            frontMatter: true,
          });
        } catch (error) {
          manifestRecords.push({
            ...manifestBase,
            status: 'error',
            issues: [(error as Error).message ?? 'Unknown error'],
          });
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const manifestKey = `${manifestPrefix}${timestamp}.ndjson`;
      const ndjson = manifestRecords.map((record) => JSON.stringify(record)).join('\n');

      await bucket.put(manifestKey, ndjson, {
        httpMetadata: { contentType: 'application/x-ndjson; charset=utf-8' },
      });

      return new Response(
        JSON.stringify({
          attempted: manifestRecords.length,
          manifestKey,
          nextCursor: listResult.truncated ? listResult.cursor : null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    },
  },
  {
    pattern: /^\/api\/autorag\/convert$/,
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
    pattern: /^\/api\/clarify$/,
    methods: ['POST'],
    handler: async ({ request, env }) => {
      const ai = (env as Record<string, any>).AI;
      if (!ai) {
        return new Response(
          JSON.stringify({ error: 'AI binding not configured.' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      let payload: { text?: string; mode?: string };
      try {
        payload = (await request.json()) as { text?: string; mode?: string };
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const text = (payload.text ?? '').trim();
      if (!text) {
        return new Response(JSON.stringify({ error: 'Text is required.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      if (text.length > 4000) {
        return new Response(JSON.stringify({ error: 'Text too long; limit to 4,000 characters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const mode = typeof payload.mode === 'string' ? payload.mode : 'generic';
      const purpose = mode === 'fact'
        ? 'Summarize the claim and support in 2-3 plain language sentences and suggest one action organisers can take.'
        : mode === 'doc'
          ? 'Summarize the document into 3 actionable next steps for a divestment campaign.'
          : 'Clarify this excerpt in accessible language and surface one recommended action.';

      const prompt = `You are helping divestment campaigners understand investment research.\n${purpose}\n\nContent:\n${text}`;

      try {
        const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: 'You translate investment research into clear activist guidance.' },
            { role: 'user', content: prompt },
          ],
          max_output_tokens: 400,
        });

        let summary = '';
        if (typeof response === 'string') {
          summary = response;
        } else if (response && typeof response === 'object') {
          if ('response' in response && typeof (response as any).response === 'string') {
            summary = (response as any).response;
          } else if ('result' in response && typeof (response as any).result === 'string') {
            summary = (response as any).result;
          } else if ('output_text' in response && typeof (response as any).output_text === 'string') {
            summary = (response as any).output_text;
          } else if ('outputs' in response && Array.isArray((response as any).outputs)) {
            const outputs = (response as any).outputs;
            const segments = outputs
              .flatMap((o: any) => (o?.content ?? []) as any[])
              .map((segment: any) => segment?.text ?? '')
              .filter(Boolean);
            summary = segments.join('');
          }
        }

        if (!summary) {
          summary = 'No summary available.';
        }

        return new Response(JSON.stringify({ summary }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: (error as Error).message ?? 'Clarify failed.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    },
  },
  {
    pattern: /^\/api\/clarify$/,
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
    pattern: /^\/api\/autorag\/audit$/,
    methods: ['POST'],
    handler: async ({ request, env }) => {
      const bucket = (env as Record<string, unknown>).DRYVEST_R2 as R2Bucket | undefined;
      const ai = (env as Record<string, unknown>).AI as any;

      if (!bucket || !ai) {
        return new Response(
          JSON.stringify({ error: 'AI or R2 bindings missing. Verify wrangler.toml configuration.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await request.json().catch(() => ({})) as {
        limit?: number;
        cursor?: string;
        outputPrefix?: string;
      };

      const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);
      const cursorInput = typeof body.cursor === 'string' ? body.cursor : undefined;
      const outputPrefix = typeof body.outputPrefix === 'string' && body.outputPrefix.length > 0
        ? body.outputPrefix
        : 'autorag-audit/results';

      const listResult = await bucket.list({ cursor: cursorInput, limit });

      const results: Array<Record<string, unknown>> = [];

      for (const obj of listResult.objects) {
        try {
          const r2Object = await bucket.get(obj.key);
          if (!r2Object) {
            results.push({ key: obj.key, error: 'Object not found' });
            continue;
          }

          const buffer = await r2Object.arrayBuffer();
          const sha256 = await sha256Hex(buffer);

          const markdownResult = await runMarkdownConversion(ai, buffer);
          const markdown = markdownResult.markdown || '';

          const analysisResult = markdown
            ? await runStructuredSummary(ai, markdown)
            : { json: null, error: 'No markdown content generated.' };

          results.push({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded,
            sha256,
            markdownError: markdownResult.error ?? null,
            summary: analysisResult.json?.summary ?? null,
            key_claims: analysisResult.json?.key_claims ?? null,
            analysisError: analysisResult.error ?? null,
          });
        } catch (error) {
          results.push({ key: obj.key, error: (error as Error).message ?? 'Unknown error' });
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputKey = `${outputPrefix}/${timestamp}.ndjson`;
      const ndjson = results.map((record) => JSON.stringify(record)).join('\n');

      await bucket.put(outputKey, ndjson, {
        httpMetadata: { contentType: 'application/x-ndjson' },
      });

      return new Response(
        JSON.stringify({
          processed: results.length,
          outputKey,
          nextCursor: listResult.truncated ? listResult.cursor : null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    },
  },
  {
    pattern: /^\/api\/autorag\/audit$/,
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
    const assets = env.STATIC_ASSETS as Fetcher;
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
  async fetch(initialRequest: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    let request = initialRequest;
    let url = new URL(request.url);

    if (url.pathname === '/client' || url.pathname === '/client/') {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = '/';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    if (url.pathname === '/client/index.html') {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = '/';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    if (url.pathname.startsWith('/client/assets/')) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = url.pathname.replace('/client', '') || '/';
      const assets = env.STATIC_ASSETS as Fetcher;
      return assets.fetch(new Request(assetUrl.toString(), request));
    }

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

    const assets = env.STATIC_ASSETS as Fetcher;
    let response = await assets.fetch(request);

    if (response.status === 404 && request.method === 'GET') {
      const accept = request.headers.get('accept') ?? '';
      const expectsHtml = accept.includes('text/html');
      if (expectsHtml) {
        const fallbackUrl = new URL(request.url);
        fallbackUrl.pathname = '/index.html';
        response = await assets.fetch(new Request(fallbackUrl.toString(), request));
      }
    }

    return response;
  },
};
