---
title: "Footnotes For Fiduciaries"
subtitle: "Stockpicking is Still Legal"
author: "Sloane Ortel"
format:
  revealjs:
    theme: default
    transition: slide
    incremental: true
---

## Does Divestment Destroy Portfolios?

Will BDS-related divestment materially harm endowment returns?

- Recent JLens/ADL study claims **$33.2 billion** in foregone returns
- Huge, if true

## What This Presentation Covers

1. **The JLens Charges** - What they found, why it's invalid
2. **Performance Reality** - What actually happens with professional divestment
3. **Fiduciary Framework** - How to implement exclusions properly
4. **Implementation Guide** - Concrete steps for boards and trustees

---

# Part 1: Problems 1-3 of ???

## 0. Selection Bias

- **Method:**  "focused and conservative" approach excluded 38 companies,
- **Finding:** Measured performance gap 1.8% annual underperformance (11.1% vs 12.9% returns)
- **Projection:** $33.2 billion foregone over 10 years

[todo:verify] total companies on underlying lists
N were small or private,
38 company sample represented 32% of the S&P 500

## 1. Unusual Time Period

- Applied 2024 exclusion list to entire 2014-2024 period
- Several cited weren't operational in early study years

[maybe it's a timeline of when they were formed]

- Don't Buy into Occupation Coalition: Formed January 2021
- OHCHR Database: First published February 2020
- AFSC Investigate: 2019?

### 2. Statistical Malpractice

- "38 companies excluded and **no other adjustments made**"
- Tracking error of 1.64% - essentially equals claimed underperformance
- No rebalancing, optimization, or professional management

```{python}
#| echo: false
#| fig-width: 10
#| fig-height: 6

import matplotlib.pyplot as plt
import numpy as np

# Data for the chart
categories = ['JLens Study\n(Malpractice)', 'Norway GPFG\n(Professional)', 'Industry Best\nPractice Target']
tracking_error = [1.64, 0.4, 0.3]  # Annual tracking error in %
claimed_impact = [1.8, -0.044, 0.0]  # Claimed/actual performance impact in %

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

# Tracking Error Chart
bars1 = ax1.bar(categories, tracking_error,
                color=['#d62728', '#2ca02c', '#1f77b4'], alpha=0.7)
ax1.set_ylabel('Annual Tracking Error (%)')
ax1.set_title('Tracking Error: JLens vs Professional Implementation')
ax1.set_ylim(0, 2.0)

# Add value labels on bars
for bar, value in zip(bars1, tracking_error):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height + 0.05,
             f'{value}%', ha='center', va='bottom', fontweight='bold')

# Performance Impact Chart
bars2 = ax2.bar(categories, claimed_impact,
                color=['#d62728', '#2ca02c', '#1f77b4'], alpha=0.7)
ax2.set_ylabel('Performance Impact (%)')
ax2.set_title('Performance Impact: Claimed vs Actual')
ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
ax2.set_ylim(-0.2, 2.0)

# Add value labels on bars
for bar, value in zip(bars2, claimed_impact):
    height = bar.get_height()
    y_pos = height + 0.05 if height >= 0 else height - 0.15
    ax2.text(bar.get_x() + bar.get_width()/2., y_pos,
             f'{value}%', ha='center', va='bottom' if height >= 0 else 'top',
             fontweight='bold')

plt.tight_layout()
plt.show()
```

**Key Insight:** Jlens' benchmark (Vettafi 500) had annual tracking error vs the S&P 500 that explains 91% of their claimed underperformance.

## Their Study Cannot Be Replicated

JLens won't disclose:

- Data sources
- Rebalancing methodology
- What "no other adjustments" means

**Non-replicable results are invalid** in both academic and investment contexts.

**It's OK To Criticize Active Managers**

On average, we underperform.

27 percent of respondents adhere to environmental, social, and governance (ESG) investing strategies; 14 percent use negative screening, a process that avoids investments in certain stocks or industries; and 8 percent reported impact investing,

- **Active stock-picking:** Concentrated portfolios, active management, embrace tracking error
- **Optimized indexing:** Factor-neutral rebalancing, minimal tracking error
- **Screened benchmarks:** Purpose-built indexes with exclusions built-in
- **Overlay strategies:** Third-party optimization on top of existing managers

**Key Point:** Even if JLens's approach were credible for index strategy, it wouldn't prove BDS is good or bad for portfolio returns. There are many ways to manage a portfolio professionally.

---

# Part 2: Performance Reality Check

## What Actually Happens

Professionally managed exclusions track benchmarks within **basis points**, not percentage points.

## Institutional Scorecard

| Institution | Scope | Return Impact | Risk Controls |
|-------------|-------|---------------|---------------|
| **NBIM (Norway)** | 180+ exclusions | +0.44% cumulative contribution | Tracking error 0.3–0.5% |
| **UC Regents** | Fossil fuel divestment | CIO: "financial risk management" | Consultant oversight + phased exit |
| **PFZW / KLP** | Settlement exclusions | Neutral-to-positive impact | Vendor optimization + quarterly reviews |

## Academic Evidence

- **Trinks & Scholtens (2018):** 90 years of data - divestment "does not significantly impair financial performance"
- **EDHEC (2023):** Professional optimization reduces tracking error by 80-90%
- **Plantinga & Scholtens (2021):** 40-year study finds differences of "a few basis points"

## Why Naïve Studies Fail

- **Static lists applied retroactively** ignore point-in-time information
- **"No other adjustments"** = fiduciary malpractice
- **Tracking error parity** with claimed losses proves incompetent modeling

---

# Part 3: The Norway Model Framework

## Why Boards Need This

- Turns "divest" into a governance motion with tracking-error discipline
- Shows trustees how to deliver exclusions without breaching prudence
- Mirrors how NBIM, PFZW, and UC Regents structure conduct screens

## Core Decision Framework

### 1. Mandate & Guardrails

- Adopt written conduct criteria referencing international law
- Set **tracking-error budget (≤30 bps)** and require factor/sector neutrality
- Delegate execution to CIO/consultants while retaining policy oversight

### 2. Phased Implementation

- **Immediate:** Stop new purchases, log current exposure
- **30-60 days:** Exit via orderly trading schedule (avoid divestment shock)
- **Quarterly:** Certify reinvestment into benchmark-aligned replacements

### 3. Reporting & Transparency

- Publish exclusion rationale, evidence citations, and guardrails
- Require quarterly one-page dashboards (tracking error, factor exposure, progress)
- Create appeals/exception process with time limits and public log

## Implementation Practices that Preserve Returns

- Set explicit tracking-error guardrail (≤30 bps) and require factor/sector neutrality
- Reinvest promptly to avoid cash drag; use screened indexes or optimization overlays
- Phase trades (30–60 days) with compliance sign-off to avoid market impact
- Monitor via quarterly analytics (tracking error, factor deltas, contribution to return)

---

# Part 4: Implementation Checklist

## For Board Members & Trustees

### Evidence You Can Cite

- **NBIM (Norway) 2024 Report** – 0.3–0.5% tracking error; exclusions added +0.44% cumulative return
- **UC Regents 2020 Fossil Fuel Divestment** – expressly labeled "financial risk management"
- **EDHEC 2023 Optimization Study** – professional rebalancing cuts tracking error by 80–90%

### Fiduciary Considerations

1. **Risk Management:** Can exclusions be implemented within acceptable tracking error limits?
2. **Professional Implementation:** Will portfolio management employ optimization techniques?
3. **Stakeholder Alignment:** How do exclusions align with institutional mission?
4. **Performance Monitoring:** What governance ensures ongoing assessment of impact?

## For Staff Implementation

- Update IPS / investment policy statement with conduct language + tracking error budget
- Instruct index/active managers to load exclusion list + optimization constraints
- Coordinate consultant to run pre/post analytics (tracking error, factor tilts, liquidity)
- Document phased trade plan and compliance attestations
- Schedule annual policy review plus event-driven updates

## Minimum Standards for Any Study

Future analysis of divestment impacts should include:

- **Point-in-time exclusion lists** reflecting realistic investor experience
- **Full methodological transparency** enabling independent replication
- **Multiple implementation scenarios** from naive to professionally optimized
- **Multi-period analysis** avoiding cherry-picked market regimes

---

# Conclusion

##

## For Fiduciaries: The Path Forward

Use the Norway Model framework to implement exclusions professionally:

- Set tracking error guardrails (≤30 bps)
- Require factor-neutral optimization
- Phase implementation over 30-60 days
- Publish transparent reporting

**Any trustee considering the JLens study should demand complete methodology disclosure and comparison with actual institutional implementations.**

## The JLens Study is Invalid Because

1. **Non-replicable methodology** - cannot be verified by third parties
2. **Implementation malpractice** - approach would expose fiduciaries to legal liability
3. **Temporal inconsistency** - applies future information to past decisions

## What We Know from Real Evidence

- Norway ($1.4T): +0.44% from exclusions with 0.3-0.5% tracking error
- UC System ($126B): Successful divestment as "risk management"
- Academic consensus: Impact measured in basis points, not percentage points

---

# About This Analysis

## About Ethical Capital

- Utah registered investment adviser
- Manages concentrated ethical portfolios (embraces tracking error)
- Contact: <hello@ethicic.com> · +1 (347) 625 9000
- Screening policy: <https://ethicic.com/content/process/screening-policy>

## About Dryvestment

- Google translate for activists and fiduciaries
- Produces educational briefs only—no individual investment advice
- Outputs are versioned and updated as research evolves

*This analysis is provided to support evidence-based policy discussion. We welcome transparency from any party to enable replication and verification.*
