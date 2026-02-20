import { Link, useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/useAppStore";
import { CheckCircle2, Clock, RotateCcw, Home, Trophy, Target, Award } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";

const OPTION_LABELS = ["A", "B", "C", "D"];

const Results = () => {
  const { sessionResult, setSessionResult } = useDataStore();
  const navigate = useNavigate();

  if (!sessionResult) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center pt-12">
        <p className="text-muted-foreground mb-4">No results available.</p>
        <Link to="/subjects" className="text-primary hover:underline text-sm">Go to subjects</Link>
      </div>
    );
  }

  const { subjectName, topicName, total, correct, timeTaken, questionResults, subjectId, topicId } = sessionResult;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      {/* Hero Result */}
      <div className="glass-card p-6 text-center mb-5">
        <div className="inline-flex items-center justify-center mb-4">
          {pct >= 70 ? <Trophy size={28} className="text-warning" /> : pct >= 40 ? <Award size={28} className="text-primary" /> : <Target size={28} className="text-destructive" />}
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{subjectName} · {topicName}</p>
        
        <div className="flex justify-center mb-3">
          <ProgressRing value={pct} size={88} strokeWidth={7} />
        </div>
        
        <p className="text-sm font-bold text-foreground">
          {pct >= 90 ? "Mastery Achieved! 🎉" : pct >= 70 ? "Great Job! 👏" : pct >= 40 ? "Keep Practicing 💪" : "Needs Improvement 📚"}
        </p>

        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/30">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{correct}/{total}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Score</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{minutes}:{seconds.toString().padStart(2, '0')}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Time</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <button
          onClick={() => { setSessionResult(null); navigate(`/practice/${subjectId}/${topicId}`); }}
          className="gradient-btn flex items-center justify-center gap-2 py-3 text-sm"
        >
          <RotateCcw size={15} /> Retry
        </button>
        <Link to="/" className="glass-card flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground">
          <Home size={15} /> Home
        </Link>
      </div>

      {/* Review */}
      <p className="text-sm font-bold text-foreground mb-3">Review</p>
      <div className="space-y-2">
        {questionResults.map((qr, i) => (
          <div key={i} className={`glass-card p-3.5 border-l-3 ${qr.correct ? "border-l-success" : "border-l-destructive"}`}>
            <div className="flex items-start gap-2">
              {qr.correct ? <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" /> : <Target size={14} className="text-destructive shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground leading-relaxed">{i + 1}. {qr.question.question}</p>
                {!qr.correct && (
                  <p className="text-[10px] text-success mt-1">
                    ✓ {OPTION_LABELS[qr.question.answerIndex]}. {qr.question.options[qr.question.answerIndex]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;