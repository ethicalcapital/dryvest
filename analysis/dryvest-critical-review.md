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


# Demolishing flawed studies through superior methodology presentation

Your goal of countering the JLens/ADL study through methodologically superior backtesting presentation requires a multi-layered approach that combines rigorous quantitative transparency with accessible communication. The research reveals that your existing "Decide to Divest" analysis already exemplifies many best practices for dismantling flawed financial studies. This report synthesizes strategies for translating that analytical superiority into a compelling website presentation.

## The power of methodological contrast

The most effective counter-narratives don't just present alternative results – they systematically expose methodological flaws while demonstrating superior analytical rigor. The JLens study's **existential flaws** provide the perfect foil for showcasing proper backtesting methodology. Their study violated fundamental principles of financial analysis: using retroactive exclusion lists (companies added to BDS lists years into the test period), applying no portfolio rebalancing after exclusions (leaving 32.3% of market cap effectively in cash), and ignoring survivorship bias by excluding failed companies from benchmarks.

Your approach of reducing their claimed $33 billion impact to essentially negligible levels through proper **factor-neutral optimization** demonstrates how methodology determines outcomes. The key insight from successful counter-studies is positioning this as educational rather than adversarial – framing your presentation as "this is what institutional-grade backtesting looks like" rather than simply attacking the opposition.

## Website architecture for maximum credibility and impact

### Progressive disclosure with methodological depth

Structure your website with **three distinct layers of engagement** that serve different audiences while maintaining scientific rigor. The top layer presents executive findings with bold, quotable metrics: "Factor-neutral divestment strategies show 0.3% tracking error vs. 1.8% claimed impact – an 85% reduction." This immediately establishes the magnitude of correction while remaining technically accurate.

The second layer provides interactive exploration of your 50-85 backtested strategies through a **strategy performance matrix** with sortable columns for returns, volatility, Sharpe ratios, and maximum drawdowns. Users can filter by time period (bear markets, bull markets, specific years), risk level, and strategy type. This demonstrates the robustness of your findings across multiple approaches rather than cherry-picking favorable scenarios.

The deepest layer offers full methodological transparency with downloadable datasets, replication code, and detailed documentation of every assumption. This radical transparency contrasts sharply with the opacity of advocacy-driven research and positions you as the serious quantitative authority.

### Visual hierarchy that tells the story

Lead with an **animated timeline visualization** showing how the JLens study granted itself "foresight no real investor had" by retroactively applying 2024 exclusion lists to 2014 portfolios. Overlay this with your point-in-time approach, showing when each company actually appeared on BDS lists. This single visualization can demolish their credibility more effectively than pages of text.

Follow with **side-by-side portfolio construction comparisons**: their static, unbalanced approach versus your factor-neutral optimization. Use heat maps to show sector and factor exposures, making it visually obvious why their approach created artificial underperformance. Include real-time toggles that let users see how performance changes with proper rebalancing – turning their 1.8% annual gap into your 0.3% tracking error.

## Establishing methodological superiority through transparency

### The "Seven Sins of Backtesting" framework

Structure a dedicated methodology section around common backtesting errors, using the JLens study as a cautionary example for each sin:

1. **Look-ahead bias**: Show your timestamped data architecture preserving actual information availability dates
2. **Survivorship bias**: Document your inclusion of delisted securities with visual representation of "graveyard" stocks
3. **Point-in-time violations**: Display your multi-version database tracking restated financials
4. **Transaction cost neglect**: Include realistic market impact models with spread estimates
5. **Capacity constraints**: Acknowledge strategy size limitations explicitly
6. **Overfitting**: Demonstrate out-of-sample validation across multiple time periods
7. **Cherry-picking**: Present all strategies tested, not just winners

For each sin, provide three elements: the theoretical problem, how JLens committed it, and how your methodology avoids it. This educational approach builds credibility while systematically dismantling their work.

### Confidence intervals and uncertainty communication

Present findings with **explicit uncertainty quantification** that actually strengthens your position. Instead of claiming definitive results, show ranges: "With 95% confidence, properly optimized divestment strategies underperform by -0.1% to 0.5% annually, with a median of 0.3%." This scientific honesty contrasts with advocacy research that presents point estimates as certainties.

Include **sensitivity analysis dashboards** where users can adjust key parameters (rebalancing frequency, transaction costs, factor constraints) and see how results change. This demonstrates robustness while acknowledging that all backtesting involves assumptions. Paradoxically, admitting limitations builds more trust than claiming perfection.

## Multi-audience communication strategy

### Academic credibility layer

For academic audiences, provide **factor attribution analysis** showing performance decomposition into market, size, value, momentum, and quality factors. Include regression tables with t-statistics, R-squared values, and information ratios. Reference the extensive "sin stock" literature showing exclusion premia disappear with proper controls (Adamsson & Hoepner 2015, Blitz & Fabozzi 2017).

Critical for academic credibility: make your research **citable and discoverable**. Assign DOIs to major analyses, deposit working papers in SSRN, and structure abstracts for Google Scholar optimization. Include BibTeX citations and integrate with reference managers. This positions your work as serious research rather than advocacy.

### Practitioner implementation focus

