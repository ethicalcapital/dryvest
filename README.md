# Dryvest

Dryvest is Ethical Capital’s educational briefing platform. The project turns divestment demands into implementation-ready talking points, policy clauses, and evidentiary packets that campaigners can take straight into trustee, pension, or investment committee rooms.

> **Educational Use Only** – Dryvest outputs are strategic intelligence for organizing. They are not investment, legal, or tax advice.

---

## Repository at a Glance

### 1. Scripts & Tooling

- `scripts/generate-prototype-data.mjs` – pulls the latest dataset snapshot (`app/public/data/<version>/`), strips markdown front matter, and emits the consolidated `src/data.js` bundle used by the prototype UI (docs, key points, facts, next steps, trailheads).
- `scripts/dataset-coverage.mjs` – quick coverage diagnostic; reports percentage of identity × audience × motivation contexts that have actionable content (key points, next steps, counters).
- `scripts/export-dataset-csv.js` – optional CSV exporter for spreadsheet reviews (writes to `exports/`, which is gitignored).

### 2. Frontend Applications

#### 2.1 Legacy App – `app/`

The production React/Tailwind application that ships to Cloudflare Pages. It now reads from the Cloudflare D1 database at runtime but still keeps a JSON bundle under `public/data/<version>/` for seeding and offline development.

Key paths:
- `app/src/App.tsx` – layout + mode switching (Quick, Custom, Compare, Fact Check).
- `functions/api/` – Cloudflare Pages Functions (contact form, PDF proxy, dataset endpoint).
- `database/` – D1 schema and seed SQL.

#### 2.2 Prototype UI – `prototypes/streamlined-ui/dryvest-ui/`

A Vite/React experiment that exposes the dataset more interactively. This is the environment we hand to new collaborators and GPT-style agents when we want fast iteration on flows.

Structure:
- `src/App.jsx` – top-level router (`/brief`, `/explore`, `/library`, `/output`).
- `src/pages/` – route components:
  - `Landing.jsx`
  - `Wizard.jsx` (Quick Brief)
  - `Output.jsx` (annotated brief)
  - `Explore` deck (`FactCheck.jsx`)
  - `Library.jsx` (documents & citations)
- `src/components/` – consent modal, bottom stepper.
- `src/utils/` – consent persistence, analytics stub, download helper.
- `src/data.js` – **auto-generated** by `scripts/generate-prototype-data.mjs`. Contains:
  - `DOCS`, `KEY_POINTS`, `NEXT_STEPS`, `FACTS`
  - `TRAILHEADS` – curated scenario bundles (policy guardrails, conduct risk framework, divestment exposure, identity alignment)
- `package.json`, `vite.config.js`, `styles.css` – standard Vite setup.

---

## Developer Quickstart

### Prototype UI (recommended for dataset exploration)
```bash
# install dependencies
cd prototypes/streamlined-ui/dryvest-ui/
npm install

# pull the current dataset snapshot and generate src/data.js
cd ../..
node scripts/generate-prototype-data.mjs

# run the Vite dev server
cd prototypes/streamlined-ui/dryvest-ui/
npm run dev
# open http://localhost:5173
```

### Production App (Cloudflare Pages)
```bash
cd app
npm install
npm run dev       # local Vite dev server
npm run build     # tsc -b && vite build
```

Prerequisites: Node.js 20+, npm 10+, optional Cloudflare Wrangler CLI for D1 work.

---

## Dataset Flow

```mermaid
graph TD
  subgraph Raw Snapshot
    A[JSON nodes/playlists/sources]
  end
  A --> B(generate-prototype-data.mjs)
  B --> C[DOCS]
  B --> D[KEY_POINTS]
  B --> E[FACTS]
  B --> F[NEXT_STEPS]
  B --> G[TRAILHEADS]
  C & D & E & F & G --> H[/src/data.js/]
  H --> I[/brief wizard summary]
  H --> J[/output annotated brief]
  H --> K[/explore deck]
  H --> L[/library previews]
```

- **DOCS** – model documents (markdown stripped of front matter) with context metadata (orgs, drivers, audiences).
- **KEY_POINTS** – argumentative statements with markdown copy, tags, citations.
- **FACTS** – evidence excerpts with citation URLs.
- **NEXT_STEPS** – actionable follow-ups tailored to org/audience/driver combos.
- **TRAILHEADS** – curated “start here” bundles linking points → docs → steps → evidence. Used by `/explore` to give users guided paths.

---

## UI Route Reference (Prototype)

### `/brief` – Quick Brief Flow
**Structure**
- Bottom-pinned stepper (4 steps): organization → audiences → drivers → summary.
- Autoadvance when a single-choice field (org, primary driver) is selected.

