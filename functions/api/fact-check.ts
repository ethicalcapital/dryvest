import { DEFAULT_DATASET_VERSION } from '../../app/src/lib/constants';
import { loadDataset } from '../../app/src/lib/dataClient';
import type { BriefContext, Dataset } from '../../app/src/lib/schema';
import { buildFactCheckReport } from '../../app/src/lib/factCheck';
import {
  buildExportForContext,
  contextKey,
  enumerateContexts,
  hasContent,
} from '../../app/src/lib/factCheckBundle';

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const version = url.searchParams.get('version') ?? DEFAULT_DATASET_VERSION;
  const identity = url.searchParams.get('identity') ?? undefined;
  const audience = url.searchParams.get('audience') ?? undefined;
  const venue = url.searchParams.get('venue') ?? undefined;
  const level = url.searchParams.get('level') ?? undefined;

  try {
    const basePath = `${url.origin}/data`;
    const dataset = await loadDataset(version, { basePath });

    const contexts = determineContexts(dataset, {
      identity,
      audience,
      venue,
      level,
    });

    const reports = contexts
      .map(ctx => {
        const exportData = buildExportForContext(dataset, ctx);
        if (!hasContent(exportData)) return null;
        return buildFactCheckReport(exportData);
      })
      .filter((output): output is string => Boolean(output));

    if (!reports.length) {
      return new Response('No fact-check outputs available for the requested parameters.', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const body = reports.join('\n\n---\n\n');
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to build fact-check output', error);
    return new Response('Unable to generate fact-check output.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
};

const determineContexts = (
  dataset: Dataset,
  params: Partial<BriefContext>
): BriefContext[] => {
  if (params.identity) {
    const context: BriefContext = {
      identity: params.identity,
      level: params.level ?? dataset.schema?.taxonomies?.level?.[0] ?? 'plain',
    };
    if (params.audience) context.audience = params.audience;
    if (params.venue) context.venue = params.venue;
    return [context];
  }

  return enumerateContexts(dataset);
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