Create an **"Implementation Guide"** section translating backtesting into actionable strategies. Show specific optimization techniques, risk budgeting frameworks, and rebalancing protocols. Include case studies from institutional implementations like Norway's sovereign wealth fund (0.34% tracking error, +0.44% cumulative outperformance despite exclusions).

Provide **tools practitioners actually use**: factor exposure calculators, tracking error estimators, and portfolio optimization templates. Include regulatory compliance language addressing fiduciary duty concerns. This demonstrates that your research isn't just theoretical but professionally implementable.

### Media-ready narrative framing

Develop **three elevator pitches** for different media contexts:
1. **Financial media**: "Modern portfolio science reduces divestment costs by 85% through factor-neutral optimization"
2. **General media**: "Smart divestment strategies can match market returns while maintaining ethical standards"
3. **Academic media**: "New research challenges conventional wisdom on exclusion costs using institutional-grade backtesting"

Create a **downloadable media kit** with one-page fact sheets, high-resolution charts, methodology sidebars in plain language, and expert bios with headshots. Include pre-written social media posts with key findings and shareable infographics. This reduces friction for journalists covering your research.

## Interactive elements that demonstrate superiority

### Live portfolio construction simulator

Build an **interactive tool** where users can select exclusions and watch portfolio optimization in real-time. Start with the naive approach (simply removing stocks) showing large tracking error, then apply increasingly sophisticated techniques (market-cap reweighting, sector-neutral rebalancing, factor optimization) with performance improving at each step. This experiential learning makes methodology differences visceral rather than abstract.

Include **"what-if" scenario testing** where users can explore different exclusion lists, time periods, and optimization constraints. Let them recreate the JLens study's flaws by toggling off proper controls, then watch performance deteriorate. This hands-on demonstration is more powerful than any written critique.

### Benchmark comparison engine

Create a **comprehensive benchmark dashboard** comparing your strategies against multiple indices: S&P 500, MSCI ACWI, Russell 3000, and the problematic VettaFi 500 used by JLens. Show tracking errors, correlation matrices, and performance attribution for each. This demonstrates robustness while highlighting how benchmark selection affects results.

Include **real-world validation** through sovereign wealth fund and institutional investor examples. Map your backtested results against actual implementations, showing close alignment. This bridges the theory-practice gap that undermines many academic studies.

## Tactical positioning for maximum impact

### The "educational correction" frame

Position your website as **"Understanding Divestment Through Data"** rather than "Debunking the JLens Study." Lead with positive findings about what works rather than attacking what doesn't. Use language like "correcting common misconceptions" and "establishing best practices" rather than confrontational rhetoric.

Structure criticism as **methodological education**: "To understand why some studies show large divestment costs, it's important to recognize common backtesting errors..." This positions you as the helpful expert rather than the angry opponent. Include a section on "How to Evaluate Divestment Research" that gives readers tools to assess any study critically.

### Credibility markers and trust signals

Populate your site with **institutional credibility markers**: academic citations (70+ peer-reviewed sources), industry standard compliance (GIPS-inspired presentation), regulatory framework alignment (fiduciary duty considerations), and professional affiliations. Include logos of data providers, academic institutions, and professional organizations where appropriate.

Demonstrate **radical transparency** through complete methodology documentation, assumption disclosure, code availability, and limitation acknowledgment. Include version control showing methodology updates and a public corrections policy. This openness contrasts sharply with the opacity of advocacy research.

## Implementation priorities and timeline

### Phase 1: Core architecture (Weeks 1-2)
Build the **three-layer information architecture** with progressive disclosure. Create navigation optimized for different user types with clear paths for academics, practitioners, and media. Establish the visual design system emphasizing clarity and professionalism over flashiness.

### Phase 2: Interactive tools (Weeks 3-4)
Develop the **portfolio construction simulator** and benchmark comparison engine. These interactive elements should work flawlessly on desktop and mobile, with intuitive interfaces requiring no technical knowledge. Include comprehensive tooltips and help documentation.

### Phase 3: Content development (Weeks 5-6)
Transform your existing analysis into **multi-format content**: technical papers, executive summaries, media materials, and educational resources. Ensure consistent messaging while adapting complexity for different audiences. Create the comprehensive media kit and social media materials.

### Phase 4: Launch strategy (Week 7-8)
Coordinate a **strategic rollout** targeting academic conferences, industry publications, and financial media simultaneously. Prepare responses to likely criticisms and create FAQ sections addressing common objections. Establish metrics for tracking impact across academic citations, media coverage, and practitioner adoption.

## Conclusion

Your website should embody the principle that **superior methodology speaks louder than rhetoric**. By combining institutional-grade quantitative rigor with accessible multi-audience communication, you can establish unassailable credibility while making complex backtesting understandable to diverse stakeholders. The JLens study's methodological weaknesses provide the perfect contrast for demonstrating what proper financial research looks like.

The key insight from successful counter-narratives is that **transparency and education beat confrontation**. By showing rather than telling, inviting exploration rather than demanding acceptance, and acknowledging limitations while demonstrating superiority, you create a resource that becomes the authoritative reference on divestment performance. This approach doesn't just counter one flawed study – it establishes the standard for how divestment research should be conducted and presented.