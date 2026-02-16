import { useState, useMemo } from "react";
import { Swords } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BattleLobby } from "@/components/battle/BattleLobby";
import { BattleMatch } from "@/components/battle/BattleMatch";
import { BattleResults } from "@/components/battle/BattleResults";
import { BattleChat } from "@/components/battle/BattleChat";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import type { ChatMessage } from "@/types/multiplayer";

const Battle = () => {
  const {
    roomCode,
    roomData,
    playerId,
    isHost,
    error,
    loading,
    createRoom,
    joinRoom,
    updateSettings,
    setReady,
    startGame,
    submitAnswer,
    advanceQuestion,
    sendMessage,
    playAgain,
    leaveRoom,
    setError,
  } = useMultiplayer();

  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");

  // Parse chat messages from room data
  const chatMessages = useMemo<ChatMessage[]>(() => {
    if (!roomData?.chat) return [];
    return Object.values(roomData.chat).sort((a, b) => a.createdAt - b.createdAt);
  }, [roomData?.chat]);

  const handleCreate = async () => {
    if (!nickname.trim()) return;
    setMode("create");
    await createRoom(nickname.trim());
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !joinCode.trim()) return;
    setMode("join");
    await joinRoom(joinCode.trim(), nickname.trim());
  };

  // Not in a room yet - show entry screen
  if (!roomCode || !roomData) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Battle Mode" }]} />

        <div className="glass-card p-8 md:p-12 text-center max-w-md mx-auto">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
            <Swords size={32} className="text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Battle Mode</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Challenge a friend to a real-time quiz battle!
          </p>

          {/* Nickname input */}
          <div className="mb-6">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">
              Your Nickname
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Join with code */}
          <div className="mb-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">
              Room Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-center tracking-[0.3em] uppercase font-bold focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !nickname.trim() || !joinCode.trim()}
            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-30 transition-all mb-3"
          >
            {loading && mode === "join" ? "Joining…" : "Join Room"}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !nickname.trim()}
            className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm hover:bg-muted disabled:opacity-30 transition-colors"
          >
            {loading && mode === "create" ? "Creating…" : "Create New Room"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-destructive/70 hover:text-destructive mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // In a room
  const isLobby = roomData.status === "lobby";
  const isPlaying = roomData.status === "playing";
  const isFinished = roomData.status === "finished";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLobby && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Battle Mode" }]} />
            <BattleLobby
              roomData={roomData}
              playerId={playerId}
              isHost={isHost}
              onUpdateSettings={updateSettings}
              onReady={setReady}
              onStartGame={startGame}
              onLeave={leaveRoom}
            />
          </div>
        )}

        {isPlaying && roomData.game && (
          <BattleMatch
            roomData={roomData}
            playerId={playerId}
            isHost={isHost}
            onSubmitAnswer={submitAnswer}
            onAdvanceQuestion={advanceQuestion}
          />
        )}

        {isFinished && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <BattleResults
              roomData={roomData}
              playerId={playerId}
              isHost={isHost}
              onPlayAgain={playAgain}
              onLeave={leaveRoom}
            />
          </div>
        )}
      </div>

      {/* Chat panel */}
      {roomCode && (
        <BattleChat
          messages={chatMessages}
          onSend={sendMessage}
          playerId={playerId}
        />
      )}
    </div>
  );
};

export default Battle;
