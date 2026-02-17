import { useMemo } from "react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { getTopicStats, getSubjectProgress, getRecentActivity, getAccuracyTrend } from "@/utils/analytics";
import { StreakCalendar } from "@/components/StreakCalendar";
import { LevelBadge } from "@/components/LevelBadge";
import { Target, TrendingUp, TrendingDown, Zap, Clock, CheckCircle2, XCircle, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers, streak, xp } = useProgressStore();

  const topicStats = useMemo(() => getTopicStats(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const subjectProgress = useMemo(() => getSubjectProgress(answers, questionsBySubjectTopic, subjects), [answers, questionsBySubjectTopic, subjects]);
  const recentActivity = useMemo(() => getRecentActivity(answers, questionsBySubjectTopic, 8), [answers, questionsBySubjectTopic]);
  const trend = useMemo(() => getAccuracyTrend(answers), [answers]);

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.values(answers).filter((a) => a.correct).length;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const strongTopics = useMemo(() => topicStats.filter((t) => t.attempted >= 3).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3), [topicStats]);
  const weakTopics = useMemo(() => topicStats.filter((t) => t.attempted >= 2).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3), [topicStats]);

  const avgSpeed = useMemo(() => {
    const withTime = Object.values(answers).filter((a) => a.answeredAt);
    if (withTime.length < 2) return null;
    const sorted = withTime.sort((a, b) => new Date(a.answeredAt!).getTime() - new Date(b.answeredAt!).getTime());
    const totalMs = new Date(sorted[sorted.length - 1].answeredAt!).getTime() - new Date(sorted[0].answeredAt!).getTime();
    const totalMin = totalMs / 60000;
    return totalMin > 0 ? Math.round(sorted.length / totalMin * 10) / 10 : null;
  }, [answers]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-1">Performance Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Track your progress and identify areas to improve</p>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Accuracy", value: `${overallAccuracy}%`, icon: Target, color: overallAccuracy >= 70 ? "text-success" : "text-warning" },
          { label: "Streak", value: `${streak}d`, icon: Flame, color: "text-warning" },
          { label: "XP", value: String(xp), icon: Zap, color: "text-primary" },
          { label: "Speed", value: avgSpeed ? `${avgSpeed} q/min` : "—", icon: Clock, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <stat.icon size={12} className={stat.color} />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">{stat.label}</span>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Level + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Your Level</h3>
          <LevelBadge xp={xp} />
        </div>
        <div className="glass-card p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Activity (30 Days)</h3>
          <StreakCalendar answers={answers} />
        </div>
      </div>

      {/* Accuracy Trend */}
      {trend.length > 1 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Accuracy Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strong + Weak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-success" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Strong Topics</h3>
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-xs text-muted-foreground">Answer more questions to see your strengths</p>
          ) : (
            <div className="space-y-3">
              {strongTopics.map((t) => (
                <div key={`${t.subjectId}-${t.topicId}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground truncate">{t.topicName}</p>
                    <span className="text-[10px] font-bold text-success">{t.accuracy}%</span>
                  </div>
                  <Progress value={t.accuracy} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-destructive" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Weak Topics</h3>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-muted-foreground">Answer more questions to see areas to improve</p>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((t) => (
                <div key={`${t.subjectId}-${t.topicId}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground truncate">{t.topicName}</p>
                    <span className="text-[10px] font-bold text-destructive">{t.accuracy}%</span>
                  </div>
                  <Progress value={t.accuracy} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject Progress */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Subject Progress</h3>
        <div className="space-y-4">
          {subjectProgress.map((s) => (
            <div key={s.subjectId}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">{s.subjectName}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{s.accuracy}% acc</span>
                  <span>{s.completion}% done</span>
                </div>
              </div>
              <Progress value={s.completion} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet. Start practising!</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                {a.correct ? <CheckCircle2 size={14} className="text-success shrink-0" /> : <XCircle size={14} className="text-destructive shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.topicName}</p>
                  <p className="text-[10px] text-muted-foreground">{a.subjectName}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(a.answeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
