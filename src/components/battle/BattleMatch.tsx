import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Clock, Zap, User } from "lucide-react";
import { useDataStore } from "@/store/useAppStore";
import { seededShuffle, shuffleOptions } from "@/utils/shuffle";
import type { RoomData } from "@/types/multiplayer";
import type { Question } from "@/types/question";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface Props {
  roomData: RoomData;
  playerId: string;
  isHost: boolean;
  onSubmitAnswer: (qIndex: number, selected: number, correct: boolean, timeRemaining: number) => void;
  onAdvanceQuestion: (nextIndex: number) => void;
}

export function BattleMatch({
  roomData,
  playerId,
  isHost,
  onSubmitAnswer,
  onAdvanceQuestion,
}: Props) {
  const { questionsBySubjectTopic } = useDataStore();
  const [timeLeft, setTimeLeft] = useState(roomData.settings?.secondsPerQuestion || 15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancedRef = useRef(false);

  const game = roomData.game!;
  const settings = roomData.settings!;
  const seed = roomData.seed || 0;
  const players = roomData.players || {};
  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((id) => id !== playerId) || "";
  const myPlayer = players[playerId];
  const opponentPlayer = players[opponentId];
  const currentQIndex = game.questionIndex;

  // Get questions using deterministic shuffle
  const questions = useMemo(() => {
    const rawQuestions = questionsBySubjectTopic[settings.subjectId]?.[settings.topicId] || [];
    const shuffled = seededShuffle(rawQuestions, seed);
    return shuffled.slice(0, settings.questionCount);
  }, [questionsBySubjectTopic, settings.subjectId, settings.topicId, seed, settings.questionCount]);

  const currentQuestion = questions[currentQIndex];

  // Shuffle options for current question deterministically
  const { shuffledOptions, shuffledAnswerIndex } = useMemo(() => {
    if (!currentQuestion) return { shuffledOptions: [], shuffledAnswerIndex: 0 };
    // Unique seed per question: combine room seed with question index
    const optionSeed = seed * 31 + currentQIndex * 7919;
    return shuffleOptions(currentQuestion.options, currentQuestion.answerIndex, optionSeed);
  }, [currentQuestion, seed, currentQIndex]);

  // My answer for current question
  const myAnswer = myPlayer?.answers?.[currentQIndex];
  const opponentAnswer = opponentPlayer?.answers?.[currentQIndex];
  const hasAnswered = !!myAnswer;
  const opponentHasAnswered = !!opponentAnswer;
  const bothAnswered = hasAnswered && opponentHasAnswered;

  // Timer based on questionStartedAt
  useEffect(() => {
    advancedRef.current = false;

    const updateTimer = () => {
      const elapsed = (Date.now() - game.questionStartedAt) / 1000;
      const remaining = Math.max(0, settings.secondsPerQuestion - elapsed);
      setTimeLeft(Math.ceil(remaining));
      return remaining;
    };

    updateTimer();

    timerRef.current = setInterval(() => {
      const remaining = updateTimer();
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game.questionStartedAt, settings.secondsPerQuestion]);

  // Auto-advance: when both answered or timer expired, host advances
  useEffect(() => {
    if (!isHost || advancedRef.current) return;

    const shouldAdvance = bothAnswered || timeLeft <= 0;
    if (shouldAdvance) {
      advancedRef.current = true;
      // Small delay so players see results
      const delay = bothAnswered ? 1500 : 500;
      const t = setTimeout(() => {
        onAdvanceQuestion(currentQIndex + 1);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [isHost, bothAnswered, timeLeft, currentQIndex, onAdvanceQuestion]);

  // Auto-submit unanswered when timer expires
  useEffect(() => {
    if (timeLeft <= 0 && !hasAnswered && currentQuestion) {
      onSubmitAnswer(currentQIndex, -1, false, 0);
    }
  }, [timeLeft, hasAnswered, currentQIndex, currentQuestion, onSubmitAnswer]);

  const handleSelect = useCallback(
    (shuffledIndex: number) => {
      if (hasAnswered || timeLeft <= 0 || !currentQuestion) return;
      const isCorrect = shuffledIndex === shuffledAnswerIndex;
      onSubmitAnswer(currentQIndex, shuffledIndex, isCorrect, timeLeft);
    },
    [hasAnswered, timeLeft, currentQuestion, shuffledAnswerIndex, currentQIndex, onSubmitAnswer]
  );

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading question…</p>
      </div>
    );
  }

  const timerColor =
    timeLeft <= 3 ? "text-destructive" : timeLeft <= 7 ? "text-warning" : "text-primary";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scoreboard Header */}
      <div className="border-b border-border bg-card/50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* My score */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">You</p>
              <p className="text-lg font-black text-primary">{myPlayer?.score || 0}</p>
            </div>
          </div>

          {/* Question counter + Timer */}
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1 bg-muted rounded text-[11px] font-bold">
              {currentQIndex + 1} / {settings.questionCount}
            </div>
            <div className={`flex items-center gap-1 ${timerColor} font-black text-lg`}>
              <Clock size={14} />
              {timeLeft}s
            </div>
          </div>

          {/* Opponent score */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {opponentPlayer?.name || "Opponent"}
              </p>
              <p className="text-lg font-black text-warning">{opponentPlayer?.score || 0}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
              <User size={14} className="text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-muted shrink-0">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQIndex + 1) / settings.questionCount) * 100}%` }}
        />
      </div>

      {/* Question + Options */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                Question {currentQIndex + 1}
              </span>
              {settings.subjectName && (
                <span className="text-[10px] text-muted-foreground">{settings.topicName}</span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-3">
            {shuffledOptions.map((option, i) => {
              if (!option.trim()) return null;
              let extraClass = "";
              const isSelected = myAnswer?.selected === i;

              if (hasAnswered) {
                if (i === shuffledAnswerIndex) extraClass = "option-btn-correct";
                else if (isSelected) extraClass = "option-btn-wrong";
                else extraClass = "opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={hasAnswered || timeLeft <= 0}
                  className={`option-btn ${extraClass} ${
                    hasAnswered ? "" : "active:scale-[0.98]"
                  }`}
                >
                  <span
                    className={`h-8 w-8 rounded border border-border flex items-center justify-center text-xs font-bold shrink-0 ${
                      hasAnswered && i === shuffledAnswerIndex
                        ? "bg-success border-success text-success-foreground"
                        : "bg-muted/50"
                    }`}
                  >
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="text-sm md:text-base">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Waiting indicator */}
          {hasAnswered && !opponentHasAnswered && timeLeft > 0 && (
            <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg text-center animate-pulse">
              <p className="text-sm text-muted-foreground">
                ⏳ Waiting for opponent to answer…
              </p>
            </div>
          )}

          {/* Opponent disconnected warning */}
          {opponentPlayer && !opponentPlayer.connected && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Opponent disconnected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
