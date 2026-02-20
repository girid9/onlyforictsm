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
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bookmarks" }]} />
      <div className="flex items-center gap-2 mb-5">
        <Bookmark size={18} className="text-primary" />
        <h1 className="text-xl font-bold">Bookmarks</h1>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-bold">{bookmarkedQuestions.length}</span>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Bookmark size={32} className="mx-auto text-muted-foreground/25 mb-3" />
          <p className="text-xs text-muted-foreground">No bookmarks yet</p>
          <Link to="/subjects" className="text-primary text-xs hover:underline mt-2 inline-block">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookmarkedQuestions.map((q) => (
            <div key={q.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-bold text-primary uppercase">{q.subjectName}</span>
                    <span className="text-[9px] text-muted-foreground">· {q.topicName}</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-foreground">{q.question}</p>
                </div>
                <button onClick={() => toggleBookmark(q.id)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0">
                  <BookmarkX size={13} />
                </button>
              </div>
              <div className="bg-success/5 border border-success/15 rounded-lg px-3 py-2">
                <p className="text-[10px] font-medium text-success">✓ {OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;