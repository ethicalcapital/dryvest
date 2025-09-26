import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  focus: string;
  bad: string;
  ok: string;
  great: string;
}

const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 'exclusion_policy',
    question:
      'What is the policy regarding exclusion for companies involved in activities deemed "categorically unacceptable?"',
    focus: 'Absolute Ethical Constraints',
    bad: '"We apply a minimum ESG score threshold across all companies, so severe violations will reduce their rating."',
    ok: '"We exclude investments in cluster munitions and landmines, as adherence to international conventions is an absolute standard for exclusion."',
    great:
      '"We employ binary, non-negotiable exclusionary screens for all product-based violations (e.g., controversial weapons, tobacco) and transversal violations based on confirmed conduct (e.g., Forced Labor, UN Global Compact breaches), which triggers Stage 1: Pre-emptive Screening."',
  },
  {
    id: 'impact_measurement',
    question:
      'How is the success of your non-financial objective (e.g., reducing harm, promoting justice) quantified and measured as a real-world outcome?',
    focus: 'Measurable Impact/Goals',
    bad: '"We aim to \'do good\' and use active ownership to help companies improve their general social policies."',
    ok: '"We report on our portfolio\'s overall carbon footprint and compare it to peer benchmarks, in line with net-zero methodologies."',
    great:
      '"We require measurable outcomes aligned with client objectives. For example, we track a company\'s specific Animal Agriculture Interference Index (AAII) score or demand quantification of the percentage of Gross Gaming Revenue derived from high-risk players (as disclosed by Kindred Group)."',
  },
  {
    id: 'engagement_credibility',
    question:
      'If engagement fails to produce material change, is there a credible threat of definitive divestment, and what is the penalty or accountability measure for failure?',
    focus: 'Credibility and Incentives',
    bad: '"We utilize ongoing dialogue because divestment has little financial effect and is generally ineffective for social change."',
    ok: '"We engage in dialogue with companies suspected of violating norms and recommend exclusion only as a last resort if dialogue fails or progress is insufficient within a reasonable timeframe (e.g., four years)."',
    great:
      '"We use a quantitative Engagement Value Model (EVM). If $E[V_{engage}] \\le E[V_{exclude}]$, the security is excluded. Furthermore, top management compensation is formally tied to non-financial sustainability metrics to ensure objectives are integrated."',
  },
  {
    id: 'divestment_mechanics',
    question:
      'If a holding subsequently fails an ethical screen, what is the explicitly defined divestment schedule and why?',
    focus: 'Implementation Mechanics',
    bad: '"We sell the stock immediately upon receiving confirmation of non-compliance." (Implies potential portfolio shock)',
    ok: '"We divest gradually over several months to avoid a fire sale, which allows us to capitalize on any interim rallies in the sector."',
    great:
      '"We implement a phased divestment schedule, executed over a 30- to 60-day period. This is a strategic risk management protocol designed to minimize tracking error and preserve the integrity and purity of the quantitative factor signal that drives alpha generation."',
  },
  {
    id: 'data_transparency',
    question:
      'Which publicly maintained activist or NGO databases are formally used as mandatory data inputs or triggers for your exclusion policy?',
    focus: 'Data Transparency & Source Alignment',
    bad: '"We rely exclusively on the data feeds provided by our commercial third-party ESG rating providers."',
    ok: '"We consult the Business & Human Rights Resource Centre (BHRRC) to track allegations of human rights abuses as an early-warning indicator."',
    great:
      '"Our policy formally names and mandates the use of Tier 1 activist-maintained sources, such as the UFLPA Entity List (for modern slavery/forced labor) and the AFSC Investigate Project, to ensure our process is robust and evidence-based."',
  },
  {
    id: 'political_interference',
    question:
      'What is your quantified metric or policy for screening political interference that undermines ethical goals?',
    focus: 'Addressing Conflicting Conduct',
    bad: '"We accept that lobbying is a necessary function for business operations and do not screen for it, focusing only on product revenue."',
    ok: '"We encourage companies to disclose any direct or indirect lobbying expenditures via trade associations."',
    great:
      '"We use models like the Animal Agriculture Interference Index (AAII) or track data from the ASH Lobbyist Tracker to quantify the \'interference footprint\' of a company, treating political spending designed to undermine public health or climate regulation as a material risk factor."',
  },
  {
    id: 'financial_tradeoff',
    question:
      'How do you quantify and manage the financial trade-off (opportunity cost) associated with imposing ethical constraints?',
    focus: 'Financial Integrity & Fiduciary Duty',
    bad: '"Our fiduciary duty requires us to maximize returns, so we only invest in ethical funds if they outperform the market."',
    ok: '"We communicate the explicit opportunity cost to our clients, framing it as an acceptable financial sacrifice for upholding ethical fidelity."',
    great:
      '"The Investment Committee sets a formal tracking error budget (e.g., 1.5% annualized). This budget quantifies our tolerance for ethical divergence and allows us to determine the optimal screening intensity needed to preserve the integrity of our core quantitative strategy while meeting our dual objectives."',
  },
];

