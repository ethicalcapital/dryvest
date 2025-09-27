# Dryvest Competitive & Technical Critique

## Executive Summary
Dryvest offers a polished narrative brief builder with institution-specific talking points, but it remains a static content viewer rather than a data-rich engagement platform. Its single bundled dataset, narrow export pathways, and lack of benchmarking tools keep it well behind peers like As You Sow, Majority Action, or ShareAction that publish living scorecards, proxy analysis, and campaign trackers. Without verifiable data integrations, governance tooling, or impact measurement, Dryvest risks feeling like a compelling brochure that cannot power ongoing investor pressure.

## Strengths Worth Preserving
- **Versioned content architecture.** The application loads a fixed dataset version through a manifest-driven pipeline, making it possible to ship vetted packs and audit what users saw at any point in time.【F:app/src/App.tsx†L31-L89】【F:app/public/data/2025-09-25/manifest.json†L1-L7】
- **Audience-aware brief preview.** The preview renders tailored openers, guides, key points, next steps, and attachments with inline citation links, giving organizers a structured script that feels professional out of the box.【F:app/src/components/PreviewPane.tsx†L20-L199】
- **Multiple interaction modes.** Quick, custom, and comparison modes expose the same corpus in different ways, signaling ambition for both rapid outreach and deeper education flows.【F:app/src/App.tsx†L214-L280】【F:app/src/components/ModeSelector.tsx†L11-L86】

## Competitive Gaps vs. Field Leaders
- **No company- or fund-level accountability data.** Peer tools publish searchable scorecards (e.g., As You Sow’s mutual fund screeners, ShareAction’s ranking tables). Dryvest only provides prewritten policy language—there is no holdings database, emissions metric, or voting history to ground claims.【F:app/src/components/PreviewPane.tsx†L164-L199】
- **Static playlists instead of investigative pipelines.** The dataset is curated manually and baked into the build. There is no interface for surfacing newly filed shareholder resolutions, AGM vote outcomes, or board escalations the way Majority Action or ICCR dashboards do.【F:app/src/App.tsx†L31-L119】【F:app/public/data/2025-09-25/manifest.json†L1-L7】
- **Shallow comparison tooling.** The “Compare Institutions” view hardcodes generic context bullets rather than pulling performance, risk, or governance indicators from research APIs, so organizers cannot quantify trade-offs or prioritize targets based on exposure.【F:app/src/components/ComparisonView.tsx†L22-L199】
- **Minimal collaboration hooks.** Actions are limited to copying text or triggering a PDF worker; there is no integration with CRM pipelines, shared annotation, or campaign tasking seen in tools like Fix the System’s Investor Hub or Sunrise’s toolkit stacks.【F:app/src/components/ActionsPanel.tsx†L71-L163】【F:app/src/lib/pdf-export.ts†L18-L148】

## Content & Data Integrity Concerns
- **Single-issue corpus.** The manifest points to one `bds_pack.json`, and the nodes lean heavily on BDS-specific counters and policy snippets, leaving no pathway to cover other campaigns without republishing the entire app.【F:app/public/data/2025-09-25/manifest.json†L1-L7】
- **Binary tone control.** Users can only toggle between “plain” and “technical” prose. There is no sensitivity to risk appetite, urgency, or jurisdictional constraints that organizers typically need to tailor in institutions with varied fiduciary language.【F:app/src/App.tsx†L214-L247】【F:app/src/components/ToneToggle.tsx†L1-L62】
- **Opaque provenance.** Although citations display, there is no summary of methodology, data freshness, or confidence levels. Peers routinely publish methodology PDFs or API endpoints to backstop trust; Dryvest relies on implicit trust in the narrative.

## User Experience Limitations
- **Non-discoverable filters.** Both quick and custom modes expose long static dropdowns rather than search, tagging, or persona builders. Peers let users filter by asset size, sector exposure, or score thresholds to surface relevant examples quickly.【F:app/src/components/FiltersPanel.tsx†L31-L199】【F:app/src/components/CustomBriefBuilder.tsx†L15-L196】
- **No progress tracking or scenario saving.** There is no account system, saved briefs, or collaborative editing. Organizers cannot revisit prior drafts or share iterations with coalition partners, which is table stakes in movement CRMs.
- **Accessibility caveats.** While Tailwind styling aims for WCAG compliance, long scrolling cards with embedded markdown may challenge screen readers without landmark navigation or collapsible sections that handle large citation lists.【F:app/src/components/PreviewPane.tsx†L99-L199】

