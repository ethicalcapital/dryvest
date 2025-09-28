import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const datasetVersion = '2025-09-27';
const nodesPath = path.join(repoRoot, 'app', 'public', 'data', datasetVersion, 'nodes.json');
const sourcesPath = path.join(repoRoot, 'app', 'public', 'data', datasetVersion, 'sources.json');

const identityMap = {
  corporate_pension: 'corp',
  public_pension: 'public',
  endowment: 'univ',
  foundation: 'foundation',
  insurance: 'ins',
  central_bank: 'central',
  government: 'treasury',
  swf: 'wealth',
  individual: 'individual'
};

const audienceMap = {
  boards: 'board',
  fiduciary: 'committee',
  consultants: 'consultant',
  staff: 'staff',
  stakeholders: 'stake',
  compliance: 'reg',
  regulated: 'reg',
  colleagues: 'staff',
  family_friends: 'personal',
  individuals: 'personal'
};

const driverOverrides = {
  one_pager_about_ec: ['internal', 'external'],
  one_pager_fiduciary_playbook: ['regulatory'],
  one_pager_jlens_board: ['regulatory', 'external'],
  one_pager_jlens_technical: ['regulatory'],
  one_pager_performance_reality: ['internal', 'regulatory', 'external'],
  one_pager_divestment_exposure_assessment: ['regulatory', 'internal'],
  one_pager_conduct_risk_control_framework: ['regulatory', 'external'],
  one_pager_policy_framework: ['internal', 'regulatory', 'external']
};

const tagOverrides = {
  one_pager_about_ec: ['overview', 'ethics'],
  one_pager_fiduciary_playbook: ['fiduciary', 'governance'],
  one_pager_jlens_board: ['risk', 'performance', 'board'],
  one_pager_jlens_technical: ['risk', 'technical'],
  one_pager_performance_reality: ['performance', 'mythbusting'],
  one_pager_divestment_exposure_assessment: ['risk', 'template'],
  one_pager_conduct_risk_control_framework: ['conduct', 'risk', 'template'],
  one_pager_policy_framework: ['policy', 'governance']
};

const defaultAudiences = ['board', 'committee', 'consultant'];
const allOrgs = ['corp', 'public', 'univ', 'foundation', 'ins', 'wealth', 'treasury', 'central', 'individual'];
const defaultDrivers = ['internal', 'regulatory', 'external'];

const factIds = [
  'kp_outcome_identity_alignment',
  'kp_policy_modern_fiduciary_mandate',
  'kp_policy_coso_erm_conduct',
  'kp_policy_oecd_rbc_due_diligence',
  'kp_policy_escalation_triggers',
  'kp_policy_master_reporting_matrix'
];

function mapIdentities(values = []) {
  const mapped = new Set();
  for (const value of values) {
    const mappedId = identityMap[value];
    if (mappedId) mapped.add(mappedId);
  }
  return mapped;
}

function mapAudiences(values = []) {
  const mapped = new Set();
  for (const value of values) {
    const mappedId = audienceMap[value];
    if (mappedId) mapped.add(mappedId);
  }
  return mapped;
}

async function loadDocs(nodes) {
  const docs = nodes.filter((n) => n.type === 'one_pager');

  return Promise.all(
    docs.map(async (doc) => {
      const contexts = { orgs: new Set(), drivers: new Set(), audiences: new Set() };
      const targets = doc.targets || {};

      mapIdentities(targets.identity).forEach((id) => contexts.orgs.add(id));
      mapAudiences(targets.audience).forEach((id) => contexts.audiences.add(id));

      const markdownPath = doc.markdownPath ? path.join(repoRoot, doc.markdownPath) : null;
      let body = markdownPath ? await fs.readFile(markdownPath, 'utf8') : '# Coming soon';
      body = stripFrontMatter(body).trim();

      const drivers = driverOverrides[doc.id] || defaultDrivers;
      drivers.forEach((d) => contexts.drivers.add(d));

      if (contexts.orgs.size === 0) {
        allOrgs.forEach((org) => contexts.orgs.add(org));
      }
      if (contexts.audiences.size === 0) {
        defaultAudiences.forEach((aud) => contexts.audiences.add(aud));
      }

      return {
        id: doc.id.replace('one_pager_', ''),
        title: doc.title,
        summary: doc.description || doc.title,
        tags: tagOverrides[doc.id] || ['model', 'document'],
        contexts: {
          orgs: Array.from(contexts.orgs),
          drivers: Array.from(contexts.drivers),
          audiences: Array.from(contexts.audiences)
        },
        body
      };
    })
  );
}

