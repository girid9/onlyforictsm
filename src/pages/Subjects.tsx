import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, PenTool, Lightbulb, UserCheck } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const SUBJECT_ICONS = [GraduationCap, PenTool, Lightbulb, UserCheck];
const GRADIENT_STRIPS = [
  "from-primary to-primary/60",
  "from-success to-success/60",
  "from-warning to-warning/60",
  "from-accent to-accent/60",
];

const Subjects = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers } = useProgressStore();

  const subjectsWithProgress = useMemo(() => {
    return subjects.map((s) => {
      const allQs = Object.values(questionsBySubjectTopic[s.id] || {}).flat();
      const answered = allQs.filter((q) => answers[q.id]).length;
      const correct = allQs.filter((q) => answers[q.id]?.correct).length;
      const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      return { ...s, answered, correct, pct };
    });
  }, [subjects, answers, questionsBySubjectTopic]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects" }]} />
      <h1 className="text-2xl font-bold mb-6">All Subjects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjectsWithProgress.map((s, i) => {
          const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length];
          const completionPct = Math.round((s.answered / s.questionCount) * 100);
          return (
            <Link
              key={s.id}
              to={`/subjects/${s.id}`}
              className="glass-card overflow-hidden group flex flex-col focus-ring"
              aria-label={`${s.name} - ${completionPct}% complete`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${GRADIENT_STRIPS[i % GRADIENT_STRIPS.length]}`} />
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Completion</span>
                    <span className="text-sm font-bold text-foreground">{completionPct}%</span>
                  </div>
                </div>
                <h2 className="font-bold text-lg mb-1">{s.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border">{s.topicCount} Topics</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border">{s.questionCount} Questions</span>
                </div>
                <div className="mt-auto">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full progress-gradient" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-secondary/30 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Practice Now</span>
                <ArrowRight size={14} className="text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Subjects;
