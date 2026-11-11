import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OOP_QUIZ_QUESTIONS } from '@/data/oopConceptsData';
import { Award, CheckCircle2, XCircle, RotateCcw, HelpCircle } from 'lucide-react';

export const ConceptQuiz: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

  const totalQuestions = OOP_QUIZ_QUESTIONS.length;
  const checkedCount = Object.keys(checkedQuestions).length;
  const correctCount = OOP_QUIZ_QUESTIONS.filter(
    (q) => checkedQuestions[q.id] && selectedAnswers[q.id] === q.correctIndex
  ).length;

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (checkedQuestions[questionId]) return; // Lock after checking
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckQuestion = (questionId: string) => {
    if (selectedAnswers[questionId] === undefined) return;
    setCheckedQuestions((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCheckedQuestions({});
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              C++17 OOP Architecture Knowledge Check
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {totalQuestions} verified questions strictly grounded in the production backend implementation
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge
              variant={checkedCount === totalQuestions ? 'success' : 'default'}
              className="text-xs font-mono px-3 py-1 gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              Score: {correctCount} / {totalQuestions}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {OOP_QUIZ_QUESTIONS.map((q, qIdx) => {
          const selected = selectedAnswers[q.id];
          const isChecked = !!checkedQuestions[q.id];
          const isCorrect = isChecked && selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  Module {q.moduleId}
                </Badge>
              </div>

              <div className="space-y-2 pl-0 sm:pl-8">
                {q.options.map((opt, oIdx) => {
                  const isPicked = selected === oIdx;
                  const isRightOption = oIdx === q.correctIndex;

                  let styleClass =
                    'border-slate-200 bg-white hover:border-slate-400 text-slate-700';

                  if (isChecked) {
                    if (isRightOption) {
                      styleClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
                    } else if (isPicked && !isRightOption) {
                      styleClass = 'border-rose-400 bg-rose-50 text-rose-900';
                    } else {
                      styleClass = 'border-slate-200 bg-slate-50 text-slate-400';
                    }
                  } else if (isPicked) {
                    styleClass =
                      'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-600/30';
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isChecked}
                      aria-pressed={isPicked}
                      onClick={() => handleSelect(q.id, oIdx)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 ${styleClass}`}
                    >
                      <span>{opt}</span>
                      {isChecked && isRightOption && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isChecked && isPicked && !isRightOption && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:pl-8 pt-1">
                {!isChecked ? (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={selected === undefined}
                    onClick={() => handleCheckQuestion(q.id)}
                    className="text-xs"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <div
                    className={`w-full rounded-lg p-3 text-xs border ${
                      isCorrect
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Correct!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not quite — Review the architecture explanation:</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">{q.explanation}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-slate-600">
                      Source: {q.sourceReference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {checkedCount === totalQuestions && (
          <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  Knowledge Check Complete — Final Score: {correctCount} / {totalQuestions} (
                  {Math.round((correctCount / totalQuestions) * 100)}%)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {correctCount === totalQuestions
                    ? 'Outstanding! Full mastery of the C++17 Supermarket OOP architecture.'
                    : 'Review the explanations above or explore the interactive modules to strengthen any missed concepts.'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset} className="shrink-0 text-xs">
              Retake Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
