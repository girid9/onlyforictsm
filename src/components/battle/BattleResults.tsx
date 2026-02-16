import { Trophy, Target, Zap, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import type { RoomData } from "@/types/multiplayer";

interface Props {
  roomData: RoomData;
  playerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function BattleResults({ roomData, playerId, isHost, onPlayAgain, onLeave }: Props) {
  const players = roomData.players || {};
  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((id) => id !== playerId) || "";
  const myPlayer = players[playerId];
  const opponentPlayer = players[opponentId];
  const settings = roomData.settings!;

  const myScore = myPlayer?.score || 0;
  const opScore = opponentPlayer?.score || 0;
  const myAnswers = myPlayer?.answers || {};
  const opAnswers = opponentPlayer?.answers || {};
  const myCorrect = Object.values(myAnswers).filter((a) => a.correct).length;
  const opCorrect = Object.values(opAnswers).filter((a) => a.correct).length;

  const winner = myScore > opScore ? "you" : myScore < opScore ? "opponent" : "tie";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Winner Banner */}
      <div className={`glass-card p-8 text-center ${
        winner === "you" ? "bg-success/5" : winner === "opponent" ? "bg-destructive/5" : "bg-warning/5"
      }`}>
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-background mb-4 shadow-sm">
          <Trophy
            size={40}
            className={
              winner === "you" ? "text-success" : winner === "opponent" ? "text-destructive" : "text-warning"
            }
          />
        </div>
        <h1 className="text-2xl font-black mb-1">
          {winner === "you" ? "🎉 You Win!" : winner === "opponent" ? "😔 You Lost" : "🤝 It's a Tie!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {settings.topicName}
        </p>
      </div>

      {/* Score Comparison */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-border">
          {/* My side */}
          <div className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-xs font-bold text-primary">
                {myPlayer?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-bold truncate">{myPlayer?.name}</p>
            <p className="text-3xl font-black text-primary mt-1">{myScore}</p>
          </div>

          {/* Stats middle */}
          <div className="p-4 flex flex-col items-center justify-center gap-2">
            <div className="text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">VS</p>
            </div>
          </div>

          {/* Opponent side */}
          <div className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-xs font-bold text-warning">
                {opponentPlayer?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-bold truncate">{opponentPlayer?.name}</p>
            <p className="text-3xl font-black text-warning mt-1">{opScore}</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="border-t border-border">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{myCorrect}/{settings.questionCount}</p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Target size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Correct</span>
              </div>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{opCorrect}/{settings.questionCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">+{myPlayer?.speedBonus || 0}</p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Zap size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Speed Bonus</span>
              </div>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">+{opponentPlayer?.speedBonus || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {myCorrect > 0 ? Math.round((myCorrect / settings.questionCount) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Target size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Accuracy</span>
              </div>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {opCorrect > 0 ? Math.round((opCorrect / settings.questionCount) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
          >
            <RotateCcw size={16} /> Play Again
          </button>
        )}
        <Link
          to="/"
          onClick={onLeave}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm hover:bg-muted transition-colors"
        >
          <Home size={16} /> Home
        </Link>
      </div>

      {!isHost && (
        <p className="text-xs text-muted-foreground text-center">
          Waiting for host to start a new game…
        </p>
      )}
    </div>
  );
}
