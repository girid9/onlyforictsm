import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Info, Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { seededShuffle, shuffleOptions } from "@/utils/shuffle";
import { RollerOptionPicker } from "@/components/RollerOptionPicker";
import { Question } from "@/types/question";
import { getTopicStats, getSpacedRepetitionDue } from "@/utils/analytics";

const OPTION_LABELS = ["A", "B", "C", "D"];

const RevisionPractice = () => {
  const navigate = useNavigate();
  const { questionsBySubjectTopic } = useDataStore();
  const { answers, bookmarkedIds, recordAnswer, toggleBookmark, settings } = useProgressStore();
  const setSessionResult = useDataStore((s) => s.setSessionResult);

  const mode = sessionStorage.getItem("revision-mode") || "wrong";

  const allQuestions = useMemo(() => {
    const all: Question[] = [];
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const qs of Object.values(topics)) all.push(...qs);
    }
    return all;
  }, [questionsBySubjectTopic]);

  const filteredQuestions = useMemo(() => {
    if (mode === "srs") return getSpacedRepetitionDue(answers, questionsBySubjectTopic);
    if (mode === "wrong") return allQuestions.filter((q) => answers[q.id] && !answers[q.id].correct);
    if (mode === "hard") {
      const stats = getTopicStats(answers, questionsBySubjectTopic);
      const hardTopics = new Set(stats.filter((t) => t.accuracy < 50 && t.attempted >= 2).map((t) => `${t.subjectId}-${t.topicId}`));
      return allQuestions.filter((q) => hardTopics.has(`${q.subjectId}-${q.topicId}`));
    }
    return seededShuffle(allQuestions, Date.now()).slice(0, 20);
  }, [mode, allQuestions, answers, questionsBySubjectTopic]);

  const [sessionSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [startTime] = useState(Date.now());

  const isTimed = mode === "fast20";
  const [timeRemaining, setTimeRemaining] = useState(600);

  useEffect(() => {
    if (filteredQuestions.length > 0) {
      setQuestions(mode === "fast20" ? filteredQuestions : seededShuffle(filteredQuestions, sessionSeed));
    }
  }, [filteredQuestions, sessionSeed, mode]);

  useEffect(() => {
    if (!isTimed || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); handleFinish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimed, timeRemaining > 0]);

  const currentQuestion = questions[currentIndex];
  const isBookmarked = currentQuestion ? bookmarkedIds.includes(currentQuestion.id) : false;

  const { shuffledOptions, shuffledAnswerIndex } = useMemo(() => {
    if (!currentQuestion) return { shuffledOptions: [], shuffledAnswerIndex: 0 };
    const optSeed = sessionSeed * 31 + currentIndex * 7919;
    return shuffleOptions(currentQuestion.options, currentQuestion.answerIndex, optSeed);
  }, [currentQuestion, sessionSeed, currentIndex]);

  const handleSelect = useCallback((optionIndex: number) => {
    if (revealed || !currentQuestion) return;
    const correct = optionIndex === shuffledAnswerIndex;
    setSelectedOption(optionIndex);
    setRevealed(true);
    setSessionAnswers((prev) => ({ ...prev, [currentIndex]: { selected: optionIndex, correct } }));
    recordAnswer(currentQuestion.id, optionIndex, correct);
  }, [revealed, currentQuestion, currentIndex, recordAnswer, shuffledAnswerIndex]);

  const handleFinish = useCallback(() => {
    const allAnswers = { ...sessionAnswers };
    if (selectedOption !== null && currentQuestion) {
      allAnswers[currentIndex] = { selected: selectedOption, correct: selectedOption === shuffledAnswerIndex };
    }
    const correct = Object.values(allAnswers).filter((a) => a.correct).length;
    const modeLabel = mode === "wrong" ? "Wrong Questions" : mode === "hard" ? "Hard Topics" : mode === "srs" ? "Spaced Repetition" : "Fast 20";
    setSessionResult({
      subjectName: "Revision", topicName: modeLabel,
      subjectId: "revision", topicId: mode,
      total: questions.length, correct, timeTaken: Math.round((Date.now() - startTime) / 1000),
      questionResults: questions.map((q, i) => ({ question: q, selectedIndex: allAnswers[i]?.selected ?? -1, correct: allAnswers[i]?.correct ?? false })),
    });
    navigate("/results");
  }, [sessionAnswers, selectedOption, currentQuestion, currentIndex, questions, startTime, navigate, setSessionResult, shuffledAnswerIndex, mode]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const prev = sessionAnswers[nextIdx];
      if (prev) { setSelectedOption(prev.selected); setRevealed(true); } else { setSelectedOption(null); setRevealed(false); }
    } else {
      handleFinish();
    }
  }, [currentIndex, questions, sessionAnswers, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prev = sessionAnswers[prevIdx];
      if (prev) { setSelectedOption(prev.selected); setRevealed(true); } else { setSelectedOption(null); setRevealed(false); }
    }
  }, [currentIndex, sessionAnswers]);

  const timerMinutes = Math.floor(timeRemaining / 60);
  const timerSeconds = timeRemaining % 60;
  const timerPct = (timeRemaining / 600) * 100;

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <p className="text-muted-foreground mb-4">No questions available for this revision mode.</p>
        <button onClick={() => navigate("/revision")} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-semibold">Back to Revision</button>
      </div>
    );
  }
  if (!currentQuestion) return null;

  const modeTitle = mode === "srs" ? "📅 Spaced Repetition" : mode === "wrong" ? "🔁 Wrong Questions" : mode === "hard" ? "🧠 Hard Topics" : "⚡ Fast 20";
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-card border-b border-border/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/revision")} className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-primary">{modeTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {isTimed && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${timerPct <= 20 ? 'text-destructive bg-destructive/10' : timerPct <= 50 ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
              <Timer size={12} />
              {timerMinutes}:{timerSeconds.toString().padStart(2, '0')}
            </div>
          )}
          <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-xs font-semibold">
            {currentIndex + 1}/{questions.length}
          </span>
          <button onClick={() => toggleBookmark(currentQuestion.id)} className={`h-9 w-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform ${isBookmarked ? 'text-primary bg-primary/10' : 'bg-secondary/50'}`}>
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0">
        <div className="h-1 w-full bg-secondary">
          <div className="h-full bg-primary rounded-r-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        {isTimed && (
          <div className="h-1 w-full bg-secondary">
            <div className={`h-full ${timerPct > 50 ? 'bg-success' : timerPct > 20 ? 'bg-warning' : 'bg-destructive'} rounded-r-full transition-all duration-300`} style={{ width: `${timerPct}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-full">Q{currentIndex + 1}</span>
              <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-[11px] font-medium rounded-full">{currentQuestion.subjectName}</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">{currentQuestion.question}</h2>
          </div>

          {settings.rollerMode ? (
            <RollerOptionPicker key={currentIndex} options={shuffledOptions} shuffledAnswerIndex={shuffledAnswerIndex} revealed={revealed} selectedOption={selectedOption} onSelect={handleSelect} />
          ) : (
            <div className="space-y-3">
              {shuffledOptions.map((option, i) => {
                if (!option.trim()) return null;
                let styles = "bg-card border border-border/40 shadow-sm";
                if (revealed) {
                  if (i === shuffledAnswerIndex) styles = "bg-success/10 border-success/40";
                  else if (i === selectedOption) styles = "bg-destructive/10 border-destructive/40";
                  else styles = "bg-card border border-border/20 opacity-50";
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={revealed} className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-all ${styles}`}>
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${revealed && i === shuffledAnswerIndex ? 'bg-success text-success-foreground' : 'bg-secondary/60 text-foreground'}`}>{OPTION_LABELS[i]}</span>
                    <span className="text-sm md:text-base font-medium">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {revealed && (
            <div className="mt-6 space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${selectedOption === shuffledAnswerIndex ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                {selectedOption === shuffledAnswerIndex ? <CheckCircle2 size={20} className="text-success shrink-0" /> : <AlertTriangle size={20} className="text-destructive shrink-0" />}
                <div>
                  <p className={`text-sm font-bold ${selectedOption === shuffledAnswerIndex ? 'text-success' : 'text-destructive'}`}>
                    {selectedOption === shuffledAnswerIndex ? "Correct! 🎉" : "Incorrect"}
                  </p>
                  {selectedOption !== shuffledAnswerIndex && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Correct: <span className="text-success font-bold">{OPTION_LABELS[shuffledAnswerIndex]}. {shuffledOptions[shuffledAnswerIndex]}</span>
                    </p>
                  )}
                </div>
              </div>
              {currentQuestion.notes && (
                <div className="p-4 bg-card border border-border/30 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Info size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Explanation</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{currentQuestion.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 shrink-0 bg-card border-t border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="h-10 px-4 rounded-xl bg-secondary/50 text-sm font-medium flex items-center gap-1.5 disabled:opacity-30 active:scale-95 transition-transform">
            <ChevronLeft size={14} /> Prev
          </button>
          <button onClick={handleNext} disabled={!revealed} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 active:scale-95 transition-transform">
            {currentIndex === questions.length - 1 ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionPractice;
