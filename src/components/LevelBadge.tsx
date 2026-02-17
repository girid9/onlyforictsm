import { Shield } from "lucide-react";

const LEVELS = [
  { name: "Beginner", minXP: 0, emoji: "🌱" },
  { name: "Learner", minXP: 100, emoji: "📖" },
  { name: "Skilled", minXP: 500, emoji: "⚡" },
  { name: "Expert", minXP: 1000, emoji: "🔥" },
  { name: "Master", minXP: 2500, emoji: "👑" },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXP) current = level;
  }
  const currentIdx = LEVELS.indexOf(current);
  const next = LEVELS[currentIdx + 1];
  const progress = next
    ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100;
  return { ...current, level: currentIdx + 1, next, progress };
}

interface Props {
  xp: number;
  compact?: boolean;
}

export function LevelBadge({ xp, compact }: Props) {
  const level = getLevel(xp);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
        {level.emoji} Lv.{level.level}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-base">
        {level.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground">{level.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${level.progress}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground font-bold">{level.progress}%</span>
        </div>
      </div>
    </div>
  );
}
