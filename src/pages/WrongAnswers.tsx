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
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wrong Answers" }]} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <XCircle size={20} className="text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Wrong Answers</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-semibold">{wrongQuestions.length}</span>
        </div>
        {wrongQuestions.length > 0 && (
          <button onClick={clearWrongAnswers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 active:scale-95 transition-all">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border/30">
          <XCircle size={36} className="mx-auto text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">No wrong answers yet</p>
          <Link to="/subjects" className="text-primary text-sm hover:underline mt-2 inline-block font-medium">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {wrongQuestions.map((q) => {
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-semibold text-destructive">{q.subjectName}</span>
                  <span className="text-[10px] text-muted-foreground">· {q.topicName}</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-foreground mb-3">{q.question}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-destructive/8 border border-destructive/15 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-destructive mb-0.5">Your answer</p>
                    <p className="text-xs font-medium text-foreground">{OPTION_LABELS[userAnswer.selectedIndex]}. {q.options[userAnswer.selectedIndex]}</p>
                  </div>
                  <div className="bg-success/8 border border-success/15 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-success mb-0.5">Correct</p>
                    <p className="text-xs font-medium text-foreground">{OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
                  </div>
                </div>
                <Link to={`/practice/${q.subjectId}/${q.topicId}`} className="inline-flex items-center text-primary text-xs font-semibold hover:underline gap-1">
                  Practice topic <ArrowRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WrongAnswers;
