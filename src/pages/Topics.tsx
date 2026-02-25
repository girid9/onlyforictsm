import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Play, ChevronRight } from "lucide-react";
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
      <div className="p-5 max-w-xl mx-auto">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/subjects" className="text-primary hover:underline mt-2 inline-block text-sm">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects", to: "/subjects" }, { label: subject.name }]} />
      <h1 className="text-xl font-bold text-foreground mb-1">{subject.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">{topics.length} topics · {subject.questionCount} questions</p>
      <div className="space-y-2.5">
        {topicsWithProgress.map((t) => {
          const progressPct = Math.round((t.answered / t.questionCount) * 100);
          return (
            <Link key={t.id} to={`/practice/${subjectId}/${t.id}`} className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-sm border border-border/30 active:scale-[0.99] transition-transform">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Play size={16} className="text-primary ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{t.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">{t.questionCount} Qs</span>
                </div>
              </div>
              {t.answered > 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.pct >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {t.pct}%
                </span>
              )}
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Topics;