export function ResponseQualityGuide() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(prev => (prev === questionId ? null : questionId));
  };

  const getResponseIcon = (type: 'bad' | 'ok' | 'great') => {
    switch (type) {
      case 'bad':
        return <XCircle size={16} className="text-red-500" />;
      case 'ok':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'great':
        return <CheckCircle size={16} className="text-green-600" />;
    }
  };

  const getResponseBgColor = (type: 'bad' | 'ok' | 'great') => {
    switch (type) {
      case 'bad':
        return 'bg-red-50 border-red-200';
      case 'ok':
        return 'bg-amber-50 border-amber-200';
      case 'great':
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
          Are They Taking You Literally or Seriously?
        </h3>
        <p className="text-sm text-slate-600">
          Use these questions to assess whether an institution is offering
          performative compliance or genuine commitment. Great answers show
          quantifiable processes, specific metrics, and accountability
          mechanisms.
        </p>
      </div>

      <div className="space-y-3">
        {ASSESSMENT_QUESTIONS.map(q => (
          <div key={q.id} className="border border-slate-200 rounded-lg">
            <button
              onClick={() => toggleQuestion(q.id)}
              className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {q.focus}
                  </span>
                </div>
                <h4 className="font-heading font-medium text-slate-900 text-sm">
                  {q.question}
                </h4>
              </div>
              <div className="ml-4">
                {expandedQuestion === q.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </div>
            </button>

            {expandedQuestion === q.id && (
              <div className="px-4 pb-4 space-y-3">
                {/* Bad Answer */}
                <div
                  className={`p-3 rounded border ${getResponseBgColor('bad')}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getResponseIcon('bad')}
                    <span className="text-sm font-medium text-slate-900">
                      Literal/Performative Response
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 italic">{q.bad}</p>
                </div>

                {/* OK Answer */}
                <div
                  className={`p-3 rounded border ${getResponseBgColor('ok')}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getResponseIcon('ok')}
                    <span className="text-sm font-medium text-slate-900">
                      Some Process/Awareness
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 italic">{q.ok}</p>
                </div>

                {/* Great Answer */}
                <div
                  className={`p-3 rounded border ${getResponseBgColor('great')}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getResponseIcon('great')}
                    <span className="text-sm font-medium text-slate-900">
                      Serious Commitment/Quantifiable
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 italic">{q.great}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="mt-4 p-3 rounded-lg border"
        style={{
          backgroundColor: 'rgba(20, 184, 166, 0.05)',
          borderColor: 'var(--ecic-teal)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-dark)' }}>
          <strong>Pro Tip:</strong> Institutions that take you seriously will
          provide specific metrics, named data sources, defined timelines, and
          clear accountability mechanisms. Vague commitments to "do good" or
          "improve ESG" are red flags for performative compliance.
        </p>
      </div>
    </div>
  );
}
