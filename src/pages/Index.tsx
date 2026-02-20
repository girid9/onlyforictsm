import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, ChevronRight, Sparkles, AlertTriangle, Flame, Zap } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import ProgressRing from "@/components/ProgressRing";
import { getWeakTopics, getSubjectProgress, getWeakAreaSuggestion, getSpacedRepetitionDue } from "@/utils/analytics";

const Home = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers, lastVisited, streak, xp } = useProgressStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = Object.values(questionsBySubjectTopic).reduce(
      (acc, topics) => acc + Object.values(topics).reduce((a, qs) => a + qs.length, 0), 0
    );
    const answered = Object.keys(answers).length;
    const correct = Object.values(answers).filter((a) => a.correct).length;
    const completion = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { total, answered, correct, completion };
  }, [questionsBySubjectTopic, answers]);

  const weakTopics = useMemo(() => getWeakTopics(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const subjectProgress = useMemo(() => getSubjectProgress(answers, questionsBySubjectTopic, subjects), [answers, questionsBySubjectTopic, subjects]);
  const weakSuggestion = useMemo(() => getWeakAreaSuggestion(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const srsDueCount = useMemo(() => getSpacedRepetitionDue(answers, questionsBySubjectTopic).length, [answers, questionsBySubjectTopic]);

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      {/* Header with date */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest">{dayName}</p>
        <h1 className="text-3xl font-bold text-foreground mt-0.5">{dateStr}</h1>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="glass-card flex-1 p-3 flex items-center gap-2.5">
          <ProgressRing value={stats.completion} size={44} strokeWidth={4} />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Overall</p>
            <p className="text-sm font-bold text-foreground">{stats.completion}%</p>
          </div>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-2">
          <Flame size={16} className="text-warning" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Streak</p>
            <p className="text-sm font-bold text-foreground">{streak}d</p>
          </div>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">XP</p>
            <p className="text-sm font-bold text-foreground">{xp}</p>
          </div>
        </div>
      </div>

      {/* Today's Focus Card */}
      {lastVisited ? (
        <div className="glass-card p-5 mb-6">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's focus</p>
          <h2 className="text-xl font-bold text-foreground mb-2 leading-tight">{lastVisited.topicName}</h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Continue where you left off in {lastVisited.subjectName}. Keep your streak going!
          </p>
          <button
            onClick={() => navigate(`/practice/${lastVisited.subjectId}/${lastVisited.topicId}`)}
            className="gradient-btn w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Continue studying
          </button>
        </div>
      ) : (
        <div className="glass-card p-5 mb-6">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Get started</p>
          <h2 className="text-xl font-bold text-foreground mb-2">Pick a subject to begin</h2>
          <p className="text-xs text-muted-foreground mb-4">Start your learning journey today!</p>
          <button onClick={() => navigate('/subjects')} className="gradient-btn w-full py-3 text-sm">
            Browse Subjects
          </button>
        </div>
      )}

      {/* Smart Alerts */}
      {(weakSuggestion || srsDueCount > 0) && (
        <div className="space-y-2.5 mb-6">
          {srsDueCount > 0 && (
            <button
              onClick={() => { sessionStorage.setItem("revision-mode", "srs"); navigate("/revision/practice"); }}
              className="glass-card px-4 py-3.5 w-full text-left flex items-center gap-3"
            >
              <span className="text-lg">📅</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{srsDueCount} questions due for review</p>
              </div>
              <span className="text-[10px] font-bold text-primary">Review →</span>
            </button>
          )}
          {weakSuggestion && (
            <button
              onClick={() => navigate(`/practice/${weakSuggestion.subjectId}/${weakSuggestion.topicId}`)}
              className="glass-card px-4 py-3.5 w-full text-left flex items-center gap-3"
            >
              <AlertTriangle size={16} className="text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{weakSuggestion.message}</p>
              </div>
              <span className="text-[10px] font-bold text-warning">Fix →</span>
            </button>
          )}
        </div>
      )}

      {/* Subjects Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Subjects</h2>
          <Link to="/subjects" className="text-[10px] text-primary font-bold flex items-center gap-0.5 uppercase tracking-wider">
            All <ChevronRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {subjectProgress.slice(0, 4).map((sub) => {
            const topicCount = Object.keys(questionsBySubjectTopic[sub.subjectId] ?? {}).length;
            return (
              <Link key={sub.subjectId} to="/subjects" className="glass-card p-3.5 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <BookOpen size={15} className="text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-primary">{sub.completion}%</span>
                </div>
                <p className="text-xs font-bold text-foreground truncate mb-0.5">{sub.subjectName}</p>
                <p className="text-[10px] text-muted-foreground">{topicCount} topics</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Needs attention</h2>
          <div className="space-y-2">
            {weakTopics.slice(0, 3).map((topic) => (
              <Link
                key={`${topic.subjectId}-${topic.topicId}`}
                to={`/practice/${topic.subjectId}/${topic.topicId}`}
                className="glass-card px-4 py-3 flex items-center gap-3 group"
              >
                <div className="h-9 w-9 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                  <BookOpen size={15} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{topic.topicName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{topic.subjectName} · {topic.accuracy}%</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;