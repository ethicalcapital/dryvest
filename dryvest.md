Short answer: model everything as addressable nodes with IDs, conditions, and playlists. Replace per-audience forks with tags + filters. Add editorial metadata, provenance, and templates. Validate with a JSON Schema in CI.

Core changes
 1. Normalize into nodes
 • Every unit becomes a node: opener, guide, key_point, counter, source, one_pager, next_step, policy_statement, template_snippet.
 • Common envelope: id, type, slug, text|markdown, citations[], targets{identity[], venue[], audience[], level[]}, conditions{}, version, status, provenance, related[].
 2. Playlists over per-audience maps
 • Replace *_by_entity and*_sets with ordered playlists that just reference node IDs with optional per-item overrides.
 • Example playlists: brief_key_points, fiduciary_counters, regulated_sources.
 3. Templates not raw strings
 • Move model_resolution, government_policy_snippet, and similar into template_snippet nodes with Handlebars-style variables and defaults.
 • Support locale and reading-level variants via variants[] on a node.
 4. Editorial layer
 • Add edits[] to any node: suggestions, diffs, status, author, date.
 • Add quality block: readability_grade, style, last_reviewed, owner.
 5. Provenance and lifecycle
 • provenance: {source_urls[], method, review_status, reviewer}.
 • lifecycle: {created_at, updated_at, deprecated?: true, superseded_by?: id}.
 6. Sources as first-class nodes
 • Normalize sources/further_reading into source nodes with id, label, url, citation_text, accessed_at, jurisdiction.
 7. Conditions instead of forks
 • Use conditions for simple logic: {if_identity: ["public_pension"], not_venue: ["hearing"], min_level: "technical"}.
 8. Transforms
 • Add optional transforms hints to guide rendering: {"tone":"plain|technical","length":"short|long","list_style":"bullets|numbers"}.

Suggested top-level document

{
  "version": "2025-09-25",
  "meta": { "schema": "1.0.0", "locale_default": "en-US" },
  "taxonomies": {
    "identity": ["individual","public_pension","endowment","government"],
    "audience": ["family_friends","fiduciary","regulated"],
    "venue": ["one_to_one","small_group","committee_hearing"]
  },
  "nodes": [ /*array of typed nodes, examples below*/ ],
  "playlists": [
    { "id": "brief_key_points_default", "title": "Default Brief KP", "items": [
      {"ref": "kp_cost_findings", "overrides": {"transforms":{"tone":"plain"}}},
      {"ref": "kp_method_summary"}
    ]},
    { "id": "counters_fiduciary", "title": "Fiduciary Counters", "items": [
      {"ref": "ctr_antisemitism_claim"},
      {"ref": "ctr_fiduciary_duty"}
    ]}
  ],
  "render_presets": {
    "plain_brief": { "tone": "plain", "length": "long" },
    "technical_brief": { "tone": "technical", "length": "long" }
  }
}

Node examples

{
  "id": "opener_generic",
  "type": "opener",
  "slug": "opener-generic",
  "text": "We can align savings with shared values without sacrificing rigor.",
  "targets": { "identity": ["*"], "venue": ["*"], "audience": ["*"] },
  "transforms": { "tone": "plain" },
  "provenance": { "source_urls": [], "review_status": "approved" },
  "lifecycle": { "created_at": "2025-09-25", "updated_at": "2025-09-25" }
}

{
  "id": "guide_public_pension",
  "type": "guide",
  "slug": "guide-public-pension",
  "sections": {
    "ask": "Adopt an exclusions policy covering X...",
    "implementation": "Use manager guidelines and compliance attestations...",
    "reporting": "Quarterly holdings attestation & exception log...",
    "risk": "Track ex-ante tracking error and realized slippage."
  },
  "targets": { "identity": ["public_pension"] },
  "edits": [
    { "id":"e1","suggestion":"Replace 'slippage' with 'cost to implement'","status":"open","by":"@contribA","at":"2025-09-25" }
  ]
}

{
  "id": "kp_cost_findings",
  "type": "key_point",
  "title": "Divestment impact on returns",
  "body": "Average impact −0.1255% and not statistically significant.",
  "citations": ["src_main_result"],
  "targets": { "audience": ["fiduciary","regulated"] },
  "quality": { "readability_grade": 10 }
}

{
  "id": "ctr_antisemitism_claim",
  "type": "counter",
  "claim": "Divestment is antisemitic.",
  "response": "Critique targets state policy and complicit firms, not a people or faith...",
  "citations": ["src_icj","src_hrw"],
  "tags": ["speech","human_rights"],
  "targets": { "audience": ["family_friends","regulated"] }
}

{
  "id": "tmpl_resolution_public",
  "type": "template_snippet",
  "title": "Public Issuer Resolution",
  "markdown": "Resolved: {{body}}\\nEffective: {{effective_date:YYYY-MM-DD}}",
  "variants": [
    {"id":"plain","transforms":{"tone":"plain"}},
    {"id":"tech","transforms":{"tone":"technical"}}
  ],
  "targets": { "identity": ["government","public_pension"] }
}

