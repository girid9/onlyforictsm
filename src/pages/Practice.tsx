import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Settings, Info, Timer } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { seededShuffle, shuffleOptions } from "@/utils/shuffle";
import { RollerOptionPicker } from "@/components/RollerOptionPicker";
import { Question } from "@/types/question";

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

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const prev = sessionAnswers[nextIdx];
      if (prev) { setSelectedOption(prev.selected); setRevealed(true); } else { setSelectedOption(null); setRevealed(false); }
    } else {
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
    }
  }, [currentIndex, questions, sessionAnswers, selectedOption, currentQuestion, subjectId, topicId, startTime, navigate, setSessionResult, shuffledAnswerIndex]);

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

  if (questions.length === 0) return <div className="p-4 text-center"><p className="text-muted-foreground">No questions available.</p></div>;
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Compact Header */}
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0" style={{ background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-md transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{currentQuestion.subjectName}</p>
            <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{currentQuestion.topicName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-muted rounded text-[11px] font-bold">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <button onClick={() => toggleBookmark(currentQuestion.id)} className={`p-2 rounded-md transition-colors ${isBookmarked ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}>
            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-md transition-colors">
                <Settings size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-advance" className="text-xs font-medium">Auto-advance</Label>
                <Switch id="auto-advance" checked={settings.autoAdvance} onCheckedChange={(checked) => updateSettings({ autoAdvance: checked })} />
              </div>
              {settings.autoAdvance && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Timer size={12} /> Delay
                    </Label>
                    <span className="text-xs font-bold text-primary">{settings.autoAdvanceDelay || 2}s</span>
                  </div>
                  <Slider
                    value={[settings.autoAdvanceDelay || 2]}
                    onValueChange={([val]) => updateSettings({ autoAdvanceDelay: val })}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1s</span>
                    <span>3s</span>
                    <span>5s</span>
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <Label htmlFor="roller-mode" className="text-xs font-medium">Roller Mode</Label>
                <Switch id="roller-mode" checked={settings.rollerMode || false} onCheckedChange={(checked) => updateSettings({ rollerMode: checked })} />
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <Label htmlFor="global-chat" className="text-xs font-medium">Global Chat</Label>
                <Switch id="global-chat" checked={settings.showGlobalChat ?? true} onCheckedChange={(checked) => updateSettings({ showGlobalChat: checked })} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-muted shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Question {currentIndex + 1}</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">
              {currentQuestion.question}
            </h2>
          </div>

          {settings.rollerMode ? (
            <RollerOptionPicker
              key={currentIndex}
              options={shuffledOptions}
              shuffledAnswerIndex={shuffledAnswerIndex}
              revealed={revealed}
              selectedOption={selectedOption}
              onSelect={handleSelect}
            />
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
                    <span className={`h-8 w-8 rounded border border-border flex items-center justify-center text-xs font-bold shrink-0 ${revealed && i === shuffledAnswerIndex ? 'bg-success border-success text-success-foreground' : 'bg-muted/50'}`}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="text-sm md:text-base">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {revealed && currentQuestion.notes && (
            <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Explanation</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {currentQuestion.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compact Footer Navigation */}
      <div className="border-t border-border/50 p-4 shrink-0" style={{ background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="compact-btn flex items-center gap-2 disabled:opacity-30">
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {settings.rollerMode ? "Swipe up/down to browse" : "Use keys 1-4 to select"}
          </div>
          <button onClick={handleNext} disabled={!revealed} className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30">
            {currentIndex === questions.length - 1 ? "Finish" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
