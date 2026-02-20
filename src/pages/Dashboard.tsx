import { useMemo } from "react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { getTopicStats, getSubjectProgress, getRecentActivity, getAccuracyTrend } from "@/utils/analytics";
import { StreakCalendar } from "@/components/StreakCalendar";
import { LevelBadge } from "@/components/LevelBadge";
import ProgressRing from "@/components/ProgressRing";
import { Target, TrendingUp, TrendingDown, Zap, Clock, CheckCircle2, XCircle, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const Dashboard = () => {
  const { subjects, questionsBySubjectTopic } = useDataStore();
  const { answers, streak, xp } = useProgressStore();

  const topicStats = useMemo(() => getTopicStats(answers, questionsBySubjectTopic), [answers, questionsBySubjectTopic]);
  const subjectProgress = useMemo(() => getSubjectProgress(answers, questionsBySubjectTopic, subjects), [answers, questionsBySubjectTopic, subjects]);
  const recentActivity = useMemo(() => getRecentActivity(answers, questionsBySubjectTopic, 6), [answers, questionsBySubjectTopic]);
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-8">
      <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-xs text-muted-foreground mb-5">Your learning analytics</p>

      {/* Main stats */}
      <div className="glass-card p-5 mb-4 flex items-center gap-5">
        <ProgressRing value={overallAccuracy} size={72} strokeWidth={6} label="Accuracy" />
        <div className="flex-1 grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: `${streak}d`, color: "text-warning" },
            { icon: Zap, label: "XP", value: String(xp), color: "text-primary" },
            { icon: Clock, label: "Speed", value: avgSpeed ? `${avgSpeed}/m` : "—", color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon size={14} className={`${s.color} mx-auto mb-1`} />
              <p className="text-xs font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="glass-card p-4 mb-4">
        <LevelBadge xp={xp} />
      </div>

      {/* Streak Calendar */}
      <div className="glass-card p-4 mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">30-Day Activity</p>
        <StreakCalendar answers={answers} />
      </div>

      {/* Accuracy Trend */}
      {trend.length > 1 && (
        <div className="glass-card p-4 mb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Trend</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={28} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2.5, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strong & Weak */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={12} className="text-success" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Strong</p>
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">Keep practising</p>
          ) : strongTopics.map((t) => (
            <div key={`${t.subjectId}-${t.topicId}`} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-foreground truncate mr-2">{t.topicName}</p>
                <span className="text-[10px] font-bold text-success">{t.accuracy}%</span>
              </div>
              <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${t.accuracy}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown size={12} className="text-destructive" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Weak</p>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">Keep practising</p>
          ) : weakTopics.map((t) => (
            <div key={`${t.subjectId}-${t.topicId}`} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-foreground truncate mr-2">{t.topicName}</p>
                <span className="text-[10px] font-bold text-destructive">{t.accuracy}%</span>
              </div>
              <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: `${t.accuracy}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Progress */}
      <div className="glass-card p-4 mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Subjects</p>
        <div className="space-y-3">
          {subjectProgress.map((s) => (
            <div key={s.subjectId}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-foreground truncate">{s.subjectName}</p>
                <span className="text-[10px] text-muted-foreground">{s.completion}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full progress-gradient" style={{ width: `${s.completion}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="glass-card p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent</p>
        {recentActivity.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-1.5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                {a.correct ? <CheckCircle2 size={12} className="text-success shrink-0" /> : <XCircle size={12} className="text-destructive shrink-0" />}
                <p className="text-[11px] font-medium text-foreground truncate flex-1">{a.topicName}</p>
                <span className="text-[9px] text-muted-foreground shrink-0">
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