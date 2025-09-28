# Dryvest

Dryvest is Ethical Capital’s educational briefing tool that turns divestment demands into implementation-ready talking points and policy language. This repository hosts the React/Tailwind frontend, Cloudflare Pages/Workers infrastructure, and the content dataset that now lives primarily in a Cloudflare D1 database (a static JSON snapshot under `public/data/<version>` is still kept for compatibility/dev seeding).

> **Educational Use Only** – Dryvest and all related exports are strategic intelligence for organizing. They are not investment, legal, or tax advice.

## Quick Start

```bash
# install deps
cd app
npm install

# run locally with Vite dev server
npm run dev

# type/lint/test
npm run type-check
npm run lint
npm run test

# production build (tsc + vite build)
npm run build
```

Prerequisites:
- Node.js 20+
- npm 10+
- Cloudflare Wrangler CLI if you want to deploy or tail workers (`npm install -g wrangler`).

## Project Structure

```
.
├── app/                   # React frontend
│   ├── public/            # Static assets + dataset bundles
│   ├── src/               # Components, hooks, lib modules
│   ├── src/components/ContactForm.tsx      # Follow-up form in actions rail
│   ├── src/components/FactCheckView.tsx    # Fact-check export mode
│   └── src/lib/factCheck.ts                # Generates fact-check reports
├── functions/api/         # Cloudflare Pages Functions
│   ├── contact.ts         # Stores contact submissions in KV and relays to LACRM
│   └── generate-pdf.ts    # PDF export proxy (Typst service)
├── database/              # D1 schema + seed SQL
├── public/data/<version>/ # Legacy dataset snapshot (used to seed D1 / dev fallback)
├── wrangler.toml          # Cloudflare project config (KV binding `HOOKS`)
└── README.md
```

Key frontend paths:
- `src/App.tsx` – top-level layout, mode switching (Quick/Custom/Compare/Fact Check).
- `src/components/ActionsPanel.tsx` – PDF/Markdown/Anki exports + contact form.
- `src/components/PreviewPane.tsx` – renders scripting content with APA citations.

### Dataset Layout

The running application pulls content from a D1 database via `GET /api/dataset?version=<id>`. For local development or cold starts you can still inspect the legacy JSON bundle under `public/data/<version>/`, which contains:

- `manifest.json` – file pointers mirroring the original static loader.
- `nodes.json` – normalized content nodes.
- `playlists.json` – target-aware playlists.
- `sources.json` – citation catalog.
- `assertions.json` – reusable statements with evidence links.
- `entities.json` – institutional profile metadata.
- `schema.json` – taxonomy definitions.

These files are the source of truth for the seed SQL that populates D1.

## Cloudflare D1 dataset

The UI now queries D1 instead of bundling the dataset into the frontend. To provision or refresh the database:

1. **Create the database** (one-time per environment):
   ```bash
   npx wrangler d1 create dryvest
   ```
   Update `wrangler.toml` with the returned `database_id` (replace the placeholder `00000000-0000-0000-0000-000000000000`).

2. **Apply the schema**:
   ```bash
   npx wrangler d1 execute dryvest --file database/schema.sql
   ```

3. **Seed the current dataset**:
   ```bash
   npx wrangler d1 execute dryvest --file database/seed-2025-09-27.sql
   ```
   For local mode add `--local`. The seed file is generated from the legacy JSON bundle.

4. **Refreshing content**: after editing the JSON bundle under `public/data/<version>/`, regenerate the seed SQL via
   ```bash
   node scripts/generate-d1-seed.js 2025-09-27
   ```
   and re-run step 3. The script writes to `database/seed-<version>.sql`.

5. **API shape**: `GET /api/dataset?version=<id>` returns `{ version, manifest, schema, nodes, playlists, sources, assertions, entities }`. The frontend falls back to the legacy JSON bundle only if the API call fails (e.g., D1 not seeded during local dev).

### Spreadsheet-friendly exports

If teammates need to audit the content in a spreadsheet, use the helper script to flatten the dataset into CSV files:

```bash
# default version 2025-09-27, reads from app/public/data/…
node scripts/export-dataset-csv.js

# specify a version
node scripts/export-dataset-csv.js --version 2025-09-27

# or hit a running API (e.g., wrangler pages dev)
node scripts/export-dataset-csv.js --api http://localhost:8788/api/dataset
```