{
  "id": "src_main_result",
  "type": "source",
  "label": "ECIC Backtests 2020–2023",
  "url": "https://…",
  "citation_text": "ECIC (2025). Ethical exclusions impact analysis.",
  "accessed_at": "2025-09-25"
}

Mapping from your current fields
 • openers, identity_openers → opener nodes with targets.
 • identity_guides → guide nodes (sections.ask|implementation|reporting|risk).
 • one_pagers → one_pager nodes with markdown and attachments[] if needed.
 • key_points, key_points_by_entity → key_point nodes; audience/identity via targets; order via playlists.
 • screening_knowledge → policy_statement or template_snippet nodes with variants.
 • venue_notes → template_snippet nodes with targets.venue.
 • counters, counter_sets → counter nodes + audience playlists.
 • model_resolution, government_policy_snippet → template_snippet nodes.
 • next_steps, next_steps_by_entity → next_step nodes + playlists per identity.
 • sources, source_sets → source nodes + source playlists.
 • policy_alignment → policy_statement nodes keyed by slug.
 • cio_note, cio_links → template_snippet and source nodes tagged identity:["cio"].

Output assembly
 • Given {identity, venue, audience, level}, select:
 • one opener where targets match, else fallback.
 • one guide matching identity (render sections).
 • playlist brief_key_points_default filtered by targets.
 • playlist of counters by audience.
 • playlist of sources by audience + global.
 • template_snippet nodes gated by conditions.
 • optional one_pager nodes selected by user.

GitHub maintenance workflow
 • Repo layout

