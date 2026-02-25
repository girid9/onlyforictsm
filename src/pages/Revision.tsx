import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { getTopicStats, getSpacedRepetitionDue } from "@/utils/analytics";
import { RotateCcw, Brain, Zap, AlertTriangle, CalendarClock, ChevronRight } from "lucide-react";

const Revision = () => {
  const { questionsBySubjectTopic } = useDataStore();
  const { answers } = useProgressStore();
  const navigate = useNavigate();

  const wrongCount = useMemo(() => Object.values(answers).filter((a) => !a.correct).length, [answers]);
  const topicStats = useMemo(() => getTopicStats(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const hardTopicCount = useMemo(() => topicStats.filter((t) => t.accuracy < 50 && t.attempted >= 2).length, [topicStats]);
  const srsDue = useMemo(() => getSpacedRepetitionDue(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);

  const totalQuestions = useMemo(() => {
    let count = 0;
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const qs of Object.values(topics)) count += qs.length;
    }
    return count;
  }, [questionsBySubjectTopic]);

  const modes = [
    { id: "srs", title: "Spaced Repetition", desc: "Review after 1, 3, and 7 days", icon: CalendarClock, color: "text-primary", bg: "bg-primary/15", stat: `${srsDue.length} due`, disabled: srsDue.length === 0 },
    { id: "wrong", title: "Wrong Answers", desc: "Re-practice your mistakes", icon: RotateCcw, color: "text-destructive", bg: "bg-destructive/15", stat: `${wrongCount} Qs`, disabled: wrongCount === 0 },
    { id: "hard", title: "Hard Topics", desc: "Accuracy below 50%", icon: Brain, color: "text-warning", bg: "bg-warning/15", stat: `${hardTopicCount} topics`, disabled: hardTopicCount === 0 },
    { id: "fast20", title: "Fast 20", desc: "Timed random challenge", icon: Zap, color: "text-success", bg: "bg-success/15", stat: `${Math.min(20, totalQuestions)} Qs`, disabled: totalQuestions === 0 },
  ];

  const handleStart = (modeId: string) => {
    sessionStorage.setItem("revision-mode", modeId);
    navigate("/revision/practice");
  };

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">Revision</h1>
      <p className="text-sm text-muted-foreground mb-6">Smart modes to strengthen weak areas</p>

      <div className="space-y-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleStart(mode.id)}
            disabled={mode.disabled}
            className="glass-card px-4 py-4 w-full text-left flex items-center gap-4 disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.99] transition-transform"
          >
            <div className={`h-11 w-11 rounded-xl ${mode.bg} flex items-center justify-center shrink-0`}>
              <mode.icon size={20} className={mode.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{mode.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <p className={`text-xs font-bold ${mode.color}`}>{mode.stat}</p>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      {wrongCount === 0 && hardTopicCount === 0 && srsDue.length === 0 && (
        <div className="glass-card p-8 text-center mt-6">
          <AlertTriangle size={24} className="text-warning mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Start practising to unlock revision modes</p>
          <button onClick={() => navigate('/subjects')} className="gradient-btn px-6 py-2.5 text-sm active:scale-[0.98] transition-transform">Browse Subjects</button>
        </div>
      )}
    </div>
  );
};

export default Revision;
