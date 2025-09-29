# Dryvest

Dryvest is Ethical Capital’s educational briefing platform. The project turns divestment demands into implementation-ready talking points, policy clauses, and evidentiary packets that campaigners can take straight into trustee, pension, or investment committee rooms.

**Current release: v0.0.3** – identity/audience/motivation now drive every brief; the venue dimension stays in the dataset for future use but is no longer required to render the UI. The consent banner collects analytics preferences and release-note opt-ins via the `/api/preferences` endpoint instead of a mailto link.

> **Educational Use Only** – Dryvest outputs are strategic intelligence for organizing. They are not investment, legal, or tax advice.

---

## Repository at a Glance

### 1. Application – `app/`

The streamlined Vite + React application that now powers production. It consumes the same dataset as the classic build but renders a faster, audience-first workflow.

- `src/App.jsx` – top-level routing (`/brief`, `/explore`, `/library`, `/output`).
- `src/pages/` – route-specific views (Wizard, Output, Landing, Fact Check, Library).
- `src/components/` – reusable controls (consent gate, bottom stepper, cards).
- `src/utils/` – consent persistence, analytics stub, download helper.
- `src/data.js` – **auto-generated** content bundle (docs, key points, next steps, facts, trailheads). Regenerate with `node scripts/generate-prototype-data.mjs`.
- `public/data/<version>/` – canonical JSON dataset (nodes/playlists/sources/assertions/entities) served by the worker when D1 is unavailable.

### 2. Legacy Archive – `legacy/app-classic/`

The TypeScript/Tailwind version that previously shipped to Cloudflare Pages. It remains checked in for reference (tests, Tailwind config, PDF helpers) but is no longer deployed. Run it only if you need to study prior behavior.

### 3. Scripts & Tooling

- `scripts/generate-prototype-data.mjs` – pulls the latest dataset snapshot from `app/public/data/<version>/`, strips markdown front matter, and emits `app/src/data.js` (docs, key points, facts, next steps, trailheads).
- `scripts/dataset-coverage.mjs` – quick coverage diagnostic; reports percentage of identity × audience × motivation contexts that have actionable content (key points, next steps, counters).
- `scripts/export-dataset-csv.js` – optional CSV exporter for spreadsheet reviews (writes to `exports/`, which is gitignored).

---

## Developer Quickstart

### Primary App (React + Vite)
```bash
cd app
npm install
cd ..
node scripts/generate-prototype-data.mjs   # refresh app/src/data.js
cd app
npm run dev       # local Vite dev server (http://localhost:5173)
```

Optional production build:
```bash
npm run build
```

### Legacy App (archived)
```bash
cd legacy/app-classic
npm install
npm run dev
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

## UI Route Reference

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

Before any data loads, the app prompts for explicit consent:
1. **Anonymous analytics** toggle (off by default).
2. **Educational disclaimer** (must acknowledge to continue).
3. **Release notes opt-in** – inline email field that POSTs to `/api/preferences` so Cloudflare KV can track request provenance.

Selections are stored in `localStorage` via `src/utils/consent.js`. `src/utils/analytics.js` currently just logs events when analytics are permitted; you can swap this stub for a real analytics hook if needed. The production beta banner mirrors this flow: analytics consent toggles stay local-first, and the release-note form submits through the same preferences endpoint.

---

## Dataset Diagnostics & QA

- `node scripts/dataset-coverage.mjs` → prints overall coverage and highlights identity/audience/motivation gaps.
- `node scripts/generate-prototype-data.mjs` → regenerates `src/data.js` after editing JSON or D1.
- (Planned) QA scorer: vector similarity + LLM critique for generated briefs (hooks are ready but not yet wired into CI).

Current coverage snapshot (2025-09-27): **91.5 %** of identity × audience × motivation contexts have actionable content; remaining gaps are mostly individual/technical and sovereign wealth fund fiduciary combinations.

### AutoRAG Search (Cloudflare AI)

The worker exposes a thin proxy around Cloudflare's AutoRAG corpus `autumn-scene-316c`:

```bash
curl -X POST https://dryvest.ethicic.com/api/autorag \
  -H 'Content-Type: application/json' \
  -d '{"query": "policy-first guardrails"}'
```

This uses the `AI` binding configured in `wrangler.toml` (`env.AI.autorag('autumn-scene-316c').aiSearch`). The route accepts `GET` (with `?query=...`) or `POST` JSON payloads. Responses are returned as `{ query, answer }` straight from the AutoRAG API.

To audit or enrich the corpus you can hit the backing R2 bucket (bound as `DRYVEST_R2`) through the same worker:

```bash
# list the first 50 objects
curl 'https://dryvest.ethicic.com/api/autorag/bucket?limit=50'

# fetch a specific object (returns the stored raw text/HTML)
curl 'https://dryvest.ethicic.com/api/autorag/bucket?key=<object-key>'

