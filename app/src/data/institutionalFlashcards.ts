export type InstitutionalFlashcardType = 'definition' | 'comparison' | 'scenario';

export interface InstitutionalFlashcard {
  id: string;
  type: InstitutionalFlashcardType;
  question: string;
  answer: string;
  hint?: string;
  entities?: string[];
}

export const INSTITUTIONAL_FLASHCARDS: InstitutionalFlashcard[] = [
  {
    id: 'pension_vs_endowment_time',
    type: 'comparison',
    question:
      'What is the key difference in time horizon between a pension fund and an endowment?',
    answer:
      'Pensions have defined obligations (20-30 years to beneficiaries), while endowments are perpetual (designed to last forever).',
    hint: 'Think about when the money needs to be paid out',
    entities: ['corporate_pension', 'endowment'],
  },
  {
    id: 'endowment_withdrawal',
    type: 'definition',
    question:
      'What is the typical annual withdrawal rate for university endowments?',
    answer:
      '4-5% annual spending rate, designed to preserve principal in perpetuity while funding operations.',
    hint: 'This rate balances current needs with future sustainability',
  },
  {
    id: 'foundation_vs_endowment',
    type: 'comparison',
    question:
      'How do the stakeholders differ between a foundation and an endowment?',
    answer:
      'Foundations serve beneficiary communities and social causes, while endowments primarily serve students, faculty, and the academic mission.',
    hint: "Consider who benefits from each institution's activities",
    entities: ['foundation', 'endowment'],
  },
  {
    id: 'pension_erisa',
    type: 'scenario',
    question:
      'Why might a corporate pension fund be more conservative about exclusionary screening than an endowment?',
    answer:
      'Corporate pensions are bound by ERISA fiduciary duties that require serving participant interests above all else, while endowments have more flexibility for mission alignment.',
    hint: "Think about legal constraints and who they're legally required to serve",
    entities: ['corporate_pension'],
  },
  {
    id: 'sovereign_wealth_variety',
    type: 'definition',
    question:
      'What are the three main types of sovereign wealth funds and their different purposes?',
    answer:
      'Stabilization funds (counter-cyclical economic support), Savings funds (intergenerational wealth preservation), and Development funds (economic growth and diversification).',
    hint: 'Think about when and why governments create these funds',
  },
  {
    id: 'public_vs_corporate_pension',
    type: 'comparison',
    question:
      'How does political oversight differ between public and corporate pension funds?',
    answer:
      'Public pensions face direct political oversight and public transparency requirements, while corporate pensions are primarily overseen by trustees serving participant interests.',
    hint: 'Consider who has ultimate authority over decisions',
    entities: ['public_pension', 'corporate_pension'],
  },
  {
    id: 'insurance_liability_matching',
    type: 'scenario',
    question:
      "Why would an insurance company's investment approach be more constrained than an endowment's?",
    answer:
      'Insurance companies must match their investments to policy obligations and claims patterns, while endowments can take a long-term growth approach.',
    hint: 'Think about predictable vs. unpredictable cash flows',
    entities: ['insurance', 'endowment'],
  },
  {
    id: 'foundation_distribution',
    type: 'definition',
    question:
      'What is the minimum annual distribution requirement for private foundations?',
    answer:
      '5% of assets must be distributed annually for charitable purposes, as required by IRS regulations.',
    hint: 'This is a legal requirement, not a guideline',
  },
  {
    id: 'central_bank_independence',
    type: 'scenario',
    question:
      'Why might a central bank approach ethical screening differently than a sovereign wealth fund?',
    answer:
      'Central banks prioritize monetary policy independence and political neutrality, while sovereign wealth funds can align with national development goals.',
    hint: 'Consider the importance of perceived political independence',
    entities: ['central_bank', 'government'],
  },
  {
    id: 'stakeholder_complexity',
    type: 'comparison',
    question:
      'Which institution type typically has the most complex stakeholder environment: endowment, foundation, or public pension?',
    answer:
      'Public pensions, because they must balance participants, retirees, taxpayers, legislative bodies, and citizens - all with potential conflicts.',
    hint: 'Think about who can influence decisions and create pressure',
    entities: ['public_pension', 'endowment', 'foundation'],
  },
];

const sanitizeField = (value: string) =>
  value.replace(/\t/g, '    ').replace(/\r?\n/g, ' ').trim();

export function buildAnkiTsv(
  cards: InstitutionalFlashcard[],
  options: { includeHints?: boolean; includeEntities?: boolean } = {}
): string {
  const { includeHints = true, includeEntities = true } = options;
  const header = ['Front', 'Back'];
  if (includeHints) header.push('Hint');
  if (includeEntities) header.push('Entities');
  const rows = cards.map(card => {
    const base = [sanitizeField(card.question), sanitizeField(card.answer)];
    if (includeHints) {
      base.push(card.hint ? sanitizeField(card.hint) : '');
    }
    if (includeEntities) {
      base.push(card.entities ? sanitizeField(card.entities.join(', ')) : '');
    }
    return base.join('\t');
  });
  return [header.join('\t'), ...rows].join('\n');
}
