import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { getTopicStats, getSpacedRepetitionDue } from "@/utils/analytics";
import { motion } from "framer-motion";
import { RotateCcw, Brain, Zap, AlertTriangle, CalendarClock } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const Revision = () => {
  const { questionsBySubjectTopic } = useDataStore();
  const { answers } = useProgressStore();
  const navigate = useNavigate();

  const wrongCount = useMemo(() => Object.values(answers).filter((a) => !a.correct).length, [answers]);
  const topicStats = useMemo(() => getTopicStats(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const hardTopicCount = useMemo(() => topicStats.filter((t) => t.accuracy < 50 && t.attempted >= 2).length, [topicStats]);
  const srsDue = useMemo(() => getSpacedRepetitionDue(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);

  const totalQuestions = useMemo(() => {
    let count = 0;
    for (const topics of Object.values(questionsBySubjectTopic)) {
      for (const qs of Object.values(topics)) count += qs.length;
    }
    return count;
  }, [questionsBySubjectTopic]);

  const modes = [
    {
      id: "srs",
      title: "Spaced Repetition",
      description: "Questions you got wrong resurface after 1, 3, and 7 days. Science-backed memory boost!",
      icon: CalendarClock,
      color: "text-primary",
      bgColor: "bg-primary/10",
      stat: `${srsDue.length} due now`,
      disabled: srsDue.length === 0,
    },
    {
      id: "wrong",
      title: "Wrong Questions Only",
      description: "Re-practice all questions you got wrong. Fix your mistakes.",
      icon: RotateCcw,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      stat: `${wrongCount} questions`,
      disabled: wrongCount === 0,
    },
    {
      id: "hard",
      title: "Hard Topics Only",
      description: "Focus on topics where your accuracy is below 50%.",
      icon: Brain,
      color: "text-warning",
      bgColor: "bg-warning/10",
      stat: `${hardTopicCount} topics`,
      disabled: hardTopicCount === 0,
    },
    {
      id: "fast20",
      title: "Fast 20 Challenge",
      description: "Random 20 questions with a 10-minute timer. Test your speed!",
      icon: Zap,
      color: "text-success",
      bgColor: "bg-success/10",
      stat: `${Math.min(20, totalQuestions)} questions`,
      disabled: totalQuestions === 0,
    },
  ];

  const handleStart = (modeId: string) => {
    sessionStorage.setItem("revision-mode", modeId);
    navigate("/revision/practice");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-4 md:p-8 max-w-lg mx-auto min-h-screen">
      <motion.h1 variants={fadeUp} className="text-2xl font-bold text-foreground mb-1">Smart Revision</motion.h1>
      <motion.p variants={fadeUp} className="text-sm text-muted-foreground mb-6">Choose a revision mode to strengthen your weak areas</motion.p>

      <div className="space-y-4">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart(mode.id)}
            disabled={mode.disabled}
            className="glass-card p-5 w-full text-left flex items-start gap-4 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className={`h-12 w-12 rounded-xl ${mode.bgColor} flex items-center justify-center shrink-0`}>
              <mode.icon size={24} className={mode.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground mb-1">{mode.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{mode.description}</p>
              <p className={`text-[10px] font-bold mt-2 ${mode.color} uppercase`}>{mode.stat}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {wrongCount === 0 && hardTopicCount === 0 && srsDue.length === 0 && (
        <motion.div variants={fadeUp} className="glass-card p-6 text-center mt-6">
          <AlertTriangle size={24} className="text-warning mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Start practising first to unlock revision modes!</p>
          <button onClick={() => navigate('/subjects')} className="gradient-btn px-6 py-2.5 text-xs mt-4">Browse Subjects</button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Revision;
