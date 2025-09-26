import { useState } from 'react';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface Flashcard {
  id: string;
  type: 'definition' | 'comparison' | 'scenario';
  question: string;
  answer: string;
  hint?: string;
  entities?: string[];
}

const FLASHCARD_DECK: Flashcard[] = [
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

export function InstitutionalFlashcards() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());

  const currentCard = FLASHCARD_DECK[currentCardIndex];
  const progress = ((currentCardIndex + 1) / FLASHCARD_DECK.length) * 100;

  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % FLASHCARD_DECK.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCardIndex(
      prev => (prev - 1 + FLASHCARD_DECK.length) % FLASHCARD_DECK.length
    );
    setShowAnswer(false);
  };

  const markCompleted = () => {
    setCompletedCards(prev => new Set([...prev, currentCard.id]));
    setTimeout(nextCard, 500);
  };

  const resetDeck = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setCompletedCards(new Set());
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'definition':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comparison':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'scenario':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isCompleted = completedCards.has(currentCard.id);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-slate-900">
          Institutional Literacy Flashcards
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {currentCardIndex + 1} of {FLASHCARD_DECK.length}
          </span>
          <button
            onClick={resetDeck}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset deck"
          >
            <RotateCcw size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--ecic-purple)',
          }}
        />
      </div>

      {/* Card */}
      <div className="border border-slate-200 rounded-xl p-6 min-h-[300px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getCardTypeColor(currentCard.type)}`}
            >
              {currentCard.type.charAt(0).toUpperCase() +
                currentCard.type.slice(1)}
            </span>
            {isCompleted && (
              <CheckCircle size={20} className="text-green-600" />
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-heading font-semibold text-slate-900 leading-relaxed">
              {currentCard.question}
            </h4>

            {currentCard.hint && !showAnswer && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Hint:</span> {currentCard.hint}
                </p>
              </div>
            )}

            {showAnswer && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-slate-800 leading-relaxed">
                  {currentCard.answer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card actions */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prevCard}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="flex gap-3">
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="px-6 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--ecic-purple)' }}
              >
                Show Answer
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={markCompleted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Got It!
                </button>
                <button
                  onClick={nextCard}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <button
            onClick={nextCard}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Completion status */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {completedCards.size} of {FLASHCARD_DECK.length} completed
        </span>
        <span>
          {Math.round((completedCards.size / FLASHCARD_DECK.length) * 100)}%
          mastery
        </span>
      </div>
    </div>
  );
}