CSV files are written to `exports/` (ignored by git). Each CSV has columns expanded into plain English—targets, assertions, evidence, etc.—so the data can be opened directly in Excel/Sheets.

## Cloudflare Workers & KV

- `functions/api/contact.ts` accepts POST JSON `{ name?, email?, message, newsletterOptIn?, meta? }`, stores it in the `HOOKS` KV namespace (production + preview binding `caf4e19f1388423fade84340c27a929c`), and POSTs to `env.LACRM_WEBHOOK_URL` if configured.
- `functions/api/generate-pdf.ts` proxies markdown payloads to the Typst export service. Configure `TYPST_EXPORT_TOKEN`, `HOOK_TYPST_EXPORT_URL`, and `ALLOWED_ORIGINS` in Cloudflare project settings.

To test workers locally, use `npx wrangler pages dev app/dist --kv=HOOKS=<namespace>` after building the frontend.

## Testing

We use [Vitest](https://vitest.dev/) with Testing Library for React components and Workers.

```bash
npm run test            # one-off run
npm run test:watch      # watch mode
npm run type-check      # ts --noEmit
npm run lint            # eslint
```

Notable tests:
- `src/components/__tests__/ContactForm.test.tsx` – payload validation, success/error flows.
- `src/components/__tests__/FactCheckView.test.tsx` – copy/download and analytics tracking.
- `functions/api/__tests__/contact.test.ts` – KV persistence and webhook relay behavior.

## Deployment

1. Build the frontend (`npm run build`), which writes to `app/dist/`.
2. Deploy via Cloudflare Pages (see CI pipeline or run `npx wrangler pages deploy app/dist --project-name <project>`).
3. Ensure the following environment variables are set in Cloudflare:
   - `TYPST_EXPORT_TOKEN`
   - `HOOK_TYPST_EXPORT_URL`
   - `ALLOWED_ORIGINS`
   - `LACRM_WEBHOOK_URL` (optional)
4. KV namespace `HOOKS` (ID `caf4e19f1388423fade84340c27a929c`) must exist and be bound to the project.

## Roadmap

The next phases focus on data normalization, ingestion, and reviewer tooling:

1. **Schema Normalization**
   - Extract reusable assertions into `assertions.json` with confidence metadata.
   - Move sources into `sources.json` with structured fields (publisher, date, APA citation).
   - Add `qa` status to nodes for editorial tracking.

2. **Third-Party List Ingestion**
   - Define a canonical format for external exclusion lists (`lists/<provider>.json`).
   - Build a CLI to ingest CSV/JSON feeds (AFSC, MSCI, public funds) and link entries to assertions.

3. **Reviewer Workflow**
   - Enhance Fact Check view with filters (`unreviewed`, `missing citation`, etc.).
   - Add email notifications or dashboard summarizing new submissions from the contact form.

4. **Validation & Tooling**
   - Introduce JSON Schema validation for dataset bundles.
   - Add smoke tests for PDF/Markdown export integrity (assert references appear in output).
   - Implement integration tests that run the full export pipeline in CI.

5. **UX Enhancements**
   - Optional: inline follow-up contact submission confirmation via modal/toast.
   - Improve analytics dashboards for download/copy/contact events.
   - Reintroduce a presentation tone control that works across quick/custom flows without duplicating temperature controls.

If you’re interested in contributing, please open an issue or reach out via the contact form inside the app. For internal collaborators, keep dataset edits in sync with `public/data/<version>/` and coordinate version bumps in `src/App.tsx` (`DATASET_VERSION`).

---

For questions or access requests, contact Ethical Capital at [hello@ethicic.com](mailto:hello@ethicic.com).
## Open TODOs

- Add a reusable "policy-first" scaffold in the dataset so activists can start with abstract guardrails before targeting a specific conflict (e.g., a template snippet + quick-brief playlist that walks through “define conduct criteria → approve override clause → map escalation triggers”). That gives them language to ask, “under what circumstances would we divest?” before they drop in the Palestine-specific data.
- Consider a dedicated node set for “institutional readiness questions” (one per identity/audience) that prompt stakeholders to declare whether divestment is ever acceptable, what thresholds apply, and who must sign off. Those can live alongside the spectrum tiers and surface in Quick Mode as pre-work.
- Add a "Degrees of Freedom Audit" checklist/model document so advocates can map the operational latitude of the target investment team (statutory limits, mandate constraints, approval thresholds) before making the central ask; surface it as part of the post-brief guidance and central ask presentation.
