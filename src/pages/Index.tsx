import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import ProgressRing from "@/components/ProgressRing";
import { getWeakTopics, getSubjectProgress, getWeakAreaSuggestion, getSpacedRepetitionDue } from "@/utils/analytics";
import { Progress } from "@/components/ui/progress";

const Home = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers, lastVisited } = useProgressStore();
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

  const weakTopics = useMemo(
    () => getWeakTopics(answers, questionsBySubjectTopic),
    [answers, questionsBySubjectTopic]
  );

  const subjectProgress = useMemo(
    () => getSubjectProgress(answers, questionsBySubjectTopic, subjects),
    [answers, questionsBySubjectTopic, subjects]
  );

  const weakSuggestion = useMemo(
    () => getWeakAreaSuggestion(answers, questionsBySubjectTopic),
    [answers, questionsBySubjectTopic]
  );

  const srsDueCount = useMemo(
    () => getSpacedRepetitionDue(answers, questionsBySubjectTopic).length,
    [answers, questionsBySubjectTopic]
  );

  const motivationalText = stats.completion >= 70 ? "Amazing work!" : stats.completion >= 40 ? "Keep it up!" : "Let's get started!";

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto min-h-screen">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome Back! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ready to learn something new?</p>
        </div>

        {/* Pick a Subject Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Pick a Subject to Start</h2>
            <Link to="/subjects" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {subjectProgress.slice(0, 4).map((sub) => {
              const topicCount = Object.keys(questionsBySubjectTopic[sub.subjectId] ?? {}).length;
              return (
                <Link
                  key={sub.subjectId}
                  to={`/subjects`}
                  className="glass-card p-4 flex flex-col gap-2 group"
                  aria-label={sub.subjectName}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{sub.subjectName}</p>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>{topicCount} Topics</p>
                    <p>{sub.total} Questions</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-1 group-hover:underline">
                    View All <ChevronRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Daily Progress */}
        <div>
          <div className="glass-card p-5">
            <h2 className="text-base font-bold text-foreground mb-4">Daily Progress</h2>
            <div className="flex items-center gap-6">
              <ProgressRing value={stats.completion} size={100} strokeWidth={8} label="Completion" />
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">{motivationalText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.answered} of {stats.total} questions completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {(weakSuggestion || srsDueCount > 0) && (
          <div className="space-y-3">
            {srsDueCount > 0 && (
              <button
                onClick={() => { sessionStorage.setItem("revision-mode", "srs"); navigate("/revision/practice"); }}
                className="glass-card p-4 w-full text-left flex items-center gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Spaced Repetition Due</p>
                  <p className="text-[10px] text-muted-foreground">{srsDueCount} questions ready for review</p>
                </div>
                <span className="gradient-btn px-3 py-1.5 text-[10px] shrink-0">Review Now</span>
              </button>
            )}
            {weakSuggestion && (
              <button
                onClick={() => navigate(`/practice/${weakSuggestion.subjectId}/${weakSuggestion.topicId}`)}
                className="glass-card p-4 w-full text-left flex items-center gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Weak Area Detected</p>
                  <p className="text-[10px] text-muted-foreground">{weakSuggestion.message}</p>
                </div>
                <span className="gradient-btn px-3 py-1.5 text-[10px] shrink-0">Practice</span>
              </button>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Recommended for You</h2>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {lastVisited && (
              <Link
                to={`/practice/${lastVisited.subjectId}/${lastVisited.topicId}`}
                className="glass-card p-4 flex items-center gap-4 group"
                aria-label={`Resume ${lastVisited.topicName}`}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{lastVisited.topicName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">{lastVisited.subjectName}</p>
                </div>
                <button className="gradient-btn px-4 py-2 text-xs shrink-0">
                  Resume
                </button>
              </Link>
            )}

            {weakTopics.slice(0, 3).map((topic) => (
              <Link
                key={`${topic.subjectId}-${topic.topicId}`}
                to={`/practice/${topic.subjectId}/${topic.topicId}`}
                className="glass-card p-4 flex items-center gap-4 group"
                aria-label={`Practice ${topic.topicName}`}
              >
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{topic.topicName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                    {topic.subjectName} · {topic.accuracy}% accuracy
                  </p>
                  <Progress value={topic.accuracy} className="h-1.5 mt-2" />
                </div>
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <ArrowRight size={16} className="text-accent" />
                </div>
              </Link>
            ))}

            {weakTopics.length === 0 && !lastVisited && (
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Start practising to get personalised recommendations!</p>
                <button onClick={() => navigate('/subjects')} className="gradient-btn px-6 py-2.5 text-xs mt-4">
                  Browse Subjects
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
