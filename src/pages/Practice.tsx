import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Settings, Info, Timer, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { seededShuffle, shuffleOptions } from "@/utils/shuffle";
import { RollerOptionPicker } from "@/components/RollerOptionPicker";
import { Question } from "@/types/question";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OPTION_LABELS = ["A", "B", "C", "D"];

const Practice = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { bookmarkedIds, recordAnswer, toggleBookmark, setLastVisited, settings, updateSettings } = useProgressStore();
  const setSessionResult = useDataStore((s) => s.setSessionResult);

  const rawQuestions = useMemo(() => {
    if (!subjectId || !topicId) return [];
    return questionsBySubjectTopic[subjectId]?.[topicId] ?? [];
  }, [subjectId, topicId, questionsBySubjectTopic]);

  const [sessionSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [startTime] = useState(Date.now());

  const [examMode, setExamMode] = useState(false);
  const [examDuration, setExamDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [conceptMode, setConceptMode] = useState(false);

  useEffect(() => {
    if (rawQuestions.length > 0) {
      setQuestions(seededShuffle(rawQuestions, sessionSeed));
    }
  }, [rawQuestions, sessionSeed]);

  useEffect(() => {
    if (rawQuestions.length > 0 && subjectId && topicId) {
      const subject = subjects.find((s) => s.id === subjectId);
      setLastVisited({ subjectId, topicId, subjectName: subject?.name || subjectId, topicName: rawQuestions[0]?.topicName || topicId });
    }
  }, [rawQuestions, subjectId, topicId, subjects, setLastVisited]);

  useEffect(() => {
    if (examMode) {
      setTimeRemaining(examDuration * 60);
    }
  }, [examMode, examDuration]);

  useEffect(() => {
    if (!examMode || timeRemaining <= 0) return;
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
  }, [examMode, timeRemaining > 0]);

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
    setSessionResult({
      subjectName: currentQuestion?.subjectName || "", topicName: currentQuestion?.topicName || "",
      subjectId: subjectId || "", topicId: topicId || "",
      total: questions.length, correct, timeTaken: Math.round((Date.now() - startTime) / 1000),
      questionResults: questions.map((q, i) => ({ question: q, selectedIndex: allAnswers[i]?.selected ?? -1, correct: allAnswers[i]?.correct ?? false })),
    });
    navigate("/results");
  }, [sessionAnswers, selectedOption, currentQuestion, currentIndex, subjectId, topicId, questions, startTime, navigate, setSessionResult, shuffledAnswerIndex]);

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

  useEffect(() => {
    if (revealed && settings.autoAdvance && currentIndex < questions.length - 1) {
      const delay = (settings.autoAdvanceDelay || 2) * 1000;
      const timer = setTimeout(() => { handleNext(); }, delay);
      return () => clearTimeout(timer);
    }
  }, [revealed, settings.autoAdvance, settings.autoAdvanceDelay, currentIndex, questions.length, handleNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!settings.rollerMode) {
        if (e.key >= "1" && e.key <= "4") handleSelect(parseInt(e.key) - 1);
      }
      if (e.key.toLowerCase() === "n" && revealed) handleNext();
      else if (e.key.toLowerCase() === "p") handlePrev();
      else if (e.key.toLowerCase() === "b" && currentQuestion) toggleBookmark(currentQuestion.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSelect, handleNext, handlePrev, currentQuestion, toggleBookmark, revealed, settings.rollerMode]);

  const timerMinutes = Math.floor(timeRemaining / 60);
  const timerSeconds = timeRemaining % 60;
  const timerPct = examMode ? (timeRemaining / (examDuration * 60)) * 100 : 100;
  const timerColor = timerPct > 50 ? "bg-success" : timerPct > 20 ? "bg-warning" : "bg-destructive";

  if (questions.length === 0) return <div className="p-6 text-center"><p className="text-muted-foreground">No questions available.</p></div>;
  if (!currentQuestion) return null;

  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-card border-b border-border/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft size={18} />
          </button>
          <div className="hidden sm:block">
            <p className="text-[11px] font-semibold text-primary">{currentQuestion.subjectName}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{currentQuestion.topicName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {examMode && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${timerPct <= 20 ? 'text-destructive bg-destructive/10' : timerPct <= 50 ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
              <Timer size={12} />
              {timerMinutes}:{timerSeconds.toString().padStart(2, '0')}
            </div>
          )}
          <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-xs font-semibold text-foreground">
            {currentIndex + 1}/{questions.length}
          </span>
          <button onClick={() => toggleBookmark(currentQuestion.id)} className={`h-9 w-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform ${isBookmarked ? 'text-primary bg-primary/10' : 'bg-secondary/50'}`}>
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform">
                <Settings size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-advance" className="text-xs font-medium">Auto-advance</Label>
                <Switch id="auto-advance" checked={settings.autoAdvance} onCheckedChange={(checked) => updateSettings({ autoAdvance: checked })} />
              </div>
              {settings.autoAdvance && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5"><Timer size={12} /> Delay</Label>
                    <span className="text-xs font-bold text-primary">{settings.autoAdvanceDelay || 2}s</span>
                  </div>
                  <Slider value={[settings.autoAdvanceDelay || 2]} onValueChange={([val]) => updateSettings({ autoAdvanceDelay: val })} min={1} max={5} step={1} className="w-full" />
                </div>
              )}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <Label htmlFor="roller-mode" className="text-xs font-medium">Roller Mode</Label>
                <Switch id="roller-mode" checked={settings.rollerMode || false} onCheckedChange={(checked) => updateSettings({ rollerMode: checked })} />
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <Label htmlFor="concept-mode" className="text-xs font-medium flex items-center gap-1.5"><BookOpen size={12} /> Concept Mode</Label>
                <Switch id="concept-mode" checked={conceptMode} onCheckedChange={setConceptMode} />
              </div>
              <div className="border-t border-border pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exam-mode" className="text-xs font-medium flex items-center gap-1.5"><Timer size={12} /> Exam Mode</Label>
                  <Switch id="exam-mode" checked={examMode} onCheckedChange={setExamMode} />
                </div>
                {examMode && (
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Time Limit</Label>
                    <Select value={String(examDuration)} onValueChange={(v) => setExamDuration(Number(v))}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0">
        <div className="h-1 w-full bg-secondary">
          <div className="h-full bg-primary rounded-r-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        {examMode && (
          <div className="h-1 w-full bg-secondary">
            <div className={`h-full ${timerColor} rounded-r-full transition-all duration-300`} style={{ width: `${timerPct}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-full">Q{currentIndex + 1}</span>
              {conceptMode && (
                <span className="px-2.5 py-1 bg-accent/10 text-accent text-[11px] font-semibold rounded-full">📘 Concept</span>
              )}
            </div>

            {conceptMode && currentQuestion.notes && !revealed && (
              <div className="mb-5 p-4 bg-accent/5 border border-accent/20 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen size={12} className="text-accent" />
                  <span className="text-[11px] font-semibold text-accent">Concept Hint</span>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  💡 {currentQuestion.notes.split('.').slice(0, 2).join('.')}...
                </p>
              </div>
            )}

            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">
              {currentQuestion.question}
            </h2>
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
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={revealed}
                    className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-all ${styles}`}
                  >
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      revealed && i === shuffledAnswerIndex ? 'bg-success text-success-foreground' : 'bg-secondary/60 text-foreground'
                    }`}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="text-sm md:text-base font-medium">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation */}
          {revealed && (
            <div className="mt-6 space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${selectedOption === shuffledAnswerIndex ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                {selectedOption === shuffledAnswerIndex ? (
                  <CheckCircle2 size={20} className="text-success shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="text-destructive shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-bold ${selectedOption === shuffledAnswerIndex ? 'text-success' : 'text-destructive'}`}>
                    {selectedOption === shuffledAnswerIndex ? "Correct! 🎉" : "Incorrect"}
                  </p>
                  {selectedOption !== shuffledAnswerIndex && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The correct answer is <span className="text-success font-bold">{OPTION_LABELS[shuffledAnswerIndex]}. {shuffledOptions[shuffledAnswerIndex]}</span>
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
          <p className="text-xs text-muted-foreground hidden sm:block">
            {settings.rollerMode ? "Swipe to browse" : "Keys 1-4 to select"}
          </p>
          <button onClick={handleNext} disabled={!revealed} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 active:scale-95 transition-transform">
            {currentIndex === questions.length - 1 ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
