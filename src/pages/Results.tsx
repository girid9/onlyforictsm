import { Link, useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/useAppStore";
import { CheckCircle2, RotateCcw, Home, Trophy, Target, Award } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";

const OPTION_LABELS = ["A", "B", "C", "D"];

const Results = () => {
  const { sessionResult, setSessionResult } = useDataStore();
  const navigate = useNavigate();

  if (!sessionResult) {
    return (
      <div className="p-5 max-w-xl mx-auto text-center pt-12">
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
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10 space-y-5">
      {/* Hero Result */}
      <div className="glass-card p-6 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          {pct >= 70 ? <Trophy size={32} className="text-warning" /> : pct >= 40 ? <Award size={32} className="text-primary" /> : <Target size={32} className="text-destructive" />}
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">{subjectName} · {topicName}</p>
        
        <div className="flex justify-center mb-4">
          <ProgressRing value={pct} size={96} strokeWidth={7} />
        </div>
        
        <p className="text-base font-bold text-foreground">
          {pct >= 90 ? "Mastery Achieved! 🎉" : pct >= 70 ? "Great Job! 👏" : pct >= 40 ? "Keep Practicing 💪" : "Needs Improvement 📚"}
        </p>

        <div className="flex items-center justify-center gap-8 mt-5 pt-4" style={{ borderTop: "1px solid hsl(var(--glass-border) / 0.1)" }}>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{correct}/{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Score</p>
          </div>
          <div className="h-8 w-px" style={{ background: "hsl(var(--glass-border) / 0.15)" }} />
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{minutes}:{seconds.toString().padStart(2, '0')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Time</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setSessionResult(null); navigate(`/practice/${subjectId}/${topicId}`); }}
          className="gradient-btn rounded-2xl py-3.5 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <RotateCcw size={16} /> Retry
        </button>
        <Link to="/" className="glass-card rounded-2xl py-3.5 text-sm font-semibold text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Home size={16} /> Home
        </Link>
      </div>

      {/* Review */}
      <div>
        <p className="text-base font-bold text-foreground mb-3">Review</p>
        <div className="space-y-2.5">
          {questionResults.map((qr, i) => (
            <div key={i} className="glass-card p-4" style={{ borderLeft: `3px solid hsl(var(--${qr.correct ? 'success' : 'destructive'}))` }}>
              <div className="flex items-start gap-3">
                {qr.correct ? <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" /> : <Target size={16} className="text-destructive shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-relaxed">{i + 1}. {qr.question.question}</p>
                  {!qr.correct && (
                    <p className="text-xs text-success mt-1.5 font-medium">
                      ✓ {OPTION_LABELS[qr.question.answerIndex]}. {qr.question.options[qr.question.answerIndex]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;
