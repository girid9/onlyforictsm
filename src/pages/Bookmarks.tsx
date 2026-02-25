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
    <div className="p-5 md:p-8 max-w-xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bookmarks" }]} />
      <div className="flex items-center gap-2 mb-6">
        <Bookmark size={20} className="text-primary" />
        <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        <span className="text-xs text-muted-foreground px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "hsl(var(--glass-bg) / 0.1)" }}>{bookmarkedQuestions.length}</span>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bookmark size={36} className="mx-auto text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">No bookmarks yet</p>
          <Link to="/subjects" className="text-primary text-sm hover:underline mt-2 inline-block font-medium">Start practicing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarkedQuestions.map((q) => (
            <div key={q.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-semibold text-primary">{q.subjectName}</span>
                    <span className="text-[10px] text-muted-foreground">· {q.topicName}</span>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-foreground">{q.question}</p>
                </div>
                <button onClick={() => toggleBookmark(q.id)} className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive shrink-0 active:scale-95 transition-all" style={{ background: "hsl(var(--glass-bg) / 0.1)" }}>
                  <BookmarkX size={14} />
                </button>
              </div>
              <div className="rounded-xl px-3.5 py-2.5 bg-success/10" style={{ border: "1px solid hsl(var(--success) / 0.2)" }}>
                <p className="text-xs font-medium text-success">✓ {OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