# run an audit batch (processes up to 50 docs -> NDJSON in R2)
curl -X POST https://dryvest.ethicic.com/api/autorag/audit \
  -H 'Content-Type: application/json' \
  -d '{"limit":50,"outputPrefix":"autorag-audit/manual"}'
```

#### Markdown conversion helper

The worker ships a conversion endpoint that uses `env.AI.toMarkdown`, writes the cleaned output back to R2, and logs an NDJSON manifest per batch. By default it reads from `originals/`, writes markdown to `markdown/`, and stores manifests under `manifests/markdown/`.

```bash
# Kick off a batch of 20 documents (limit is clamped to 1–20)
curl -X POST https://dryvest.ethicic.com/api/autorag/convert \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 20,
    "manifestPrefix": "manifests/markdown-run2"
  }'

# Continue processing with the cursor returned above
curl -X POST https://dryvest.ethicic.com/api/autorag/convert \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 20,
    "cursor": "<cursor from previous response>",
    "manifestPrefix": "manifests/markdown-run2"
  }'

# Inspect manifests or drill into individual markdown files
rclone ls dryvest_service:dryvest/manifests/markdown-run2
rclone cat dryvest_service:dryvest/markdown/Financial\ Shenanigans.md | head
```

Fields you can override on the request payload:

| Field | Default | Purpose |
| --- | --- | --- |
| `sourcePrefix` | `originals/` | Where to read source documents. |
| `targetPrefix` | `markdown/` | Where cleaned markdown is written. |
| `manifestPrefix` | `manifests/markdown/` | Where manifests land. |
| `limit` | `5` | Batch size per invocation (1–20). |
| `cursor` | _none_ | Continue from a previous list page. |

Every manifest row includes the source key, SHA-256 checksum, markdown byte length, and any AI issues. Enrich the resulting markdown with front matter (title, source URL, who should use it, tone) before re-ingesting so AutoRAG and collaborating agents can surface the “house view” confidently.

Each generated markdown file now starts with YAML front matter:

```yaml
---
source_key: "originals/Financial Shenanigans.pdf"
sha256: "…"
original_size: 12079293
uploaded_at: "2025-09-29T01:23:04.744Z"
processed_at: "2025-09-29T02:59:06.389Z"
target_key: "markdown/Financial Shenanigans.md"
ai_issues: ["…"] # only present when the converter surfaces warnings
---
```

That metadata makes it easy to audit provenance, diff future runs, or flag documents that still need human cleanup.

#### Uploading new research papers

To push local PDFs or DOCX files into the corpus:

```bash
# Upload one or more files into originals/<timestamp>-<filename>
node scripts/autorag-upload.mjs ~/Downloads/paper.pdf

# Then process them into markdown (repeat with returned cursor until null)
curl -X POST https://dryvest.ethicic.com/api/autorag/convert \
  -H 'Content-Type: application/json' \
  -d '{"limit":20}'
```

The upload script shells out to `npx wrangler r2 object put`, so make sure you are authenticated (`wrangler login`) before running it.

### Corpus scope & curation

The research bucket should stay laser-focused on divestment work. Keep resources that help people argue for, design, or execute divestment (fiduciary duty analyses, ESG/divestment performance studies, regulatory pressure cases, stakeholder comms, governance scaffolds). Anything outside that remit—generic investing texts or unrelated policy papers—should either be culled or moved to a separate “general references” prefix so it never bleeds into divestment briefs unless explicitly requested.

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

## Changelog

### 0.0.3 — 2025-09-29
- Dropped venue-matching requirements across the React app, dataset helpers, and D1/CSV views; briefs now resolve purely on identity, audience, and motivation while venue tags remain available for future surfacing.
- Restored the production beta banner’s release-note opt-in to a proper POST against `/api/preferences`, keeping analytics consent privacy-first while capturing email provenance in KV.
- Promoted the streamlined React/Vite UI into `app/` and archived the TypeScript/Tailwind build under `legacy/app-classic/`.
- Updated docs and tooling to reflect the new context model and AutoRAG markdown pipeline (front matter + manifest logging).

---

## Open TODOs

- Add a reusable “policy-first” scaffold so activists can start with abstract guardrails before plugging in conflict-specific data (template snippet + quick-brief playlist).
- Create a dedicated node set for “institutional readiness questions” prompting stakeholders to define thresholds, escalation, and sign-off requirements.
- Add a “Degrees of Freedom Audit” checklist/model doc to map the operational latitude of target investment teams (statutory limits, mandate constraints, approvals).
- Integrate the QA scorer (deterministic + LLM critique) into the build pipeline and expose summaries in the UI.

---

For questions or access requests, contact Ethical Capital at [hello@ethicic.com](mailto:hello@ethicic.com).
