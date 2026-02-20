import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const Topics = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { subjects, topicsBySubject, questionsBySubjectTopic } = useDataStore();
  const { answers } = useProgressStore();
  const subject = subjects.find((s) => s.id === subjectId);
  const topics = topicsBySubject[subjectId || ""] || [];

  const topicsWithProgress = useMemo(() => {
    if (!subjectId) return [];
    return topics.map((t) => {
      const qs = questionsBySubjectTopic[subjectId]?.[t.id] || [];
      const answered = qs.filter((q) => answers[q.id]).length;
      const correct = qs.filter((q) => answers[q.id]?.correct).length;
      const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      return { ...t, answered, correct, pct };
    });
  }, [topics, questionsBySubjectTopic, answers, subjectId]);

  if (!subject) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/subjects" className="text-primary hover:underline mt-2 inline-block text-sm">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects", to: "/subjects" }, { label: subject.name }]} />
      <h1 className="text-xl font-bold mb-1">{subject.name}</h1>
      <p className="text-[10px] text-muted-foreground mb-5 uppercase tracking-wider">{topics.length} topics · {subject.questionCount} questions</p>
      <div className="space-y-2.5">
        {topicsWithProgress.map((t) => (
          <Link key={t.id} to={`/practice/${subjectId}/${t.id}`} className="glass-card px-4 py-3.5 flex items-center gap-3.5 group focus-ring">
            <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Play size={16} className="text-primary ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-foreground truncate">{t.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full progress-gradient" style={{ width: `${(t.answered / t.questionCount) * 100}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{t.questionCount} Qs</span>
              </div>
            </div>
            {t.answered > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.pct >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {t.pct}%
              </span>
            )}
            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Topics;