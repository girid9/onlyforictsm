import { Link, useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/useAppStore";
import { CheckCircle2, Clock, RotateCcw, Home, Trophy, Target, Award } from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"];

const Results = () => {
  const { sessionResult, setSessionResult } = useDataStore();
  const navigate = useNavigate();

  if (!sessionResult) {
    return (<div className="p-6 max-w-3xl mx-auto text-center"><p className="text-muted-foreground mb-4">No results available.</p><Link to="/subjects" className="text-primary hover:underline">Go to subjects</Link></div>);
  }

  const { subjectName, topicName, total, correct, timeTaken, questionResults, subjectId, topicId } = sessionResult;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Quiz Results</h1>
      <p className="text-muted-foreground mb-6">{subjectName} › {topicName}</p>

      <div className="glass-card overflow-hidden mb-6">
        <div className={`p-8 text-center border-b border-border ${pct >= 70 ? "bg-success/5" : pct >= 40 ? "bg-warning/5" : "bg-destructive/5"}`}>
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-background mb-4">
            {pct >= 70 ? <Trophy size={36} className="text-warning" /> : pct >= 40 ? <Award size={36} className="text-primary" /> : <Target size={36} className="text-destructive" />}
          </div>
          <div className={`text-6xl font-bold mb-2 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"}`}>
            {pct}%
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {pct >= 90 ? "Mastery Achieved!" : pct >= 70 ? "Great Job!" : pct >= 40 ? "Keep Practicing" : "Needs Improvement"}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border bg-card/50">
          {[
            { label: "Score", value: <><CheckCircle2 size={16} className="text-success" /> {correct}/{total}</>, },
            { label: "Time", value: <><Clock size={16} className="text-muted-foreground" /> {minutes}m {seconds}s</>, },
            { label: "Accuracy", value: <><Target size={16} className="text-primary" /> {pct}%</>, },
          ].map((item, i) => (
            <div key={i} className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase mb-1">{item.label}</p>
              <p className="text-lg font-bold flex items-center justify-center gap-1.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={() => { setSessionResult(null); navigate(`/practice/${subjectId}/${topicId}`); }}
          className="gradient-btn flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm"
          aria-label="Retry this quiz"
        >
          <RotateCcw size={16} /> Retry
        </button>
        <Link to="/" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-muted text-sm focus-ring">
          <Home size={16} /> Home
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">Review</h2>
      <div className="space-y-3">
        {questionResults.map((qr, i) => (
          <div key={i} className={`glass-card p-4 border-l-4 ${qr.correct ? "border-l-success" : "border-l-destructive"}`}>
            <p className="text-sm font-medium mb-2">{i + 1}. {qr.question.question}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Your answer: <span className={qr.correct ? "text-success" : "text-destructive"}>{qr.selectedIndex >= 0 ? `${OPTION_LABELS[qr.selectedIndex]}. ${qr.question.options[qr.selectedIndex]}` : "Not answered"}</span></p>
              {!qr.correct && <p>Correct: <span className="text-success">{OPTION_LABELS[qr.question.answerIndex]}. {qr.question.options[qr.question.answerIndex]}</span></p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