function mapSources(sources) {
  const map = new Map();
  for (const source of sources) {
    map.set(source.id, source);
  }
  return map;
}

function mapMotivations(values = []) {
  const mapping = {
    regulatory_drivers: 'regulatory',
    internal_leadership: 'internal',
    external_stakeholders: 'external'
  };
  const result = new Set();
  for (const value of values) {
    const mapped = mapping[value];
    if (mapped) result.add(mapped);
  }
  return result;
}

function ensureContexts(contexts) {
  const normalized = {
    orgs: Array.from(new Set(contexts.orgs && contexts.orgs.length ? contexts.orgs : allOrgs)),
    audiences: Array.from(new Set(contexts.audiences && contexts.audiences.length ? contexts.audiences : defaultAudiences)),
    drivers: Array.from(new Set(contexts.drivers && contexts.drivers.length ? contexts.drivers : defaultDrivers))
  };
  return normalized;
}

function normalizeFacts(nodes, sourceMap) {
  const facts = [];
  for (const node of nodes) {
    if (!factIds.includes(node.id)) continue;
    const contexts = node.targets || {};
    const identity = Array.from(mapIdentities(contexts.identity));
    const audiences = Array.from(mapAudiences(contexts.audience));
    const drivers = Array.from(mapMotivations(contexts.motivation));
    const citations = (node.citations || []).map((id) => {
      const src = sourceMap.get(id);
      return src ? { title: src.label, url: src.url } : { title: id, url: '' };
    });
    facts.push({
      id: node.id,
      claim: node.title,
      support: node.body,
      tags: node.tags || [],
      contexts: ensureContexts({ orgs: identity, audiences, drivers }),
      citations
    });
  }
  return facts;
}

function normalizeKeyPoints(nodes, sourceMap) {
  const points = [];
  for (const node of nodes) {
    if (node.type !== 'key_point') continue;
    const contexts = node.targets || {};
    const identity = Array.from(mapIdentities(contexts.identity));
    const audiences = Array.from(mapAudiences(contexts.audience));
    const drivers = Array.from(mapMotivations(contexts.motivation));
    const citations = (node.citations || []).map((id) => {
      const src = sourceMap.get(id);
      return src ? { title: src.label, url: src.url } : { title: id, url: '' };
    });
    points.push({
      id: node.id,
      title: node.title,
      body: node.body || node.markdown || '',
      tags: node.tags || [],
      contexts: ensureContexts({ orgs: identity, audiences, drivers }),
      citations
    });
  }
  return points;
}

function stripFrontMatter(markdown) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 4);
}

function normalizeNextSteps(nodes) {
  const steps = [];
  for (const node of nodes) {
    if (node.type !== 'next_step') continue;
    const contexts = node.targets || {};
    const identity = Array.from(mapIdentities(contexts.identity));
    const audiences = Array.from(mapAudiences(contexts.audience));
    const drivers = Array.from(mapMotivations(contexts.motivation));
    steps.push({
      id: node.id,
      text: node.text,
      contexts: ensureContexts({ orgs: identity, audiences, drivers })
    });
  }
  return steps;
}

