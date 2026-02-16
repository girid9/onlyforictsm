import { useState, useMemo } from "react";
import { Swords, Copy, Check, Users, Settings, Wifi, WifiOff } from "lucide-react";
import { useDataStore } from "@/store/useAppStore";
import type { RoomData, RoomSettings } from "@/types/multiplayer";

interface Props {
  roomData: RoomData;
  playerId: string;
  isHost: boolean;
  onUpdateSettings: (settings: RoomSettings) => void;
  onReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export function BattleLobby({
  roomData,
  playerId,
  isHost,
  onUpdateSettings,
  onReady,
  onStartGame,
  onLeave,
}: Props) {
  const { subjects, topicsBySubject } = useDataStore();
  const [copied, setCopied] = useState(false);

  const players = roomData.players || {};
  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((id) => id !== playerId);
  const myPlayer = players[playerId];
  const opponentPlayer = opponentId ? players[opponentId] : null;

  const settings = roomData.settings;
  const [selectedSubject, setSelectedSubject] = useState(settings?.subjectId || "");
  const [selectedTopic, setSelectedTopic] = useState(settings?.topicId || "");
  const [questionCount, setQuestionCount] = useState(settings?.questionCount || 10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(settings?.secondsPerQuestion || 15);

  const availableTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return topicsBySubject[selectedSubject] || [];
  }, [selectedSubject, topicsBySubject]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopic("");
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject) {
      const topics = topicsBySubject[subjectId] || [];
      if (topics.length > 0) {
        setSelectedTopic(topics[0].id);
        onUpdateSettings({
          subjectId,
          topicId: topics[0].id,
          subjectName: subject.name,
          topicName: topics[0].name,
          questionCount,
          secondsPerQuestion,
        });
      }
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    const subject = subjects.find((s) => s.id === selectedSubject);
    const topic = availableTopics.find((t) => t.id === topicId);
    if (subject && topic) {
      onUpdateSettings({
        subjectId: selectedSubject,
        topicId,
        subjectName: subject.name,
        topicName: topic.name,
        questionCount,
        secondsPerQuestion,
      });
    }
  };

  const handleCountChange = (count: number) => {
    setQuestionCount(count);
    if (selectedSubject && selectedTopic) {
      const subject = subjects.find((s) => s.id === selectedSubject);
      const topic = availableTopics.find((t) => t.id === selectedTopic);
      if (subject && topic) {
        onUpdateSettings({
          subjectId: selectedSubject,
          topicId: selectedTopic,
          subjectName: subject.name,
          topicName: topic.name,
          questionCount: count,
          secondsPerQuestion,
        });
      }
    }
  };

  const handleTimerChange = (secs: number) => {
    setSecondsPerQuestion(secs);
    if (selectedSubject && selectedTopic) {
      const subject = subjects.find((s) => s.id === selectedSubject);
      const topic = availableTopics.find((t) => t.id === selectedTopic);
      if (subject && topic) {
        onUpdateSettings({
          subjectId: selectedSubject,
          topicId: selectedTopic,
          subjectName: subject.name,
          topicName: topic.name,
          questionCount,
          secondsPerQuestion: secs,
        });
      }
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allReady = opponentPlayer?.ready;
  const hasSettings = !!settings?.subjectId && !!settings?.topicId;
  const canStart = isHost && playerIds.length === 2 && allReady && hasSettings;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Room Code */}
      <div className="glass-card p-6 text-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Room Code
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-black tracking-[0.3em] text-primary">
            {roomData.code}
          </span>
          <button onClick={copyCode} className="p-2 hover:bg-muted rounded-md transition-colors">
            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Share this code with your opponent
        </p>
      </div>

      {/* Players */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Players</h3>
        </div>
        <div className="space-y-3">
          {/* Me */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {myPlayer?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold">{myPlayer?.name} <span className="text-[10px] text-muted-foreground">(You{isHost ? " · Host" : ""})</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {myPlayer?.connected ? (
                <Wifi size={14} className="text-success" />
              ) : (
                <WifiOff size={14} className="text-destructive" />
              )}
            </div>
          </div>

          {/* Opponent */}
          {opponentPlayer ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-warning">
                    {opponentPlayer.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {opponentPlayer.name}
                    {!isHost && " (Host)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {opponentPlayer.connected ? (
                  <Wifi size={14} className="text-success" />
                ) : (
                  <WifiOff size={14} className="text-destructive" />
                )}
                {opponentPlayer.ready && (
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                    READY
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-3 rounded-lg border border-dashed border-border">
              <p className="text-xs text-muted-foreground animate-pulse">Waiting for opponent…</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings (host editable, joiner read-only) */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {isHost ? "Game Settings" : "Settings (set by host)"}
          </h3>
        </div>

        {isHost ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="">Select subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedSubject && (
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-primary/50"
                >
                  <option value="">Select topic...</option>
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.questionCount} Qs)</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Questions
                </label>
                <div className="flex gap-2">
                  {[10, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleCountChange(n)}
                      className={`flex-1 py-2 rounded-md text-sm font-bold border transition-all ${
                        questionCount === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Timer (sec)
                </label>
                <div className="flex gap-2">
                  {[10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleTimerChange(n)}
                      className={`flex-1 py-2 rounded-md text-sm font-bold border transition-all ${
                        secondsPerQuestion === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {settings ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-bold">{settings.subjectName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Topic</span>
                  <span className="font-bold">{settings.topicName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Questions</span>
                  <span className="font-bold">{settings.questionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timer</span>
                  <span className="font-bold">{settings.secondsPerQuestion}s</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Waiting for host to select settings…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onLeave}
          className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm hover:bg-muted transition-colors"
        >
          Leave Room
        </button>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-30 transition-all"
          >
            Start Game
          </button>
        ) : (
          <button
            onClick={() => onReady(!myPlayer?.ready)}
            disabled={!hasSettings}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
              myPlayer?.ready
                ? "bg-success text-success-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30"
            }`}
          >
            {myPlayer?.ready ? "✓ Ready!" : "Ready Up"}
          </button>
        )}
      </div>
    </div>
  );
}
