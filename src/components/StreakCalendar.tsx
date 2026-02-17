import { useMemo } from "react";
import { AnswerRecord } from "@/store/useAppStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  answers: Record<string, AnswerRecord>;
}

export function StreakCalendar({ answers }: Props) {
  const days = useMemo(() => {
    const now = new Date();
    const result: { date: string; count: number; label: string }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = Object.values(answers).filter(
        (a) => a.answeredAt?.startsWith(dateStr)
      ).length;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ date: dateStr, count, label });
    }
    return result;
  }, [answers]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => {
          const intensity = day.count > 0 ? Math.max(0.2, day.count / maxCount) : 0;
          return (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-sm border transition-colors ${
                    day.count > 0 ? "border-primary/30" : "border-border/50"
                  }`}
                  style={{
                    backgroundColor: day.count > 0
                      ? `hsl(var(--primary) / ${intensity})`
                      : "hsl(var(--muted) / 0.3)",
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-bold">{day.label}</p>
                <p className="text-muted-foreground">{day.count} questions</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] text-muted-foreground">30 days ago</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-sm border border-border/30"
              style={{
                backgroundColor: v > 0
                  ? `hsl(var(--primary) / ${v})`
                  : "hsl(var(--muted) / 0.3)",
              }}
            />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
