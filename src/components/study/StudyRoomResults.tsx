import { Trophy, RotateCcw, LogOut } from "lucide-react";
import type { StudyRoomData } from "@/hooks/useStudyRoom";

interface Props {
  roomData: StudyRoomData;
  playerId: string;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export function StudyRoomResults({ roomData, playerId, isHost, onRestart, onLeave }: Props) {
  const members = roomData.members || {};
  const sorted = Object.entries(members).sort(([, a], [, b]) => b.score - a.score);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="glass-card p-8 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center mb-4">
          <Trophy size={32} className="text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
        <p className="text-sm text-muted-foreground">Here's how everyone did</p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Leaderboard</h3>
        <div className="space-y-3">
          {sorted.map(([id, m], i) => {
            const isMe = id === playerId;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            return (
              <div key={id} className={`flex items-center gap-3 p-3 rounded-lg border ${isMe ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/50"}`}>
                <span className="text-lg w-8 text-center">{medal}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{m.name}{isMe ? " (You)" : ""}</p>
                </div>
                <span className="text-lg font-black text-primary">{m.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onLeave} className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
          <LogOut size={16} /> Leave
        </button>
        {isHost && (
          <button onClick={onRestart} className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Study Again
          </button>
        )}
      </div>
    </div>
  );
}
