import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkX } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Question } from "@/types/question";

const OPTION_LABELS = ["A", "B", "C", "D"];

const Bookmarks = () => {
  const { questionsBySubjectTopic } = useDataStore();
  const { bookmarkedIds, toggleBookmark } = useProgressStore();

  const bookmarkedQuestions = useMemo(() => {
    const all: Question[] = [];
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const questions of Object.values(topics)) all.push(...questions);
    }
    return all.filter((q) => bookmarkedIds.includes(q.id));
  }, [questionsBySubjectTopic, bookmarkedIds]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bookmarks" }]} />
      <div className="flex items-center gap-3 mb-6">
        <Bookmark size={24} className="text-primary" />
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <span className="text-sm text-muted-foreground">({bookmarkedQuestions.length})</span>
      </div>
      {bookmarkedQuestions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bookmark size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No bookmarked questions yet.</p>
          <Link to="/subjects" className="text-primary text-sm hover:underline mt-2 inline-block">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedQuestions.map((q) => (
            <div key={q.id} className="glass-card overflow-hidden group">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-tight">{q.subjectName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{q.topicName}</span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed">{q.question}</p>
                  </div>
                  <button onClick={() => toggleBookmark(q.id)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all shrink-0" title="Remove bookmark">
                    <BookmarkX size={16} />
                  </button>
                </div>
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">Correct Answer</p>
                  <p className="text-xs font-medium text-foreground">{OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
