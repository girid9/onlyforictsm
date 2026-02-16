import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, GraduationCap, PenTool, Lightbulb, UserCheck } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const SUBJECT_ICONS = [GraduationCap, PenTool, Lightbulb, UserCheck];
const SUBJECT_COLORS = ["from-primary/20 to-primary/5", "from-success/20 to-success/5", "from-warning/20 to-warning/5", "from-destructive/20 to-destructive/5"];

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
          return (
            <Link key={s.id} to={`/subjects/${s.id}`} className="glass-card overflow-hidden hover:border-primary/40 transition-all group flex flex-col">
              <div className={`h-1.5 bg-gradient-to-r ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`} />
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Completion</span>
                    <span className="text-sm font-bold text-foreground">{Math.round((s.answered / s.questionCount) * 100)}%</span>
                  </div>
                </div>
                <h2 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{s.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border">{s.topicCount} Topics</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border">{s.questionCount} Questions</span>
                </div>
                <div className="mt-auto">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(s.answered / s.questionCount) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-secondary/30 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Practice Now</span>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Subjects;
