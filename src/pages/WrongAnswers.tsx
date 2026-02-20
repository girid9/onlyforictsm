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
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wrong Answers" }]} />
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <XCircle size={18} className="text-destructive" />
          <h1 className="text-xl font-bold">Wrong Answers</h1>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-bold">{wrongQuestions.length}</span>
        </div>
        {wrongQuestions.length > 0 && (
          <button onClick={clearWrongAnswers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/8 text-destructive text-[10px] font-bold hover:bg-destructive/15">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <XCircle size={32} className="mx-auto text-muted-foreground/25 mb-3" />
          <p className="text-xs text-muted-foreground">No wrong answers yet</p>
          <Link to="/subjects" className="text-primary text-xs hover:underline mt-2 inline-block">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {wrongQuestions.map((q) => {
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="glass-card p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-bold text-destructive uppercase">{q.subjectName}</span>
                  <span className="text-[9px] text-muted-foreground">· {q.topicName}</span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-foreground mb-3">{q.question}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-destructive/5 border border-destructive/15 rounded-lg px-2.5 py-2">
                    <p className="text-[9px] font-bold text-destructive uppercase mb-0.5">Yours</p>
                    <p className="text-[10px] font-medium text-foreground">{OPTION_LABELS[userAnswer.selectedIndex]}. {q.options[userAnswer.selectedIndex]}</p>
                  </div>
                  <div className="bg-success/5 border border-success/15 rounded-lg px-2.5 py-2">
                    <p className="text-[9px] font-bold text-success uppercase mb-0.5">Correct</p>
                    <p className="text-[10px] font-medium text-foreground">{OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
                  </div>
                </div>
                <Link to={`/practice/${q.subjectId}/${q.topicId}`} className="inline-flex items-center text-primary text-[10px] font-bold hover:underline gap-1">
                  Practice topic <ArrowRight size={10} />
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