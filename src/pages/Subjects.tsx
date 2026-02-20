import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, PenTool, Lightbulb, UserCheck } from "lucide-react";
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
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Subjects" }]} />
      <h1 className="text-2xl font-bold mb-5">Subjects</h1>
      <div className="space-y-3">
        {subjectsWithProgress.map((s, i) => {
          const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length];
          const completionPct = Math.round((s.answered / s.questionCount) * 100);
          return (
            <Link
              key={s.id}
              to={`/subjects/${s.id}`}
              className="glass-card p-4 flex items-center gap-4 group focus-ring"
              aria-label={`${s.name} - ${completionPct}% complete`}
            >
              <div className="h-11 w-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-foreground truncate">{s.name}</h2>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>{s.topicCount} topics</span>
                  <span>·</span>
                  <span>{s.questionCount} Qs</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                  <div className="h-full progress-gradient" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{completionPct}%</p>
                <ArrowRight size={14} className="text-muted-foreground ml-auto mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Subjects;