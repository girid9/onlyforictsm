import { useState, useEffect, useCallback, useRef } from "react";
import {
  db,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  onDisconnect,
} from "@/services/firebase";
import type { RoomData, RoomSettings, ChatMessage, RoomPlayer } from "@/types/multiplayer";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generatePlayerId(): string {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useMultiplayer() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string>(() => {
    const stored = sessionStorage.getItem("battle-player-id");
    if (stored) return stored;
    const id = generatePlayerId();
    sessionStorage.setItem("battle-player-id", id);
    return id;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const isHost = roomData?.hostId === playerId;
  const players = roomData?.players || {};
  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((id) => id !== playerId) || null;
  const myPlayer = players[playerId] || null;
  const opponentPlayer = opponentId ? players[opponentId] : null;

  // Subscribe to room changes
  const subscribeToRoom = useCallback(
    (code: string) => {
      if (unsubRef.current) unsubRef.current();
      const roomRef = ref(db, `rooms/${code}`);
      const unsub = onValue(roomRef, (snapshot) => {
        const data = snapshot.val() as RoomData | null;
        if (data) {
          setRoomData(data);
        } else {
          setRoomData(null);
          setRoomCode(null);
        }
      });
      unsubRef.current = unsub;
    },
    []
  );

  // Create room
  const createRoom = useCallback(
    async (nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const code = generateRoomCode();
        const roomRef = ref(db, `rooms/${code}`);

        // Check if code exists
        const existing = await get(roomRef);
        if (existing.exists()) {
          // Extremely unlikely collision, just try once more
          return createRoom(nickname);
        }

        const room: RoomData = {
          code,
          hostId: playerId,
          createdAt: Date.now(),
          status: "lobby",
          players: {
            [playerId]: {
              name: nickname,
              ready: false,
              connected: true,
              score: 0,
              speedBonus: 0,
              answers: {},
            },
          },
        };

        await set(roomRef, room);

        // Set up disconnect handler
        const playerRef = ref(db, `rooms/${code}/players/${playerId}/connected`);
        onDisconnect(playerRef).set(false);

        setRoomCode(code);
        subscribeToRoom(code);
      } catch (err: any) {
        setError(err.message || "Failed to create room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, subscribeToRoom]
  );

  // Join room
  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const upperCode = code.toUpperCase().trim();
        const roomRef = ref(db, `rooms/${upperCode}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
          setError("Room not found");
          setLoading(false);
          return;
        }

        const room = snapshot.val() as RoomData;
        const playerCount = Object.keys(room.players || {}).length;

        if (playerCount >= 2) {
          // Check if we're reconnecting
          if (room.players[playerId]) {
            await update(ref(db, `rooms/${upperCode}/players/${playerId}`), {
              connected: true,
            });
          } else {
            setError("Room is full");
            setLoading(false);
            return;
          }
        } else {
          const newPlayer: RoomPlayer = {
            name: nickname,
            ready: false,
            connected: true,
            score: 0,
            speedBonus: 0,
            answers: {},
          };
          await update(ref(db, `rooms/${upperCode}/players/${playerId}`), newPlayer);
        }

        // Set up disconnect handler
        const playerConnRef = ref(db, `rooms/${upperCode}/players/${playerId}/connected`);
        onDisconnect(playerConnRef).set(false);

        setRoomCode(upperCode);
        subscribeToRoom(upperCode);
      } catch (err: any) {
        setError(err.message || "Failed to join room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, subscribeToRoom]
  );

  // Update settings (host only)
  const updateSettings = useCallback(
    async (settings: RoomSettings) => {
      if (!roomCode || !isHost) return;
      await update(ref(db, `rooms/${roomCode}`), { settings });
    },
    [roomCode, isHost]
  );

  // Set ready
  const setReady = useCallback(
    async (ready: boolean) => {
      if (!roomCode) return;
      await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { ready });
    },
    [roomCode, playerId]
  );

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!roomCode || !isHost) return;
    const seed = Math.floor(Math.random() * 2147483647);
    await update(ref(db, `rooms/${roomCode}`), {
      status: "playing",
      seed,
      game: {
        questionIndex: 0,
        questionStartedAt: Date.now(),
      },
    });
    // Reset player answers and scores
    for (const pid of playerIds) {
      await update(ref(db, `rooms/${roomCode}/players/${pid}`), {
        score: 0,
        speedBonus: 0,
        answers: {},
        ready: false,
      });
    }
  }, [roomCode, isHost, playerIds]);

  // Submit answer
  const submitAnswer = useCallback(
    async (questionIndex: number, selected: number, correct: boolean, timeRemaining: number) => {
      if (!roomCode) return;
      const bonus = correct ? Math.min(5, Math.floor(timeRemaining / 3)) : 0;
      const points = correct ? 10 + bonus : 0;

      const answerData = {
        selected,
        correct,
        answeredAt: Date.now(),
      };

      // Get current player data to compute new totals
      const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
      const snap = await get(playerRef);
      const current = snap.val() as RoomPlayer;

      await update(playerRef, {
        [`answers/${questionIndex}`]: answerData,
        score: (current?.score || 0) + points,
        speedBonus: (current?.speedBonus || 0) + bonus,
      });
    },
    [roomCode, playerId]
  );

  // Advance to next question (host only)
  const advanceQuestion = useCallback(
    async (nextIndex: number) => {
      if (!roomCode || !isHost) return;
      const totalQuestions = roomData?.settings?.questionCount || 10;
      if (nextIndex >= totalQuestions) {
        await update(ref(db, `rooms/${roomCode}`), { status: "finished" });
      } else {
        await update(ref(db, `rooms/${roomCode}/game`), {
          questionIndex: nextIndex,
          questionStartedAt: Date.now(),
        });
      }
    },
    [roomCode, isHost, roomData?.settings?.questionCount]
  );

  // Send chat message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomCode || !text.trim()) return;
      const chatRef = ref(db, `rooms/${roomCode}/chat`);
      const newMsg = push(chatRef);
      const msg: ChatMessage = {
        id: newMsg.key || "",
        senderId: playerId,
        senderName: myPlayer?.name || "Unknown",
        text: text.trim(),
        createdAt: Date.now(),
      };
      await set(newMsg, msg);
    },
    [roomCode, playerId, myPlayer?.name]
  );

  // Play again (host only)
  const playAgain = useCallback(async () => {
    if (!roomCode || !isHost) return;
    const seed = Math.floor(Math.random() * 2147483647);
    await update(ref(db, `rooms/${roomCode}`), {
      status: "playing",
      seed,
      game: {
        questionIndex: 0,
        questionStartedAt: Date.now(),
      },
    });
    for (const pid of playerIds) {
      await update(ref(db, `rooms/${roomCode}/players/${pid}`), {
        score: 0,
        speedBonus: 0,
        answers: {},
        ready: false,
      });
    }
  }, [roomCode, isHost, playerIds]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomCode) return;
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (isHost) {
      await remove(ref(db, `rooms/${roomCode}`));
    } else {
      await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
    }
    setRoomCode(null);
    setRoomData(null);
  }, [roomCode, isHost, playerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return {
    roomCode,
    roomData,
    playerId,
    isHost,
    myPlayer,
    opponentPlayer,
    opponentId,
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
  };
}
