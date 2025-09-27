import { useState } from 'react';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import {
  INSTITUTIONAL_FLASHCARDS,
  type InstitutionalFlashcard,
} from '../data/institutionalFlashcards';

export function InstitutionalFlashcards() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());

  const currentCard = INSTITUTIONAL_FLASHCARDS[currentCardIndex];
  const progress =
    ((currentCardIndex + 1) / INSTITUTIONAL_FLASHCARDS.length) * 100;

  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % INSTITUTIONAL_FLASHCARDS.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCardIndex(
      prev =>
        (prev - 1 + INSTITUTIONAL_FLASHCARDS.length) %
        INSTITUTIONAL_FLASHCARDS.length
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

  const getCardTypeColor = (type: InstitutionalFlashcard['type']) => {
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-semibold text-slate-900">
            Institutional Literacy Flashcards
          </h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Learn the assessment questions that separate empty promises from real
            accountability. Use each prompt to benchmark how seriously an
            institution is acting on your demands.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              document.getElementById('quality-guide')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
            className="inline-flex items-center rounded-lg border border-indigo-600 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Review assessment rubric
          </button>
          <span className="text-sm text-slate-600">
            {currentCardIndex + 1} of {INSTITUTIONAL_FLASHCARDS.length}
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
          {completedCards.size} of {INSTITUTIONAL_FLASHCARDS.length} completed
        </span>
        <span>
          {Math.round(
            (completedCards.size / INSTITUTIONAL_FLASHCARDS.length) * 100
          )}%
          mastery
        </span>
      </div>
    </div>
  );
}
