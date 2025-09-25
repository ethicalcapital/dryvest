import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.resolve(__dirname, '..');
const contentPath = path.join(rootDir, 'content', 'bds_pack.json');
const version = '2025-09-25';
const outDir = path.join(rootDir, 'app', 'public', 'data', version);

const taxonomy = {
  identity: [
    'individual',
    'swf',
    'public_pension',
    'corporate_pension',
    'endowment',
    'foundation',
    'insurance',
    'central_bank',
    'government'
  ],
  audience: ['family_friends', 'fiduciary', 'regulated'],
  venue: [
    'one_on_one',
    'town_meeting',
    'school_board',
    'city_council',
    'small_group',
    'committee_hearing',
    'full_board_meeting',
    'public_testimony',
    'written_memo'
  ],
  level: ['plain', 'technical'],
};

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const camelToSlug = (value) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  const data = await readJson(contentPath);
  const nodes = [];
  const playlists = [];
  const sourceMap = new Map();
  const keyPointOrder = [];
  const identityKeyPointOrder = new Map();
  const counterIdByClaim = new Map();
  const nextStepIds = [];
  const nextStepIdsByIdentity = new Map();

  const ensureSource = (label, url, extras = {}) => {
    if (!label || !url) return null;
    const key = `${label}__${url}`;
    if (sourceMap.has(key)) {
      return sourceMap.get(key).id;
    }
    const id = `src_${slugify(label).slice(0, 48)}`;
    const sourceNode = {
      id,
      type: 'source',
      label,
      url,
      ...extras,
    };
    sourceMap.set(key, sourceNode);
    nodes.push(sourceNode);
    return id;
  };

  const addNode = (node) => {
    nodes.push(node);
    return node.id;
  };

  if (data.openers?.generic) {
    addNode({
      id: 'opener_generic',
      type: 'opener',
      text: data.openers.generic,
    });
  }

  if (data.identity_openers) {
    Object.entries(data.identity_openers).forEach(([identity, entries]) => {
      Object.entries(entries).forEach(([contextKey, text]) => {
        const isGeneric = contextKey === 'generic';
        const normalizedVenue = camelToSlug(contextKey);
        const nodeId = `opener_${identity}_${isGeneric ? 'base' : normalizedVenue}`;
        const targets = { identity: [identity] };
        if (!isGeneric) {
          targets.venue = [normalizedVenue];
        }
        addNode({
          id: nodeId,
          type: 'opener',
          text,
          targets,
        });
      });
    });
  }

  if (data.identity_guides) {
    Object.entries(data.identity_guides).forEach(([identity, sections]) => {
      addNode({
        id: `guide_${identity}`,
        type: 'guide',
        sections,
        targets: { identity: [identity] },
      });
    });
  }

  if (Array.isArray(data.one_pagers)) {
    data.one_pagers.forEach((item) => {
      addNode({
        id: `one_pager_${item.id}`,
        type: 'one_pager',
        title: item.title,
        description: item.description,
        markdownPath: item.path,
      });
    });
  }

  if (Array.isArray(data.key_points)) {
    data.key_points.forEach((point, index) => {
      const baseSlug = slugify(point.title);
      const id = `kp_${baseSlug || `general_${index + 1}`}`;
      const citationIds = Array.isArray(point.citations)
        ? point.citations
            .map((c) => ensureSource(c.label, c.url))
            .filter(Boolean)
        : [];
      addNode({
        id,
        type: 'key_point',
        title: point.title,
        body: point.body,
        citations: citationIds,
      });
      keyPointOrder.push(id);
    });
  }

  if (data.key_points_by_entity) {
    Object.entries(data.key_points_by_entity).forEach(([identity, items]) => {
      const list = [];
      items.forEach((point, index) => {
        const baseSlug = slugify(point.title);
        const id = `kp_${identity}_${baseSlug || `extra_${index + 1}`}`;
        const citationIds = Array.isArray(point.citations)
          ? point.citations
              .map((c) => ensureSource(c.label, c.url))
              .filter(Boolean)
          : [];
        addNode({
          id,
          type: 'key_point',
          title: point.title,
          body: point.body,
          citations: citationIds,
          targets: { identity: [identity] },
        });
        list.push(id);
      });
      identityKeyPointOrder.set(identity, list);
    });
  }

  if (data.screening_knowledge) {
    const variants = Object.entries(data.screening_knowledge).map(([level, value]) => {
      let bodyText = '';
      if (typeof value === 'string') {
        bodyText = value;
      } else if (Array.isArray(value)) {
        const lines = value
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const parts = [];
            if (entry.title) {
              parts.push(`**${entry.title}.**`);
            }
            if (entry.body) {
              parts.push(entry.body);
            }
            if (Array.isArray(entry.citations) && entry.citations.length) {
              const labels = entry.citations
                .map((c) => {
                  const sourceId = ensureSource(c.label, c.url);
                  return sourceId ? c.label : null;
                })
                .filter(Boolean);
              if (labels.length) {
                parts.push(`(Sources: ${labels.join(', ')})`);
              }
            }
            if (!parts.length) return null;
            return `- ${parts.join(' ')}`;
          })
          .filter(Boolean);
        bodyText = lines.join('\n');
      } else if (value && typeof value === 'object') {
        bodyText = Object.values(value)
          .filter((segment) => typeof segment === 'string')
          .join('\n');
      } else if (value !== undefined && value !== null) {
        bodyText = String(value);
      }
      return {
        id: level,
        body: bodyText,
        transforms: { tone: level },
      };
    });
    addNode({
      id: 'policy_screening_knowledge',
      type: 'policy_statement',
      title: 'Screening intelligence',
      variants,
    });
  }

  if (data.venue_notes) {
    Object.entries(data.venue_notes).forEach(([venue, notes]) => {
      addNode({
        id: `venue_notes_${camelToSlug(venue)}`,
        type: 'template_snippet',
        title: 'Venue cues',
        lines: notes,
        targets: { venue: [camelToSlug(venue)] },
      });
    });
  }

  if (Array.isArray(data.counters)) {
    data.counters.forEach((item, index) => {
      const baseSlug = slugify(item.claim);
      const id = `ctr_${baseSlug || `item_${index + 1}`}`;
      const citationIds = Array.isArray(item.citations)
        ? item.citations
            .map((c) => ensureSource(c.label, c.url))
            .filter(Boolean)
        : [];
      addNode({
        id,
        type: 'counter',
        claim: item.claim,
        response: item.response,
        citations: citationIds,
      });
      counterIdByClaim.set(item.claim, id);
    });
  }

  if (data.model_resolution) {
    addNode({
      id: 'tmpl_model_resolution',
      type: 'template_snippet',
      title: 'Model Resolution',
      markdown: data.model_resolution,
      targets: { audience: ['fiduciary', 'regulated'] },
    });
  }

  if (data.government_policy_snippet) {
    addNode({
      id: 'tmpl_government_policy',
      type: 'template_snippet',
      title: 'Government Policy Template',
      markdown: data.government_policy_snippet,
      targets: { identity: ['government'] },
    });
  }

  if (data.cio_note) {
    addNode({
      id: 'note_cio',
      type: 'template_snippet',
      title: 'CIO Implementation Note',
      markdown: data.cio_note,
      targets: { audience: ['fiduciary'] },
    });
  }

  if (Array.isArray(data.cio_links)) {
    data.cio_links.forEach((link) => ensureSource(link.label, link.url, { tags: ['cio'] }));
  }

  if (Array.isArray(data.next_steps)) {
    data.next_steps.forEach((text, index) => {
      const id = `step_${slugify(text).slice(0, 48) || `general_${index + 1}`}`;
      addNode({
        id,
        type: 'next_step',
        text,
      });
      nextStepIds.push(id);
    });
  }

  if (data.next_steps_by_entity) {
    Object.entries(data.next_steps_by_entity).forEach(([identity, steps]) => {
      const list = [];
      steps.forEach((text, index) => {
        const id = `step_${identity}_${slugify(text).slice(0, 44) || `extra_${index + 1}`}`;
        addNode({
          id,
          type: 'next_step',
          text,
          targets: { identity: [identity] },
        });
        list.push(id);
      });
      nextStepIdsByIdentity.set(identity, list);
    });
  }

  if (data.policy_alignment) {
    const { principles = [], policy_link } = data.policy_alignment;
    const citationIds = policy_link
      ? [ensureSource(policy_link.label, policy_link.url)].filter(Boolean)
      : [];
    addNode({
      id: 'policy_alignment',
      type: 'policy_statement',
      title: 'Policy alignment criteria',
      bullets: principles,
      citations: citationIds,
    });
  }

  const ensureSourceList = (entries, extras = {}) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((item) => ensureSource(item.label, item.url, extras));
  };

  ensureSourceList(data.sources);
  ensureSourceList(data.further_reading, { tags: ['further_reading'] });
  if (data.source_sets) {
    Object.entries(data.source_sets).forEach(([audience, entries]) => {
      ensureSourceList(entries, { targets: { audience: [audience] } });
    });
  }

  const playlist = (id, kind, title, items, targets) => {
    playlists.push({ id, kind, title, items, targets });
  };

  const keyPointItems = keyPointOrder.map((ref) => ({ ref }));
  identityKeyPointOrder.forEach((list) => {
    list.forEach((ref) => keyPointItems.push({ ref }));
  });
  playlist('brief_key_points_default', 'key_points', 'Key points', keyPointItems);

  if (data.counter_sets) {
    Object.entries(data.counter_sets).forEach(([audience, claims]) => {
      const items = claims
        .map((claim) => {
          const ref = counterIdByClaim.get(claim);
          if (!ref) return null;
          return { ref };
        })
        .filter(Boolean);
      playlist(
        `counters_${audience}`,
        'counters',
        `Counters: ${audience}`,
        items,
        { audience: [audience] }
      );
    });
  }

  playlist(
    'next_steps_general',
    'next_steps',
    'Next steps (general)',
    nextStepIds.map((ref) => ({ ref }))
  );
  nextStepIdsByIdentity.forEach((list, identity) => {
    playlist(
      `next_steps_${identity}`,
      'next_steps',
      `Next steps: ${identity}`,
      list.map((ref) => ({ ref })),
      { identity: [identity] }
    );
  });

  if (data.source_sets) {
    Object.entries(data.source_sets).forEach(([audience, entries]) => {
      const items = entries
        .map((entry) => {
          const id = ensureSource(entry.label, entry.url);
          return id ? { ref: id } : null;
        })
        .filter(Boolean);
      playlist(
        `sources_${audience}`,
        'sources',
        `Sources: ${audience}`,
        items,
        { audience: [audience] }
      );
    });
  }

  playlist(
    'sources_global',
    'sources',
    'Sources (global)',
    Array.from(sourceMap.values()).map((source) => ({ ref: source.id }))
  );

  if (Array.isArray(data.further_reading) && data.further_reading.length) {
    const frItems = data.further_reading
      .map((entry) => {
        const ref = ensureSource(entry.label, entry.url);
        return ref ? { ref } : null;
      })
      .filter(Boolean);
    playlist('further_reading', 'sources', 'Further reading', frItems);
  }

  await ensureDir(outDir);
  await fs.writeFile(
    path.join(outDir, 'schema.json'),
    JSON.stringify(
      {
        version,
        createdAt: new Date().toISOString(),
        taxonomies: taxonomy,
      },
      null,
      2
    )
  );

  await fs.writeFile(
    path.join(outDir, 'nodes.json'),
    JSON.stringify({ version, nodes }, null, 2)
  );

  await fs.writeFile(
    path.join(outDir, 'playlists.json'),
    JSON.stringify({ version, playlists }, null, 2)
  );

  await fs.writeFile(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        version,
        schema: 'schema.json',
        nodes: 'nodes.json',
        playlists: 'playlists.json',
        source: 'content/bds_pack.json',
      },
      null,
      2
    )
  );

  console.log(`Wrote ${nodes.length} nodes and ${playlists.length} playlists to ${outDir}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