async function main() {
  const nodesRaw = await fs.readFile(nodesPath, 'utf8');
  const sourcesRaw = await fs.readFile(sourcesPath, 'utf8');
  const nodesJson = JSON.parse(nodesRaw);
  const sourcesJson = JSON.parse(sourcesRaw);

  const docs = await loadDocs(nodesJson.nodes);
  docs.sort((a, b) => a.title.localeCompare(b.title));

  const sourceMap = mapSources(sourcesJson.sources);
  const facts = normalizeFacts(nodesJson.nodes, sourceMap);
  facts.sort((a, b) => a.claim.localeCompare(b.claim));
  const keyPoints = normalizeKeyPoints(nodesJson.nodes, sourceMap).sort((a, b) => a.title.localeCompare(b.title));
  const nextSteps = normalizeNextSteps(nodesJson.nodes).sort((a, b) => a.text.localeCompare(b.text));

  const ORGANIZATIONS = [
    { id: 'corp', name: 'Corporate Pension Plan', desc: 'Employer-sponsored retirement fund.' },
    { id: 'public', name: 'Public Pension Plan', desc: 'Municipal or state retirement system.' },
    { id: 'univ', name: 'University / Endowment', desc: 'Endowment board or investment office.' },
    { id: 'foundation', name: 'Foundation / Philanthropy', desc: 'Private or community foundation assets.' },
    { id: 'ins', name: 'Insurance Company', desc: 'General account with ALM oversight.' },
    { id: 'wealth', name: 'Sovereign Wealth Fund', desc: 'State-owned investment authority.' },
    { id: 'treasury', name: 'Government Treasury', desc: 'Public finance or treasury office.' },
    { id: 'central', name: 'Central Bank / Monetary Authority', desc: 'Reserve management & policy teams.' },
    { id: 'individual', name: 'Individual Portfolio', desc: 'Personal or family-managed capital.' }
  ];

  const AUDIENCES = [
    { id: 'board', name: 'Board of Directors / Trustees', desc: 'Oversight & sign-off.' },
    { id: 'committee', name: 'Investment Committee', desc: 'Voting group w/ fiduciary authority.' },
    { id: 'consultant', name: 'Investment Consultant', desc: 'Advisor drafting recommendations.' },
    { id: 'staff', name: 'Investment Staff', desc: 'Day-to-day implementation team.' },
    { id: 'exec', name: 'Executive Sponsor', desc: 'CIO/CFO or equivalent.' },
    { id: 'reg', name: 'Regulators / Oversight', desc: 'Compliance or supervisory audience.' },
    { id: 'stake', name: 'Stakeholder Coalition', desc: 'Community / labor / coalition partners.' },
    { id: 'personal', name: 'Personal Network', desc: 'Tailor for individual advocates.' }
  ];

  const DRIVERS = [
    { id: 'regulatory', name: 'Regulatory Drivers', desc: 'Compliance-first framing, fiduciary duty, reporting controls.' },
    { id: 'internal', name: 'Internal Leadership', desc: 'Mission-fit case building, donors/board values, alignment.' },
    { id: 'external', name: 'External Stakeholders', desc: 'Campaign pressure, community momentum, coalition wins.' }
  ];

  const fileHeader = `// Auto-generated via scripts/generate-prototype-data.mjs\n// Dataset version: ${datasetVersion}\n\n`;

  const content = [
    fileHeader,
    `export const ORGANIZATIONS = ${JSON.stringify(ORGANIZATIONS, null, 2)};\n\n`,
    `export const AUDIENCES = ${JSON.stringify(AUDIENCES, null, 2)};\n\n`,
    `export const DRIVERS = ${JSON.stringify(DRIVERS, null, 2)};\n\n`,
    `export const DOCS = ${JSON.stringify(docs, null, 2)};\n\n`,
    `export const KEY_POINTS = ${JSON.stringify(keyPoints, null, 2)};\n\n`,
    `export const NEXT_STEPS = ${JSON.stringify(nextSteps, null, 2)};\n\n`,
    `export const FACTS = ${JSON.stringify(facts, null, 2)};\n`
  ].join('');

  const outputPath = path.join(repoRoot, 'prototypes', 'streamlined-ui', 'dryvest-ui', 'src', 'data.js');
  await fs.writeFile(outputPath, content, 'utf8');
  console.log(`Wrote ${docs.length} docs and ${facts.length} facts to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
