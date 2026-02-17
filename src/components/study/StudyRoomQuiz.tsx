import { useState, useMemo, useCallback } from "react";
import { Users, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useDataStore } from "@/store/useAppStore";
import type { StudyRoomData } from "@/hooks/useStudyRoom";
import type { Question } from "@/types/question";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface Props {
  roomData: StudyRoomData;
  playerId: string;
  isHost: boolean;
  onSubmitAnswer: (qIndex: number, selected: number, correct: boolean) => void;
  onAdvanceQuestion: (nextIndex: number) => void;
}

export function StudyRoomQuiz({ roomData, playerId, isHost, onSubmitAnswer, onAdvanceQuestion }: Props) {
  const { questionsBySubjectTopic } = useDataStore();
  const settings = roomData.settings!;
  const currentQIndex = roomData.currentQuestion;

  const questions: Question[] = useMemo(() => {
    const raw = questionsBySubjectTopic[settings.subjectId]?.[settings.topicId] || [];
    return raw.slice(0, settings.questionCount);
  }, [questionsBySubjectTopic, settings.subjectId, settings.topicId, settings.questionCount]);

  const currentQuestion = questions[currentQIndex];
  const members = roomData.members || {};
  const memberIds = Object.keys(members);
  const myMember = members[playerId];
  const myAnswer = myMember?.answers?.[currentQIndex];
  const hasAnswered = !!myAnswer;

  // Count how many members answered this question
  const answeredCount = memberIds.filter((id) => members[id]?.answers?.[currentQIndex]).length;
  const allAnswered = answeredCount === memberIds.length;

  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (hasAnswered || !currentQuestion) return;
      const isCorrect = optionIndex === currentQuestion.answerIndex;
      onSubmitAnswer(currentQIndex, optionIndex, isCorrect);
    },
    [hasAnswered, currentQuestion, currentQIndex, onSubmitAnswer]
  );

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading question…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground">{answeredCount}/{memberIds.length} answered</span>
          </div>
          <div className="px-3 py-1 bg-muted rounded text-[11px] font-bold">
            {currentQIndex + 1} / {settings.questionCount}
          </div>
          <div className="text-xs font-bold text-primary">{settings.topicName}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 w-full bg-muted shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentQIndex + 1) / settings.questionCount) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase mb-3 inline-block">
              Question {currentQIndex + 1}
            </span>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">{currentQuestion.question}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => {
              if (!option.trim()) return null;
              let extraClass = "";
              const isSelected = myAnswer?.selected === i;

              if (hasAnswered) {
                if (i === currentQuestion.answerIndex) extraClass = "option-btn-correct";
                else if (isSelected) extraClass = "option-btn-wrong";
                else extraClass = "opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={hasAnswered}
                  className={`option-btn ${extraClass}`}
                >
                  <span className={`h-8 w-8 rounded border border-border flex items-center justify-center text-xs font-bold shrink-0 ${hasAnswered && i === currentQuestion.answerIndex ? "bg-success border-success text-success-foreground" : "bg-muted/50"}`}>
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="text-sm md:text-base">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Notes / Explanation */}
          {hasAnswered && currentQuestion.notes && (
            <div className="mt-4">
              <button onClick={() => setShowExplanation(!showExplanation)} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </button>
              {showExplanation && (
                <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-foreground">
                  {currentQuestion.notes}
                </div>
              )}
            </div>
          )}

          {/* Group progress */}
          {hasAnswered && (
            <div className="mt-6 glass-card p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Group Progress</h3>
              <div className="space-y-2">
                {memberIds.map((id) => {
                  const m = members[id];
                  const a = m?.answers?.[currentQIndex];
                  return (
                    <div key={id} className="flex items-center gap-2">
                      {a ? (
                        a.correct ? <CheckCircle2 size={14} className="text-success" /> : <XCircle size={14} className="text-destructive" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 animate-pulse" />
                      )}
                      <span className="text-xs font-medium flex-1">{m.name}{id === playerId ? " (You)" : ""}</span>
                      <span className="text-[10px] text-muted-foreground font-bold">{m.score} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next button (host only, when all answered) */}
          {isHost && allAnswered && (
            <div className="mt-6 text-center">
              <button
                onClick={() => onAdvanceQuestion(currentQIndex + 1)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                {currentQIndex + 1 >= settings.questionCount ? "Finish Session" : "Next Question"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Waiting indicator */}
          {hasAnswered && !allAnswered && (
            <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg text-center animate-pulse">
              <p className="text-sm text-muted-foreground">⏳ Waiting for everyone to answer…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
