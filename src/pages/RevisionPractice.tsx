import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Info, Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { seededShuffle, shuffleOptions } from "@/utils/shuffle";
import { RollerOptionPicker } from "@/components/RollerOptionPicker";
import { Question } from "@/types/question";
import { getTopicStats } from "@/utils/analytics";
import { motion, AnimatePresence } from "framer-motion";

const OPTION_LABELS = ["A", "B", "C", "D"];

const RevisionPractice = () => {
  const navigate = useNavigate();
  const { questionsBySubjectTopic } = useDataStore();
  const { answers, bookmarkedIds, recordAnswer, toggleBookmark, settings } = useProgressStore();
  const setSessionResult = useDataStore((s) => s.setSessionResult);

  const mode = sessionStorage.getItem("revision-mode") || "wrong";

  // Build question set based on mode
  const allQuestions = useMemo(() => {
    const all: Question[] = [];
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const qs of Object.values(topics)) all.push(...qs);
    }
    return all;
  }, [questionsBySubjectTopic]);

  const filteredQuestions = useMemo(() => {
    if (mode === "wrong") {
      return allQuestions.filter((q) => answers[q.id] && !answers[q.id].correct);
    }
    if (mode === "hard") {
      const stats = getTopicStats(answers, questionsBySubjectTopic);
      const hardTopics = new Set(stats.filter((t) => t.accuracy < 50 && t.attempted >= 2).map((t) => `${t.subjectId}-${t.topicId}`));
      return allQuestions.filter((q) => hardTopics.has(`${q.subjectId}-${q.topicId}`));
    }
    // fast20
    const shuffled = seededShuffle(allQuestions, Date.now());
    return shuffled.slice(0, 20);
  }, [mode, allQuestions, answers, questionsBySubjectTopic]);

  const [sessionSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [startTime] = useState(Date.now());

  // Fast 20 timer
  const isTimed = mode === "fast20";
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes

  useEffect(() => {
    if (filteredQuestions.length > 0) {
      setQuestions(mode === "fast20" ? filteredQuestions : seededShuffle(filteredQuestions, sessionSeed));
    }
  }, [filteredQuestions, sessionSeed, mode]);

  // Countdown for fast20
  useEffect(() => {
    if (!isTimed || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
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
    const modeLabel = mode === "wrong" ? "Wrong Questions" : mode === "hard" ? "Hard Topics" : "Fast 20";
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
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground mb-4">No questions available for this revision mode.</p>
        <button onClick={() => navigate("/revision")} className="gradient-btn px-6 py-2.5 text-xs">Back to Revision</button>
      </div>
    );
  }
  if (!currentQuestion) return null;

  const modeTitle = mode === "wrong" ? "🔁 Wrong Questions" : mode === "hard" ? "🧠 Hard Topics" : "⚡ Fast 20";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0" style={{ background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/revision")} className="p-2 hover:bg-muted rounded-md transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-primary uppercase">{modeTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {isTimed && (
            <div className={`px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 ${timerPct <= 20 ? 'text-destructive bg-destructive/10' : timerPct <= 50 ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
              <Timer size={12} />
              {timerMinutes}:{timerSeconds.toString().padStart(2, '0')}
            </div>
          )}
          <div className="px-3 py-1 bg-muted rounded text-[11px] font-bold">
            {currentIndex + 1} / {questions.length}
          </div>
          <button onClick={() => toggleBookmark(currentQuestion.id)} className={`p-2 rounded-md transition-colors ${isBookmarked ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}>
            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0">
        <div className="h-1 w-full bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
        {isTimed && (
          <div className="h-1 w-full bg-muted">
            <div className={`h-full transition-all duration-1000 ${timerPct > 50 ? 'bg-success' : timerPct > 20 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${timerPct}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Question {currentIndex + 1}</span>
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded">{currentQuestion.subjectName}</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">{currentQuestion.question}</h2>
          </div>

          {settings.rollerMode ? (
            <RollerOptionPicker key={currentIndex} options={shuffledOptions} shuffledAnswerIndex={shuffledAnswerIndex} revealed={revealed} selectedOption={selectedOption} onSelect={handleSelect} />
          ) : (
            <div className="space-y-3">
              {shuffledOptions.map((option, i) => {
                if (!option.trim()) return null;
                let extraClass = "";
                if (revealed) {
                  if (i === shuffledAnswerIndex) extraClass = "option-btn-correct";
                  else if (i === selectedOption) extraClass = "option-btn-wrong";
                  else extraClass = "opacity-50";
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={revealed} className={`option-btn ${extraClass}`}>
                    <span className={`h-8 w-8 rounded border border-border flex items-center justify-center text-xs font-bold shrink-0 ${revealed && i === shuffledAnswerIndex ? 'bg-success border-success text-success-foreground' : 'bg-muted/50'}`}>{OPTION_LABELS[i]}</span>
                    <span className="text-sm md:text-base">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="mt-6 space-y-3">
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${selectedOption === shuffledAnswerIndex ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
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
                  <div className="p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Info size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Why this is correct</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{currentQuestion.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 p-4 shrink-0" style={{ background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="compact-btn flex items-center gap-2 disabled:opacity-30">
            <ChevronLeft size={16} /> Previous
          </button>
          <button onClick={handleNext} disabled={!revealed} className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30">
            {currentIndex === questions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionPractice;
