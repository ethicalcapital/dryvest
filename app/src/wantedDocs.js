export const WANTED_DOCS = [
  {
    id: "active_manager_performance",
    title: "Active manager performance distribution & factor usage",
    status: "open",
    priority: "high",
    summary:
      "Map how often active managers actually beat their benchmarks and catalog the factor stories they rely on so organizers can rebut vague performance promises.",
    context:
      "Boards keep hearing that \"our active managers will handle it\". We need hard evidence about dispersion, persistence, and the factor narratives managers deploy when they resist exclusion mandates.",
    deliverables: [
      "Quantitative distribution of excess returns across 1/3/5/10-year windows using SPIVA, Morningstar Active/Passive, and academic meta-analyses.",
      "Cost drag breakdown (fees, turnover, market impact) segmented by vehicle type (mutual funds, SMAs, hedge funds, private credit).",
      "Factor taxonomy mapping disciplined quantitative premia vs. hype themes, with evidence strength call-outs and enforcement/explosion examples.",
      "Due-diligence question bank activists can hand trustees to pin managers down on data quality, crowding, capacity, drawdown controls, and governance.",
      "Reporting template forcing quarterly disclosure of factor exposures, hit rates, active share, ex-ante/ex-post risk, and qualitative accountability notes."
    ],
    sources: [
      "S&P SPIVA scorecards",
      "Morningstar Active/Passive Barometer",
      "CFA Institute Research Foundation monographs",
      "BIS papers on factor crowding",
      "SEC enforcement actions on misleading factor claims"
    ],
    prompt:
      "You are supporting Dryvest, an educational divestment brief builder. Produce an evidence pack on active manager performance dispersion and factor usage.\n\n1. Summarize the distribution of excess returns vs. benchmarks over 1/3/5/10-year windows, segmented by asset class and geography, using SPIVA, Morningstar Active/Passive, Fama-French/Cremers-Petajisto style research, and other peer-reviewed sources.\n2. Quantify cost drag from fees, turnover, and implementation frictions (mutual funds, SMAs, hedge funds, private strategies).\n3. Build a taxonomy of factor narratives (value, momentum, quality, low vol, thematic marketing, etc.) rating the evidence strength and flagging dubious claims or enforcement cases.\n4. Draft governance materials: diligence questions investment committees should ask, and a quarterly reporting template covering factor exposures, hit rates, active share, ex-ante/ex-post risk, and qualitative accountability.\n\nDeliver citations for every quantitative claim, note data vintages, and flag gaps where we still need primary research.",
    tags: ["analytics", "performance", "governance"]
  },
  {
    id: "lgip_statute_brief",
    title: "Municipal & state investment pools (LGIPs)",
    status: "open",
    priority: "high",
    summary:
      "Help treasurers and activists set conduct-based guardrails for Local Government Investment Pools without breaking statute or cash management mandates.",
    context:
      "LGIPs sit between retail cash and institutional portfolios; organizers must know statutory limits before requesting exclusions so the conversation stays credible and actionable.",
    deliverables: [
      "Matrix of state investment codes, SEC Rule 2a-7 analogs, collateral mandates, and approved counterparty lists that govern LGIP holdings.",
      "Implementation spectrum comparing approved issuer lists, collateral tweaks, correspondent banking analogs, and conduct overlays that remain within statute.",
      "Motivation framing matrix for compliance teams, elected officials, and community coalitions including the \"investments align with identity\" outcome.",
      "Messaging briefs for treasurers, city councils, and rating-agency conversations highlighting fiduciary and political guardrails.",
      "Quick wins vs. structural shifts decision tree plus transparency requirements (public notice, dashboard practices, advisory committees)."
    ],
    sources: [
      "State treasury investment manuals",
      "GASB guidance",
      "SEC releases on cash management",
      "Municipal investment policy statements",
      "Case law on fiduciary duties in pooled cash funds"
    ],
    prompt:
      "You are supporting Dryvest. Build a municipal treasury briefing that lets activists and staff evaluate divestment options for Local Government Investment Pools (LGIPs).\n\nCover: (a) statutory perimeters (state codes, Rule 2a-7 analogs, collateral mandates, approved counterparties); (b) a menu of compliant implementation pathways (conduct-based issuer lists, collateral policy tweaks, correspondent banking strategies); (c) motivation framing for regulators, elected officials, and community coalitions including \"investments align with identity\" outcomes; (d) messaging packs for treasurers, councils, and rating agencies; and (e) quick wins versus structural changes plus transparency obligations.\n\nCite every statutory or regulatory claim, flag jurisdictions with unusual constraints, and note where further legal review is required.",
    tags: ["policy", "treasury", "statute"]
  },
  {
    id: "central_bank_reserves",
    title: "Central bank reserve portfolios",
    status: "open",
    priority: "medium",
    summary:
      "Frame conduct-based divestment moves for reserve managers without jeopardizing perceptions of central bank independence or liquidity mandates.",
    context:
      "Central banks face scrutiny for politicisation risk. We need language that respects statutory independence while addressing human-rights conduct screens and reserve adequacy.",
    deliverables: [
      "Mandate analysis covering price stability, reserve adequacy, independence, and BIS/IMF guidance on reserve management.",
      "Implementation spectrum for counterparty exclusions, collateral frameworks, tranching, and sustainability-linked deposits with FX/liquidity implications.",
      "Motivation matrix translating regulatory, internal leadership, and external stakeholder pressure into central-bank-safe framing.",
      "Governance & communications kit (sample board minutes, parliamentary testimony framing, market-signalling guardrails).",
      "Risk-control checklist covering liquidity coverage, FX hedging, sanctions alignment, and reputational safeguards, plus case snapshots (NBIM, ECB green portfolios, EM experiments)."
    ],
    sources: [
      "BIS and IMF reserve management handbooks",
      "Central bank annual reports",
      "Rating-agency commentary",
      "Academic work on central bank sustainability mandates"
    ],
    prompt:
      "Support Dryvest by drafting a reserve-management briefing that shows how central banks can incorporate conduct-based divestment while preserving independence.\n\nInclude: mandate analysis (price stability, reserve adequacy, statutory independence, BIS/IMF playbooks); implementation pathways (counterparty exclusions, collateral frameworks, sustainability-linked deposits, liquidity tranching); motivation framing for regulatory risk, internal leadership priorities, and external stakeholder pressure; governance/communications guidance (board minutes, parliamentary testimony, market signalling); and a risk-control dashboard (liquidity coverage, FX hedging, sanctions coordination, reputational safeguards) with case studies (NBIM, ECB green programs, emerging market pilots).\n\nFlag treaty constraints, note data sources, and separate what is already in market from speculative ideas.",
    tags: ["central_bank", "mandate", "governance"]
  },
  {
    id: "sovereign_wealth_alignment",
    title: "Sovereign wealth fund mission alignment",
    status: "open",
    priority: "medium",
    summary:
      "Equip activists with templates for aligning sovereign wealth fund portfolios to national policy goals while maintaining market credibility.",
    context:
      "SWFs balance political mandates with global market discipline. Dryvest needs reusable language for governance, implementation, and stakeholder framing rooted in Santiago Principles expectations.",
    deliverables: [
      "Governance guardrails (charters, parliamentary oversight mechanics, Santiago Principles scorecards).",
      "Implementation pathways across liquidity buckets (policy overlays, co-investment screens, mandate rewrites, development-finance tie-ins).",
      "Motivation matrix for regulatory drivers, internal leadership, and public stakeholder expectations emphasising \"investments align with identity\" outcomes.",
      "Messaging kit for fund boards, government sponsors, external managers, and ratings agencies.",
      "Risk management and transparency checklist (sanctions exposure, geopolitical backlash, return volatility).",
      "Case studies: NBIM, NZ Super, Temasek, AP Funds, others."
    ],
    sources: [
      "Parliamentary and annual reports",
      "Consultant audits (PwC, EY, KPMG sovereign teams)",
      "Santiago Principles assessments",
      "Academic analyses on SWF governance"
    ],
    prompt:
      "Support Dryvest by drafting a sovereign-wealth mission-alignment guide rooted in the Santiago Principles.\n\nProduce: a governance guardrail summary (charters, oversight, scorecards); implementation menu across liquidity buckets (policy overlays, co-investment screens, development-finance tie-ins); motivation framing for regulatory, leadership, and stakeholder pressures with an \"investments align with identity\" through-line; messaging packs for boards, sponsors, managers, and ratings agencies; a risk/transparency checklist; and detailed case studies (NBIM, NZ Super, Temasek, AP Funds, others).\n\nSource every claim, note data vintage, and highlight tensions between policy mandates and market credibility.",
    tags: ["swf", "policy", "stakeholders"]
  }
];
