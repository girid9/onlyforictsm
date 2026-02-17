import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Swords, ArrowRight, Target, TrendingUp, Search, Zap, Clock, Sparkles } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

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

  const statItems = [
    { label: "Accuracy", value: `${stats.accuracy}%`, icon: TrendingUp, gradient: "from-primary/20 to-primary/5" },
    { label: "XP Points", value: stats.xp, icon: Zap, gradient: "from-warning/20 to-warning/5" },
    { label: "Answered", value: stats.answered, icon: Target, gradient: "from-success/20 to-success/5" },
    { label: "Streak", value: `${stats.streak}d`, icon: Clock, gradient: "from-accent/20 to-accent/5" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-background min-h-screen">
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles size={20} className="text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold ml-8">Performance Overview</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statItems.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className="compact-card p-4 overflow-hidden relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-80 transition-opacity duration-300`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={14} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div variants={fadeUp} className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects or topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search subjects or topics"
            className="w-full pl-12 pr-4 py-3 bg-card/60 backdrop-blur-md border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-bold mb-2">Start Practice</h2>
              <p className="text-xs text-muted-foreground mb-6">Select a subject and begin your simulation session.</p>
            </div>
            <button
              onClick={() => navigate('/subjects')}
              className="gradient-btn w-full py-3 text-xs uppercase tracking-widest"
              aria-label="Browse all subjects"
            >
              Browse Subjects
            </button>
          </motion.div>

          {lastVisited ? (
            <motion.div whileHover={{ y: -3 }}>
              <Link to={`/practice/${lastVisited.subjectId}/${lastVisited.topicId}`}
                className="glass-card p-6 flex items-center justify-between group h-full"
                aria-label={`Resume ${lastVisited.topicName}`}
              >
                <div>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Resume Last Session</p>
                  <p className="font-bold text-sm truncate max-w-[200px]">{lastVisited.topicName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{lastVisited.subjectName}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                  <ArrowRight size={18} className="text-primary group-hover:text-primary-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ) : (
            <div className="glass-card p-6 flex items-center justify-center border-dashed opacity-60">
              <p className="text-xs text-muted-foreground font-medium italic">No recent sessions found</p>
            </div>
          )}
        </motion.div>

        {/* Secondary Links */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { to: "/subjects", icon: BookOpen, label: "Subjects" },
            { to: "/battle", icon: Swords, label: "Battle" },
            { to: "/bookmarks", icon: Target, label: "Bookmarks" },
          ].map(({ to, icon: Icon, label }) => (
            <motion.div key={to} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link to={to} className="compact-card p-4 flex items-center gap-3 group focus-ring" aria-label={label}>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                  <Icon size={16} className="text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
