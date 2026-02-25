import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Sparkles, Flame, Zap, Star, ArrowRight } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
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
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
      </div>

      {/* Stats Pills */}
      <div className="flex gap-3">
        {[
          { icon: <Flame size={14} />, label: `${streak} day streak`, color: "text-warning" },
          { icon: <Zap size={14} />, label: `${xp} XP`, color: "text-primary" },
          { icon: <Star size={14} />, label: `${stats.completion}%`, color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/40 shadow-sm">
            <span className={s.color}>{s.icon}</span>
            <span className="text-xs font-semibold text-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Continue Card */}
      {lastVisited ? (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Continue where you left off</p>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">{lastVisited.topicName}</h2>
          <p className="text-sm text-muted-foreground mb-4">{lastVisited.subjectName}</p>
          <button
            onClick={() => navigate(`/practice/${lastVisited.subjectId}/${lastVisited.topicId}`)}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            <Sparkles size={16} /> Resume Learning
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30">
          <h2 className="text-lg font-bold text-foreground mb-1">Start your journey</h2>
          <p className="text-sm text-muted-foreground mb-4">Pick a subject to begin learning</p>
          <button onClick={() => navigate('/subjects')} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform">
            Browse Subjects
          </button>
        </div>
      )}

      {/* Smart Alerts */}
      {(weakSuggestion || srsDueCount > 0) && (
        <div className="space-y-2">
          {srsDueCount > 0 && (
            <button
              onClick={() => { sessionStorage.setItem("revision-mode", "srs"); navigate("/revision/practice"); }}
              className="w-full bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-border/30 active:scale-[0.99] transition-transform"
            >
              <span className="text-lg">📅</span>
              <p className="text-sm font-medium text-foreground flex-1 text-left">{srsDueCount} questions due for review</p>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          )}
          {weakSuggestion && (
            <button
              onClick={() => navigate(`/practice/${weakSuggestion.subjectId}/${weakSuggestion.topicId}`)}
              className="w-full bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-border/30 active:scale-[0.99] transition-transform"
            >
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium text-foreground flex-1 text-left truncate">{weakSuggestion.message}</p>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Subjects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Your Subjects</h2>
          <Link to="/subjects" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-2.5">
          {subjectProgress.slice(0, 4).map((sub) => {
            const topicCount = Object.keys(questionsBySubjectTopic[sub.subjectId] ?? {}).length;
            return (
              <Link key={sub.subjectId} to="/subjects" className="bg-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border/30 active:scale-[0.99] transition-transform">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{sub.subjectName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topicCount} topics</p>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${sub.completion}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{sub.completion}%</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Needs attention</h2>
          <div className="space-y-2">
            {weakTopics.slice(0, 3).map((topic) => (
              <Link
                key={`${topic.subjectId}-${topic.topicId}`}
                to={`/practice/${topic.subjectId}/${topic.topicId}`}
                className="bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-border/30 active:scale-[0.99] transition-transform"
              >
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{topic.topicName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topic.subjectName} · {topic.accuracy}% accuracy</p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