/schema/schema.json
/nodes/*.json                # one node per file
/playlists/*.json
/locales/en-US/*.json        # locale-specific overrides (optional)
/contrib/PR_TEMPLATE.md

 • Validation
 • JSON Schema (Ajv) in CI. Enforce unique id, required fields, allowed taxonomies.
 • Lint script to check broken ref IDs, orphan nodes, circular related.
 • Contribution
 • PR template forces: purpose, node IDs touched, citations added/updated, readability grade, reviewer.
 • Auto-changelog from lifecycle.updated_at.
 • “Translate out of nerd”
 • Each node can carry variants with tone and reading_level.
 • Writer edits just add a variants[].id="plain" body; renderer picks by preset.

This refactor gives granular maintenance, deterministic output, and trivial targeting without duplicating content.

Use a tiny, schema-driven SPA that reads versioned JSON and renders “briefs” from node IDs and playlists. Keep URL-state, deterministic rendering, and one-click edit links into GitHub.

Stack
 • Static host (Cloudflare Pages).
 • React + TypeScript + Vite. Tailwind for layout. Zod for runtime schema checks.
 • Optional SSR/prerender for top presets; hydrate on load.
 • Quarto site embeds the app via iframe or a shortcode that injects the built bundle.

Routing & state
 • Single route with query params as the source of truth:
/dryvestment?identity=public_pension&audience=fiduciary&venue=hearing&level=plain&playlist=brief_key_points_default
 • All UI controls write to the URL. Deep links are copyable. No hidden state.

Data loading
 • /data/{version}/schema.json
 • /data/{version}/nodes/*.json
 • /data/{version}/playlists/*.json
 • On boot: fetch schema → validate → build in-memory index {id → node}. Fallback to previous version if validation fails.

UI layout
 • Left rail: Filters
 • Identity, Audience, Venue, Level, Playlist selector
 • Toggles for one-pagers
 • Main pane: Live preview
 • Opener → Guide sections (ask/implementation/reporting/risk)
 • Key points (ordered by playlist)
 • Counters table
 • Next steps
 • Sources
 • One-pagers (expand/collapse)
 • Right rail: Actions
 • Copy, Download (MD/PDF), Print
 • Feedback CTA (“Did this help? Yes/No + comment”)
 • “Propose an edit” with GitHub deep links

Components (atoms)
 • <NodeRenderer nodeId /> renders any node type by looking up nodes[id].
 • <PlaylistRenderer id /> maps ordered refs with per-item overrides.
 • <CounterTable ids[] /> with expand for citations.
 • <SourceList ids[] /> dedupes global + audience sources.
 • <OnePagerCard id /> renders markdown with TOC.

“Propose an edit” flow
 • Each rendered block shows a small “Improve this” link:
 • Builds a URL to the exact JSON file in GitHub (/nodes/{id}.json) with a prefilled issue template including current params and paragraph anchor.
 • Optional: inline suggestion drawer that opens a textarea, then posts to GitHub Issues via link-encoded query (no backend).

Output pipeline

 1. Collect params → resolve candidate nodes by targets and conditions.
 2. Order via selected playlists.
 3. Apply variants/transforms (tone, length).
 4. Assemble MD → render (Markdown-it) → optional PDF via client-side print-to-PDF.

Follow-up automation hook
 • After “Download” or “Copy,” show a non-blocking banner:
“Can we email you in 7 days to ask if this helped?”
 • Button opens a minimal form (email + consent).
 • Post to your existing newsletter/form endpoint or a static form tool; no app backend required.

Performance & robustness
 • Versioned assets /data/2025-09-25/... for cache busting.
 • Lazy-load one-pagers.
 • Zod guards with readable error surface (“node X missing ‘body’”).
 • Accessibility: semantic headings, keyboard nav, focus rings, ARIA for tables.

Quarto integration options
 • Simple: iframe embed of /dryvestment with auto-height.
 • Tighter: a Quarto shortcode that injects the bundle and a <div id="app">, passing defaults via data-attributes (mirrors URL params).

Minimal file tree

/app
  /components
  /pages/index.tsx
  /lib/resolve.ts        # targets/conditions/variants logic
  /lib/schema.ts         # Zod types
  /styles/tailwind.css
/data/2025-09-25/schema.json
/data/2025-09-25/nodes/*.json
/data/2025-09-25/playlists/*.json

This gives: fast static hosting, deterministic assembly, granular maintenance via one-file-per-node, deep-linkable states, and a frictionless GitHub edit path.

Use lightweight, privacy-first, event analytics. Keep params in URL and send only metadata, never content.

Provider
 • Cloudflare Web Analytics (free, on Pages) for pageviews.
 • Plausible or PostHog for custom events. PostHog if you want funnels/session replay. Plausible if you want minimal JS.

What to log (events)
 • app_opened
 • params_changed (identity, audience, venue, level, playlist)
 • brief_built (render_time_ms, node_counts, one_pagers_count)
 • copy_clicked
 • download_clicked (format)
 • print_clicked
 • counter_expanded (counter_id)
 • one_pager_toggled (one_pager_id, state)
 • github_edit_clicked (node_id)
 • feedback_shown / feedback_submitted (rating, chars)
 • followup_opt_in (true/false)
 • error_shown (code)

Common properties
 • version, session_id (random UUID v4), referrer, ua_device
 • identity, audience, venue, level, playlist
 • selected_one_pagers[]
 • node_ids_rendered[] (key_points/counters/sources)
 • doc_length_chars, render_time_ms

Privacy
 • No PII without explicit consent.
 • Honor DNT.
 • Sample high-volume events.
 • Retain 6–12 months.

Implementation (TS, provider-agnostic)

// analytics.ts
type EventName =
  | "app_opened" | "params_changed" | "brief_built" | "copy_clicked"
  | "download_clicked" | "print_clicked" | "counter_expanded"
  | "one_pager_toggled" | "github_edit_clicked" | "feedback_shown"
  | "feedback_submitted" | "followup_opt_in" | "error_shown";

type Common = {
  version: string; session_id: string; url: string;
  identity?: string; audience?: string; venue?: string;
  level?: "plain"|"technical"; playlist?: string;
};

export const send = (name: EventName, props: Record<string, any> = {}) => {
  const base: Common = {
    version: APP_VERSION,
    session_id: getSessionId(), // uuid in localStorage
    url: location.href
  };
  // Adapter: Plausible
  // @ts-ignore
  window.plausible?.(name, { props: { ...base, ...props } });
  // Adapter: PostHog
  // @ts-ignore
  window.posthog?.capture(name, { ...base, ...props });
};

Hook points:

// On load
send("app_opened");

// When controls change (and URL updates)
send("params_changed", { identity, audience, venue, level, playlist });

// After assembling brief
send("brief_built", {
  render_time_ms, doc_length_chars,
  node_ids_rendered, selected_one_pagers
});

// UI actions
copyBtn.onclick = () => send("copy_clicked");
downloadBtn.onclick = () => send("download_clicked", { format: "pdf" });
printBtn.onclick = () => send("print_clicked");
expandCounter = (id, open) => open && send("counter_expanded", { counter_id: id });
toggleOnePager = (id, state) => send("one_pager_toggled", { one_pager_id: id, state });
githubEdit = (nodeId) => { send("github_edit_clicked", { node_id: nodeId }); /*open link*/ };

Quarto integration
 • Load the same analytics script on the Quarto site.
 • Add a source="quarto|app" prop on app_opened to segment embeds vs standalone.

Follow-up prompt
 • After copy_clicked or download_clicked, show a CTA modal.
 • If user enters email, post to your form endpoint; also log followup_opt_in:true.
 • Keep email out of analytics payloads; store it only in the form backend.

QA and governance
 • Define a Zod schema for event props and validate before sending.
 • Document event names and props in the repo. Enforce via type exports.
 • Add a sampling gate for noisy events (e.g., if (Math.random()<0.2)).

This gives reproducible funnels (e.g., app_opened → params_changed → brief_built → download_clicked → github_edit_clicked) with minimal code, strong privacy, and provider flexibility.
