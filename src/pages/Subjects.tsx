import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, GraduationCap, PenTool, Lightbulb, UserCheck } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const SUBJECT_ICONS = [GraduationCap, PenTool, Lightbulb, UserCheck];

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
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects" }]} />
      <h1 className="text-2xl font-bold text-foreground mb-1">Subjects</h1>
      <p className="text-sm text-muted-foreground mb-6">Choose a subject to start practicing</p>
      <div className="space-y-3">
        {subjectsWithProgress.map((s, i) => {
          const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length];
          const completionPct = Math.round((s.answered / s.questionCount) * 100);
          return (
            <Link
              key={s.id}
              to={`/subjects/${s.id}`}
              className="bg-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border/30 active:scale-[0.99] transition-transform"
              aria-label={`${s.name} - ${completionPct}% complete`}
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-foreground truncate">{s.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{s.topicCount} topics · {s.questionCount} questions</p>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2.5">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-primary">{completionPct}%</p>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Subjects;