**Behaviour**
- Summary previews recommended documents (scored via contexts).
- Messaging explains that documents are auto-attached after brief generation.

### `/output` – Annotated Brief
**Sections**
1. Context recap (identity, audience, drivers).
2. “Why this resonates for your org” – curated notes.
3. Meeting guidance (how to steer the conversation).
4. Tailored talking points (renders `KEY_POINTS` markdown).
5. Central ask & supporting documents (from `DOCS`).
6. Next moves (from `NEXT_STEPS`).
7. Evidence to cite (from `FACTS`).
8. Markdown export (download + copy buttons).

### `/explore` – Dataset Explorer
**Trailheads**
- Pills for Policy Guardrails, Conduct Risk Controls, Divestment Exposure, Identity Alignment.
- Selecting a trailhead sets filters, jumps to the relevant card, and shows the scenario’s ordered steps (point/doc/step/fact).

**Filters & Navigation**
- Dropdowns for org, driver, audience (`Any` defaults).
- Search across title/body/support.
- Toggle between `Key Points` and `Evidence` views.
- Previous/Next buttons cycle through the filtered list with counter (e.g., “2 of 14”).

### `/library` – Documents & Evidence
- Tab buttons switch between “Model Documents” and “Facts & Citations”.
- Search + tag filters.
- Preview modal renders markdown with `react-markdown` + `remark-gfm` and offers download.
- Multi-select actions: bulk download (docs) or bulk copy (facts).

### `/` – Landing Page
- Hero copy, educational disclaimer, CTA buttons (Get Started, Explore, Browse Library).
- Featured model docs (first three from `DOCS`) with summaries and quick download links.

---

## Consent & Analytics

Before any data loads, the prototype prompts for explicit consent:
1. **Anonymous analytics** toggle (off by default).
2. **Educational disclaimer** (must acknowledge to continue).
3. **Optional email** opt-in for community updates.

Selections are stored in `localStorage` via `src/utils/consent.js`. `src/utils/analytics.js` currently just logs events when analytics are permitted; you can swap this stub for a real analytics hook if needed.

---

## Dataset Diagnostics & QA

- `node scripts/dataset-coverage.mjs` → prints overall coverage and highlights identity/audience/motivation gaps.
- `node scripts/generate-prototype-data.mjs` → regenerates `src/data.js` after editing JSON or D1.
- (Planned) QA scorer: vector similarity + LLM critique for generated briefs (hooks are ready but not yet wired into CI).

Current coverage snapshot (2025-09-27): **91.5 %** of contexts have actionable content; remaining gaps are mostly individual/technical and sovereign wealth fund fiduciary combinations.

---

## Cloudflare D1 Notes (Production App)

1. Create the database:
   ```bash
   npx wrangler d1 create dryvest
   # update wrangler.toml with the returned database_id
   ```

2. Apply schema:
   ```bash
   npx wrangler d1 execute dryvest --file database/schema.sql
   ```

3. Seed data:
   ```bash
   npx wrangler d1 execute dryvest --file database/seed-2025-09-27.sql
   ```

4. Refresh workflow:
   - Edit JSON snapshot under `public/data/<version>/`.
   - Generate new seed SQL: `node scripts/generate-d1-seed.js <version>`.
   - Re-run step 3.

The production worker exposes `GET /api/dataset?version=<id>` returning `{ version, manifest, schema, nodes, playlists, sources, assertions, entities }`. The legacy JSON bundle is only used when the API is unreachable (e.g., local dev without D1).

---

## Deployment (Production App)

1. Build frontend: `cd app && npm run build` (writes to `app/dist/`).
2. Deploy to Cloudflare Pages (CI or `npx wrangler pages deploy app/dist`).
3. Configure environment variables:
   - `TYPST_EXPORT_TOKEN`
   - `HOOK_TYPST_EXPORT_URL`
   - `ALLOWED_ORIGINS`
   - `LACRM_WEBHOOK_URL` (optional contact form relay)
4. Bind KV namespace `HOOKS` (ID `caf4e19f1388423fade84340c27a929c`).

---

## Open TODOs

- Add a reusable “policy-first” scaffold so activists can start with abstract guardrails before plugging in conflict-specific data (template snippet + quick-brief playlist).
- Create a dedicated node set for “institutional readiness questions” prompting stakeholders to define thresholds, escalation, and sign-off requirements.
- Add a “Degrees of Freedom Audit” checklist/model doc to map the operational latitude of target investment teams (statutory limits, mandate constraints, approvals).
- Integrate the QA scorer (deterministic + LLM critique) into the build pipeline and expose summaries in the UI.

---

For questions or access requests, contact Ethical Capital at [hello@ethicic.com](mailto:hello@ethicic.com).
