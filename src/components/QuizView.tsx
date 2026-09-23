import React, { useState } from 'react';
import { Question } from '../types';
import { HelpCircle, ChevronRight, ChevronLeft, Check, AlertCircle, Sparkles } from 'lucide-react';

interface QuizViewProps {
  questions: Question[];
  moduleTitle: string;
  isUnlocked: boolean;
  onSubmit: (score: number, total: number, answers: Record<string, number>) => void;
  onScrollToVideo: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  moduleTitle,
  isUnlocked,
  onSubmit,
  onScrollToVideo
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Assessment Gated: Complete the Video First
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          In order to attempt this 5-question process evaluation for <span className="font-semibold text-slate-700">{moduleTitle}</span>, you must watch the mandatory training video completely (100%).
        </p>
        <button
          onClick={onScrollToVideo}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <span>Watch Training Video to Unlock Quiz</span>
        </button>
      </div>
    );
  }

  const currentQ = questions[activeQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
    setValidationError(null);
  };

  const handleNext = () => {
    if (activeQuestionIndex < totalQuestions - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!isAllAnswered) {
      setValidationError(`Please answer all ${totalQuestions} questions before submitting. (${answeredCount}/${totalQuestions} answered)`);
      return;
    }

    setIsSubmitting(true);

    // Calculate score
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });

    // Simulate short submission evaluation delay for dramatic effect
    setTimeout(() => {
      onSubmit(score, totalQuestions, selectedAnswers);
    }, 600);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Assessment Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
            Mandatory Process Assessment · 5 Questions
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {moduleTitle}
          </h3>
        </div>

        {/* Question Counter / Navigation dots */}
        <div className="flex items-center gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === activeQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200'
                    : isAnswered
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
          <span>Question {activeQuestionIndex + 1} of {totalQuestions}</span>
          <span>Single Choice (MCQ)</span>
        </div>

        <h4 className="text-base md:text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h4>

        {/* 4 Options Grid */}
        <div className="space-y-3 mb-8">
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = selectedAnswers[currentQ.id] === optIdx;
            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : optionLetters[optIdx]}
                </div>
                <div className="text-sm text-slate-800 leading-snug">
                  {optionText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Footer Navigation & Submit */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={activeQuestionIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-3">
            {activeQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Evaluating Score...' : 'Submit Assessment'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
