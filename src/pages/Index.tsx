import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Swords, ArrowRight, Target, TrendingUp, Search, Zap, Clock } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";

const Home = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers, bookmarkedIds, lastVisited, streak, xp } = useProgressStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const total = Object.values(questionsBySubjectTopic).reduce(
      (acc, topics) => acc + Object.values(topics).reduce((a, qs) => a + qs.length, 0), 0
    );
    const answered = Object.keys(answers).length;
    const correct = Object.values(answers).filter((a) => a.correct).length;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return { total, answered, correct, accuracy, bookmarks: bookmarkedIds.length, streak, xp };
  }, [questionsBySubjectTopic, answers, bookmarkedIds, streak, xp]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Dashboard</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Performance Overview</p>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Accuracy", value: `${stats.accuracy}%`, icon: TrendingUp, color: "text-primary" },
          { label: "XP Points", value: stats.xp, icon: Zap, color: "text-warning" },
          { label: "Answered", value: stats.answered, icon: Target, color: "text-success" },
          { label: "Streak", value: `${stats.streak}d`, icon: Clock, color: "text-warning" },
        ].map((stat, i) => (
          <div key={i} className="compact-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search - Minimal */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search subjects or topics..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-primary/50 transition-colors" 
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="compact-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-2">Start Practice</h2>
            <p className="text-xs text-muted-foreground mb-6">Select a subject and begin your simulation session.</p>
          </div>
          <button 
            onClick={() => navigate('/subjects')} 
            className="w-full py-3 bg-primary text-primary-foreground rounded-md text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Browse Subjects
          </button>
        </div>

        {lastVisited ? (
          <Link to={`/practice/${lastVisited.subjectId}/${lastVisited.topicId}`}
            className="compact-card p-6 flex items-center justify-between hover:border-primary/30 transition-all group">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Resume Last Session</p>
              <p className="font-bold text-sm truncate max-w-[200px]">{lastVisited.topicName}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{lastVisited.subjectName}</p>
            </div>
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ) : (
          <div className="compact-card p-6 flex items-center justify-center border-dashed">
            <p className="text-xs text-muted-foreground font-medium italic">No recent sessions found</p>
          </div>
        )}
      </div>

      {/* Secondary Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Link to="/subjects" className="compact-card p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <BookOpen size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Subjects</span>
        </Link>
        <Link to="/battle" className="compact-card p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <Swords size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Battle</span>
        </Link>
        <Link to="/bookmarks" className="compact-card p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <Target size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Bookmarks</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;
