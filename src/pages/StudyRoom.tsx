import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useStudyRoom } from "@/hooks/useStudyRoom";
import { StudyRoomLobby } from "@/components/study/StudyRoomLobby";
import { StudyRoomQuiz } from "@/components/study/StudyRoomQuiz";
import { StudyRoomResults } from "@/components/study/StudyRoomResults";
import { StudyRoomChat } from "@/components/study/StudyRoomChat";

const StudyRoom = () => {
  const {
    roomCode, roomData, playerId, isHost, error, loading,
    createRoom, joinRoom, updateSettings, startStudying,
    submitAnswer, advanceQuestion, sendMessage, leaveRoom,
    restartSession, setError,
  } = useStudyRoom();

  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");

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

  // Entry screen
  if (!roomCode || !roomData) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Study Room" }]} />
        <div className="glass-card p-8 md:p-12 text-center max-w-md mx-auto">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BookOpenCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Study Room</h1>
          <p className="text-sm text-muted-foreground mb-8">Collaborate with friends on quizzes and discussions!</p>

          <div className="mb-6">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">Your Nickname</label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">Room Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-center tracking-[0.3em] uppercase font-bold focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <button onClick={handleJoin} disabled={loading || !nickname.trim() || !joinCode.trim()}
            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-30 transition-all mb-3">
            {loading && mode === "join" ? "Joining…" : "Join Room"}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleCreate} disabled={loading || !nickname.trim()}
            className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm hover:bg-muted disabled:opacity-30 transition-colors">
            {loading && mode === "create" ? "Creating…" : "Create New Room"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={() => setError(null)} className="text-xs text-destructive/70 hover:text-destructive mt-1">Dismiss</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isLobby = roomData.status === "lobby";
  const isStudying = roomData.status === "studying";
  const isFinished = roomData.status === "finished";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLobby && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Study Room" }]} />
            <StudyRoomLobby
              roomData={roomData}
              playerId={playerId}
              isHost={isHost}
              onUpdateSettings={updateSettings}
              onStart={startStudying}
              onLeave={leaveRoom}
            />
          </div>
        )}

        {isStudying && (
          <StudyRoomQuiz
            roomData={roomData}
            playerId={playerId}
            isHost={isHost}
            onSubmitAnswer={submitAnswer}
            onAdvanceQuestion={advanceQuestion}
          />
        )}

        {isFinished && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <StudyRoomResults
              roomData={roomData}
              playerId={playerId}
              isHost={isHost}
              onRestart={restartSession}
              onLeave={leaveRoom}
            />
          </div>
        )}
      </div>

      {roomCode && (
        <StudyRoomChat messages={roomData.chat} onSend={sendMessage} playerId={playerId} />
      )}
    </div>
  );
};

export default StudyRoom;
