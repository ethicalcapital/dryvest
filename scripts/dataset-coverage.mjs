#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_DATA_DIR = path.join('app', 'public', 'data');
const DEFAULT_LOG = path.join('analysis', 'coverage-history.jsonl');
const DISALLOWED_PAIRS = new Set([
  'individual::fiduciary',
]);

function parseArgs(argv) {
  const options = {
    version: null,
    dataDir: DEFAULT_DATA_DIR,
    logFile: DEFAULT_LOG,
    topGaps: 10,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--version':
      case '-v':
        options.version = argv[++i];
        break;
      case '--data-dir':
        options.dataDir = argv[++i];
        break;
      case '--log':
        options.logFile = argv[++i];
        break;
      case '--top-gaps':
        options.topGaps = Number(argv[++i]);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/dataset-coverage.mjs [options]\n\nOptions:\n  -v, --version <version>    Dataset version directory (defaults to latest)\n      --data-dir <path>       Base data directory (default: ${DEFAULT_DATA_DIR})\n      --log <path>            Output history file (default: ${DEFAULT_LOG})\n      --top-gaps <n>          Number of worst contexts to record (default: 10)\n  -h, --help                 Show this message`);
}

async function loadJson(filePath) {
  const contents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(contents);
}

function evaluateTargets(targets, context) {
  if (!targets) {
    return { matches: true, score: 0 };
  }

  let score = 0;

  const keys = ['identity', 'audience', 'venue', 'level'];
  for (const key of keys) {
    const options = targets[key];
    if (!options || !options.length) {
      continue;
    }
    const value = context[key];
    if (!value || !options.includes(value)) {
      return { matches: false, score: 0 };
    }
    score += 1;
  }

  const motivations = targets.motivation;
  if (motivations && motivations.length) {
    const { motivation, motivationSecondary } = context;
    let matched = false;
    if (motivation && motivations.includes(motivation)) {
      matched = true;
      score += 2;
    }
    if (motivationSecondary && motivations.includes(motivationSecondary)) {
      matched = true;
      score += 1;
    }
    if (!matched) {
      return { matches: false, score: 0 };
    }
  }

  return { matches: true, score };
}

function matchesTargets(targets, context) {
  return evaluateTargets(targets, context).matches;
}

function buildIndices(nodes, playlists) {
  const nodeIndex = Object.fromEntries(nodes.map(node => [node.id, node]));
  const playlistsByKind = playlists.reduce((acc, playlist) => {
    if (!acc[playlist.kind]) {
      acc[playlist.kind] = [];
    }
    acc[playlist.kind].push(playlist);
    return acc;
  }, {});
  return { nodeIndex, playlistsByKind };
}

function selectPlaylistByKind(playlistsByKind, kind, context) {
  const candidates = playlistsByKind[kind] ?? [];
  if (!candidates.length) return undefined;

  let best;
  let bestScore = -1;
  for (const playlist of candidates) {
    const evaluation = evaluateTargets(playlist.targets, context);
    if (!evaluation.matches) continue;
    if (evaluation.score > bestScore) {
      best = playlist;
      bestScore = evaluation.score;
    }
  }

  return best ?? candidates[0];
}

function resolvePlaylistNodes(dataset, kind, context) {
  const playlist = selectPlaylistByKind(dataset.playlistsByKind, kind, context);
  if (!playlist) {
    return [];
  }
  const seen = new Set();
  const nodes = [];
  for (const item of playlist.items ?? []) {
    if (item.conditions && !matchesTargets(item.conditions, context)) {
      continue;
    }
    const node = dataset.nodeIndex[item.ref];
    if (!node) continue;
    if (!matchesTargets(node.targets, context)) continue;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    nodes.push(node);
  }
  return nodes;
}

async function loadDataset(baseDir, version) {
  const dirEntries = await fs.readdir(baseDir);
  const resolvedVersion = version ?? dirEntries.sort().slice(-1)[0];
  if (!resolvedVersion) {
    throw new Error(`No dataset versions found in ${baseDir}`);
  }
  const versionDir = path.join(baseDir, resolvedVersion);
  const manifest = await loadJson(path.join(versionDir, 'manifest.json'));
  const nodesDoc = await loadJson(path.join(versionDir, manifest.nodes));
  const playlistsDoc = await loadJson(path.join(versionDir, manifest.playlists));
  const schemaDoc = await loadJson(path.join(versionDir, manifest.schema));

  const dataset = {
    version: manifest.version ?? resolvedVersion,
    manifest,
    schema: schemaDoc,
    nodes: nodesDoc.nodes,
    playlists: playlistsDoc.playlists,
  };

  return {
    dataset,
    versionDir,
    indices: buildIndices(dataset.nodes, dataset.playlists),
  };
}

function computeContexts(dataset, indices) {
  const taxonomies = dataset.schema.taxonomies ?? {};
  const identities = taxonomies.identity ?? [];
  const audiences = taxonomies.audience ?? [];
  const motivations = taxonomies.motivation ?? [];
  const levels = taxonomies.level ?? [];

  const contextResults = [];
  const pairSummaries = new Map();

  for (const identity of identities) {
    for (const audience of audiences) {
      if (DISALLOWED_PAIRS.has(`${identity}::${audience}`)) {
        continue;
      }
      let pairHasContent = false;
      const pairContexts = [];

      const motivationOptions = motivations.length ? motivations : [undefined];
      const levelOptions = levels.length ? levels : [undefined];

      for (const motivation of motivationOptions) {
        for (const level of levelOptions) {
          const context = {
            identity,
            audience,
            motivation,
            level,
          };

          const keyPoints = resolvePlaylistNodes(indices, 'key_points', context).filter(node => node.type === 'key_point');
          const nextSteps = resolvePlaylistNodes(indices, 'next_steps', context).filter(node => node.type === 'next_step');
          const counters = resolvePlaylistNodes(indices, 'counters', context).filter(node => node.type === 'counter');

          const templates = dataset.nodes.filter(
            node => node.type === 'template_snippet' && matchesTargets(node.targets, context)
          );
          const docs = dataset.nodes.filter(
            node => node.type === 'one_pager' && matchesTargets(node.targets, context)
          );

          const totals = {
            keyPoints: keyPoints.length,
            nextSteps: nextSteps.length,
            counters: counters.length,
            templates: templates.length,
            docs: docs.length,
          };
          const actionable = totals.keyPoints + totals.nextSteps + totals.counters;
          if (actionable > 0) {
            pairHasContent = true;
          }

          const contextRecord = {
            context,
            totals,
            actionable,
            hasTemplates: totals.templates > 0,
            hasDocs: totals.docs > 0,
          };
          pairContexts.push(contextRecord);
        }
      }

      if (!pairHasContent) {
        continue;
      }

      for (const entry of pairContexts) {
        contextResults.push(entry);
      }

      const summaryKey = `${identity}::${audience}`;
      const summary = pairContexts.reduce(
        (acc, entry) => {
          acc.minKeyPoints = Math.min(acc.minKeyPoints, entry.totals.keyPoints);
          acc.totalKeyPoints += entry.totals.keyPoints;
          acc.totalNextSteps += entry.totals.nextSteps;
          acc.totalCounters += entry.totals.counters;
          acc.actionableContexts += entry.actionable > 0 ? 1 : 0;
          acc.totalContexts += 1;
          return acc;
        },
        {
          identity,
          audience,
          minKeyPoints: Number.POSITIVE_INFINITY,
          totalKeyPoints: 0,
          totalNextSteps: 0,
          totalCounters: 0,
          actionableContexts: 0,
          totalContexts: 0,
        }
      );
      summary.minKeyPoints = summary.minKeyPoints === Number.POSITIVE_INFINITY ? 0 : summary.minKeyPoints;
      pairSummaries.set(summaryKey, summary);
    }
  }

  return {
    contexts: contextResults,
    pairSummaries,
  };
}

function buildMetrics(contexts) {
  const totalContexts = contexts.length;
  let actionable = 0;
  let templateOnly = 0;
  let empty = 0;

  for (const entry of contexts) {
    if (entry.actionable > 0) {
      actionable += 1;
    } else if (entry.hasTemplates || entry.hasDocs) {
      templateOnly += 1;
    } else {
      empty += 1;
    }
  }

  const coveragePercent = totalContexts === 0 ? 0 : (actionable / totalContexts) * 100;

  return {
    totalContexts,
    actionableContexts: actionable,
    templateOnlyContexts: templateOnly,
    emptyContexts: empty,
    coveragePercent,
  };
}

function formatContextKey(entry) {
  const { context } = entry;
  const motivation = context.motivation ?? 'any';
  const level = context.level ?? 'any';
  return `${context.identity}/${context.audience} · motivation=${motivation} · level=${level}`;
}

async function appendHistory(logFile, payload) {
  const dir = path.dirname(logFile);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(logFile, `${JSON.stringify(payload)}\n`, 'utf8');
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const dataDir = path.resolve(process.cwd(), options.dataDir);
    const { dataset, indices } = await loadDataset(dataDir, options.version);
    const { contexts, pairSummaries } = computeContexts(dataset, indices);
    const metrics = buildMetrics(contexts);

    const sortedGaps = contexts
      .filter(entry => entry.actionable === 0)
      .sort((a, b) => {
        if (a.hasTemplates === b.hasTemplates) {
          return (b.hasDocs ? 1 : 0) - (a.hasDocs ? 1 : 0);
        }
        return (b.hasTemplates ? 1 : 0) - (a.hasTemplates ? 1 : 0);
      })
      .slice(0, options.topGaps)
      .map(entry => ({
        context: entry.context,
        totals: entry.totals,
        hasTemplates: entry.hasTemplates,
        hasDocs: entry.hasDocs,
      }));

    const payload = {
      timestamp: new Date().toISOString(),
      datasetVersion: dataset.version,
      metrics,
      topGaps: sortedGaps,
      identityAudienceSummary: Array.from(pairSummaries.values())
        .sort((a, b) => a.actionableContexts - b.actionableContexts || a.minKeyPoints - b.minKeyPoints)
        .slice(0, 10),
    };

    await appendHistory(path.resolve(process.cwd(), options.logFile), payload);

    console.log(`Dataset version: ${dataset.version}`);
    console.log(`Contexts evaluated: ${metrics.totalContexts}`);
    console.log(`Contexts with actionable content: ${metrics.actionableContexts}`);
    console.log(`Template-only contexts: ${metrics.templateOnlyContexts}`);
    console.log(`Empty contexts: ${metrics.emptyContexts}`);
    console.log(`Coverage: ${metrics.coveragePercent.toFixed(1)}%`);
    if (sortedGaps.length) {
      console.log('\nTop uncovered contexts:');
      for (const gap of sortedGaps) {
        console.log(` - ${formatContextKey({ context: gap.context })}: KP ${gap.totals.keyPoints}, NS ${gap.totals.nextSteps}, CTR ${gap.totals.counters}`);
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