## Technical & Operational Risks
- **Backend dependency for exports.** PDF downloads rely on a single Cloudflare Worker endpoint; rate limiting or domain restrictions will silently break key workflows without offline fallbacks.【F:app/src/lib/pdf-export.ts†L18-L148】
- **No analytics segmentation.** Events only capture generic parameter changes, leaving teams blind to adoption by campaign, institution size, or geography—insights competitors use to iterate content roadmaps.【F:app/src/App.tsx†L96-L120】【F:app/src/lib/analytics.ts†L14-L45】
- **Lack of schema validation in authoring workflow.** Even though runtime validation exists, there is no CLI or CI enforcement described in the repo, raising the risk of malformed packs shipping unnoticed.【F:app/src/lib/dataClient.ts†L18-L78】

## Recommendations
1. **Ship live datasets.** Integrate holdings, controversies, and proxy-vote feeds so the brief builder can surface real exposure metrics alongside narrative framing. Prioritize public equities first to compete with As You Sow’s screening experience.
2. **Layer investigative workflows.** Add modules for AGM tracking, escalation history, and campaign status updates so organizers can move from brief generation to action planning in one place.
3. **Expand persona intelligence.** Replace static dropdowns with guided questionnaires that capture institution scale, governance structure, and legal constraints, then compute tailored recommendations.
4. **Publish methodology & provenance.** Auto-generate methodology summaries and make citation metadata (source date, reliability rating) visible to match the transparency standards of peer organizations.
5. **Harden collaboration features.** Implement saved briefs, shareable workspaces, and integrations with Airtable, Notion, or Action Network to embed Dryvest in coalition operations.
6. **Provide offline exports & APIs.** Offer raw markdown/JSON downloads and a documented API so local organizers can remix content without depending on the hosted UI.

## Presenting Large-Scale Quantitative Studies with Credibility
To showcase an institutional-grade analysis comprising 100,000 trials across 50–60 strategies, Dryvest should pair methodological transparency with elegant storytelling. A recommended approach:

### 1. Anchor the Narrative in a Research Summary Card
- Introduce the “Dryvest Institutional Research Lab” as a persistent module in the brief preview that summarizes the study scope: dataset vintage, asset classes covered, lookback period (five-year rolling windows), and statistical confidence interval.
- Include quick metrics (e.g., percentage of scenarios where escalation outperformed passive engagement) displayed in large numerals with short interpretive captions.

### 2. Layer Interactive Evidence Views
- **Strategy Performance Matrix:** Present a sortable grid where each row is a strategy (divestment, shareholder proposal, policy advocacy, etc.) and columns capture key outcomes (risk-adjusted return delta, stewardship wins, reputational risk reduction). Users can toggle cohorts (public vs. private institutions, endowments vs. pensions) with filters for assets under management.
- **Rolling Period Explorer:** Provide a sparkline panel showing five-year rolling outcomes; hovering reveals the time window, sample size, and methodology tag to reinforce point-in-time data integrity.
- **Scenario Drill-Down:** Offer a modal that walks through an individual trial’s inputs—baseline allocation, engagement timeline, data source references—so organizers can cite a fully transparent example in conversations.

### 3. Publish Methodology & Weighting Details Inline
- Embed a collapsible “Methodology & Weighting” section with bullet-point equations: how weighting is applied across trials, what statistical tests were used, and the provenance of each dataset (e.g., MSCI ESG Manager snapshot as of Q3 2024).
- Link to a downloadable methodological appendix (PDF/CSV) containing the raw configuration schema, enabling external auditors to replicate calculations.

### 4. Contextualize Outcomes Against Peer Benchmarks
- Add comparative strips that juxtapose Dryvest’s findings with published metrics from As You Sow, ShareAction, and Majority Action, highlighting alignment or divergence where relevant.
- Use neutral language and cite sources to keep the tone professional while signaling that Dryvest’s research holds its own against sector leaders.

### 5. Integrate Calls to Action with Evidence
- Tie each quantitative insight to a recommended organizer action (e.g., “Escalate governance campaign when stewardship success probability exceeds 65% over five-year rolling window”).
- Surface export buttons that bundle charts, methodology notes, and narrative talking points into a single PDF section so teams can deploy the findings immediately in weekend briefings.

This structure keeps the presentation classy—data-forward, transparent, and easy to operationalize—while ensuring the scale of the research feels tangible and on par with institutional expectations.

Dryvest’s voice and framing are differentiators, but until the tool couples that prose with continuously refreshed data and collaborative infrastructure, it will remain a supplement to—rather than a replacement for—the richer activist intelligence platforms already in circulation.
