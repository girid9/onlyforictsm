import { useMemo } from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowRight, Trash2 } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Question } from "@/types/question";

const OPTION_LABELS = ["A", "B", "C", "D"];

const WrongAnswers = () => {
  const { questionsBySubjectTopic } = useDataStore();
  const { answers, clearWrongAnswers } = useProgressStore();

  const wrongQuestions = useMemo(() => {
    const all: Question[] = [];
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const questions of Object.values(topics)) all.push(...questions);
    }
    return all.filter((q) => answers[q.id] && !answers[q.id].correct);
  }, [questionsBySubjectTopic, answers]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wrong Answers" }]} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <XCircle size={24} className="text-destructive" />
          <h1 className="text-2xl font-bold">Wrong Answers</h1>
          <span className="text-sm text-muted-foreground">({wrongQuestions.length})</span>
        </div>
        {wrongQuestions.length > 0 && (
          <button
            onClick={clearWrongAnswers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>
      {wrongQuestions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <XCircle size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No wrong answers yet. Keep practicing!</p>
          <Link to="/subjects" className="text-primary text-sm hover:underline mt-2 inline-block">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wrongQuestions.map((q) => {
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="glass-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-destructive/10 text-[10px] font-bold text-destructive uppercase tracking-tight">{q.subjectName}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{q.topicName}</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed mb-4">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-1">Your Answer</p>
                      <p className="text-xs font-medium text-foreground">{OPTION_LABELS[userAnswer.selectedIndex]}. {q.options[userAnswer.selectedIndex]}</p>
                    </div>
                    <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">Correct Answer</p>
                      <p className="text-xs font-medium text-foreground">{OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
                    </div>
                  </div>
                  <Link to={`/practice/${q.subjectId}/${q.topicId}`} className="inline-flex items-center text-primary text-xs font-bold hover:underline gap-1">
                    Practice this topic <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WrongAnswers;
