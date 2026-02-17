import { useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Play, ArrowRight, Download } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const Topics = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { subjects, topicsBySubject, questionsBySubjectTopic } = useDataStore();
  const { answers } = useProgressStore();
  const subject = subjects.find((s) => s.id === subjectId);
  const topics = topicsBySubject[subjectId || ""] || [];

  const handleDownloadPdf = useCallback((topicId: string, topicName: string) => {
    if (!subjectId) return;
    const qs = questionsBySubjectTopic[subjectId]?.[topicId] || [];
    if (qs.length === 0) return;
    const lines: string[] = [];
    lines.push(`${subject?.name || subjectId} - ${topicName}`);
    lines.push("=".repeat(50));
    lines.push("");
    qs.forEach((q, i) => {
      lines.push(`Q${i + 1}. ${q.question}`);
      q.options.forEach((opt, j) => {
        const label = String.fromCharCode(65 + j);
        const marker = j === q.answerIndex ? " ✓" : "";
        lines.push(`   ${label}) ${opt}${marker}`);
      });
      if (q.notes) lines.push(`   📝 ${q.notes}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topicName.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [subjectId, questionsBySubjectTopic, subject]);

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
    return (<div className="p-6 max-w-4xl mx-auto"><p className="text-muted-foreground">Subject not found.</p><Link to="/subjects" className="text-primary hover:underline mt-2 inline-block">Back to subjects</Link></div>);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects", to: "/subjects" }, { label: subject.name }]} />
      <h1 className="text-2xl font-bold mb-2">{subject.name}</h1>
      <p className="text-muted-foreground mb-6">{topics.length} topics · {subject.questionCount} questions</p>
      <div className="space-y-3">
        {topicsWithProgress.map((t) => (
          <Link key={t.id} to={`/practice/${subjectId}/${t.id}`} className="glass-card p-5 flex items-center gap-5 hover:border-primary/40 transition-all group block">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Play size={20} className="text-primary group-hover:text-primary-foreground ml-1" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold truncate group-hover:text-primary transition-colors">{t.name}</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.questionCount} Qs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(t.answered / t.questionCount) * 100}%` }} />
                </div>
                {t.answered > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.pct >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {t.pct}% Acc
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadPdf(t.id, t.name); }}
                className="p-2 hover:bg-primary/10 rounded-md transition-colors z-10"
                title="Download questions"
              >
                <Download size={16} className="text-muted-foreground hover:text-primary" />
              </button>
              <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Topics;
