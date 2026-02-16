import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RoomData, RoomSettings, ChatMessage, RoomPlayer, RoomGame } from "@/types/multiplayer";

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
  const [playerId] = useState<string>(() => {
    const stored = sessionStorage.getItem("battle-player-id");
    if (stored) return stored;
    const id = generatePlayerId();
    sessionStorage.setItem("battle-player-id", id);
    return id;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const isHost = roomData?.hostId === playerId;
  const players = roomData?.players || {};
  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((id) => id !== playerId) || null;
  const myPlayer = players[playerId] || null;
  const opponentPlayer = opponentId ? players[opponentId] : null;

  // Fetch full room state from DB
  const fetchRoomState = useCallback(async (code: string) => {
    const { data: room } = await supabase
      .from("battle_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (!room) {
      setRoomData(null);
      setRoomCode(null);
      return;
    }

    const { data: dbPlayers } = await supabase
      .from("battle_players")
      .select("*")
      .eq("room_id", room.id);

    const { data: dbMessages } = await supabase
      .from("battle_messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    const playersMap: Record<string, RoomPlayer> = {};
    (dbPlayers || []).forEach((p) => {
      playersMap[p.player_id] = {
        name: p.name,
        ready: p.ready,
        connected: p.connected,
        score: p.score,
        speedBonus: p.speed_bonus,
        answers: (p.answers as Record<string, any>) || {},
      };
    });

    const chatMap: Record<string, ChatMessage> = {};
    (dbMessages || []).forEach((m) => {
      chatMap[m.id] = {
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        text: m.text,
        createdAt: new Date(m.created_at).getTime(),
      };
    });

    roomIdRef.current = room.id;

    setRoomData({
      code: room.code,
      hostId: room.host_id,
      createdAt: new Date(room.created_at).getTime(),
      status: room.status as RoomData["status"],
      players: playersMap,
      settings: room.settings as unknown as RoomSettings | undefined,
      seed: room.seed ?? undefined,
      game: room.game as unknown as RoomGame | undefined,
      chat: Object.keys(chatMap).length > 0 ? chatMap : undefined,
    });
  }, []);

  // Subscribe to realtime changes
  const subscribeToRoom = useCallback(
    (code: string, dbRoomId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`room-${code}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "battle_rooms", filter: `id=eq.${dbRoomId}` }, () => {
          fetchRoomState(code);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "battle_players", filter: `room_id=eq.${dbRoomId}` }, () => {
          fetchRoomState(code);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "battle_messages", filter: `room_id=eq.${dbRoomId}` }, () => {
          fetchRoomState(code);
        })
        .subscribe();

      channelRef.current = channel;
    },
    [fetchRoomState]
  );

  // Create room
  const createRoom = useCallback(
    async (nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const code = generateRoomCode();

        // Check collision
        const { data: existing } = await supabase
          .from("battle_rooms")
          .select("id")
          .eq("code", code)
          .single();

        if (existing) return createRoom(nickname);

        const { data: room, error: roomErr } = await supabase
          .from("battle_rooms")
          .insert({ code, host_id: playerId, status: "lobby" })
          .select()
          .single();

        if (roomErr || !room) throw new Error(roomErr?.message || "Failed to create room");

        await supabase.from("battle_players").insert({
          room_id: room.id,
          player_id: playerId,
          name: nickname,
          ready: false,
          connected: true,
          score: 0,
          speed_bonus: 0,
          answers: {},
        });

        roomIdRef.current = room.id;
        setRoomCode(code);
        await fetchRoomState(code);
        subscribeToRoom(code, room.id);
      } catch (err: any) {
        setError(err.message || "Failed to create room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, fetchRoomState, subscribeToRoom]
  );

  // Join room
  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const upperCode = code.toUpperCase().trim();
        const { data: room } = await supabase
          .from("battle_rooms")
          .select("*")
          .eq("code", upperCode)
          .single();

        if (!room) {
          setError("Room not found");
          setLoading(false);
          return;
        }

        const { data: existingPlayers } = await supabase
          .from("battle_players")
          .select("*")
          .eq("room_id", room.id);

        const playerCount = existingPlayers?.length || 0;
        const alreadyIn = existingPlayers?.find((p) => p.player_id === playerId);

        if (playerCount >= 2 && !alreadyIn) {
          setError("Room is full");
          setLoading(false);
          return;
        }

        if (alreadyIn) {
          await supabase
            .from("battle_players")
            .update({ connected: true })
            .eq("room_id", room.id)
            .eq("player_id", playerId);
        } else {
          await supabase.from("battle_players").insert({
            room_id: room.id,
            player_id: playerId,
            name: nickname,
            ready: false,
            connected: true,
            score: 0,
            speed_bonus: 0,
            answers: {},
          });
        }

        roomIdRef.current = room.id;
        setRoomCode(upperCode);
        await fetchRoomState(upperCode);
        subscribeToRoom(upperCode, room.id);
      } catch (err: any) {
        setError(err.message || "Failed to join room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, fetchRoomState, subscribeToRoom]
  );

  // Update settings (host only)
  const updateSettings = useCallback(
    async (settings: RoomSettings) => {
      if (!roomIdRef.current || !isHost) return;
      await supabase
        .from("battle_rooms")
        .update({ settings: settings as any })
        .eq("id", roomIdRef.current);
    },
    [isHost]
  );

  // Set ready
  const setReady = useCallback(
    async (ready: boolean) => {
      if (!roomIdRef.current) return;
      await supabase
        .from("battle_players")
        .update({ ready })
        .eq("room_id", roomIdRef.current)
        .eq("player_id", playerId);
    },
    [playerId]
  );

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!roomIdRef.current || !isHost) return;
    const seed = Math.floor(Math.random() * 2147483647);
    await supabase
      .from("battle_rooms")
      .update({
        status: "playing",
        seed,
        game: { questionIndex: 0, questionStartedAt: Date.now() } as any,
      })
      .eq("id", roomIdRef.current);

    // Reset player state
    await supabase
      .from("battle_players")
      .update({ score: 0, speed_bonus: 0, answers: {} as any, ready: false })
      .eq("room_id", roomIdRef.current);
  }, [isHost]);

  // Submit answer
  const submitAnswer = useCallback(
    async (questionIndex: number, selected: number, correct: boolean, timeRemaining: number) => {
      if (!roomIdRef.current) return;
      const bonus = correct ? Math.min(5, Math.floor(timeRemaining / 3)) : 0;
      const points = correct ? 10 + bonus : 0;

      const { data: player } = await supabase
        .from("battle_players")
        .select("score, speed_bonus, answers")
        .eq("room_id", roomIdRef.current)
        .eq("player_id", playerId)
        .single();

      if (!player) return;

      const currentAnswers = (player.answers as Record<string, any>) || {};
      const newAnswers = {
        ...currentAnswers,
        [questionIndex]: { selected, correct, answeredAt: Date.now() },
      };

      await supabase
        .from("battle_players")
        .update({
          answers: newAnswers as any,
          score: (player.score || 0) + points,
          speed_bonus: (player.speed_bonus || 0) + bonus,
        })
        .eq("room_id", roomIdRef.current)
        .eq("player_id", playerId);
    },
    [playerId]
  );

  // Advance to next question (host only)
  const advanceQuestion = useCallback(
    async (nextIndex: number) => {
      if (!roomIdRef.current || !isHost) return;
      const totalQuestions = (roomData?.settings as RoomSettings | undefined)?.questionCount || 10;
      if (nextIndex >= totalQuestions) {
        await supabase
          .from("battle_rooms")
          .update({ status: "finished" })
          .eq("id", roomIdRef.current);
      } else {
        await supabase
          .from("battle_rooms")
          .update({
            game: { questionIndex: nextIndex, questionStartedAt: Date.now() } as any,
          })
          .eq("id", roomIdRef.current);
      }
    },
    [isHost, roomData?.settings]
  );

  // Send chat message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomIdRef.current || !text.trim()) return;
      await supabase.from("battle_messages").insert({
        room_id: roomIdRef.current,
        sender_id: playerId,
        sender_name: myPlayer?.name || "Unknown",
        text: text.trim(),
      });
    },
    [playerId, myPlayer?.name]
  );

  // Play again (host only)
  const playAgain = useCallback(async () => {
    if (!roomIdRef.current || !isHost) return;
    const seed = Math.floor(Math.random() * 2147483647);
    await supabase
      .from("battle_rooms")
      .update({
        status: "playing",
        seed,
        game: { questionIndex: 0, questionStartedAt: Date.now() } as any,
      })
      .eq("id", roomIdRef.current);

    await supabase
      .from("battle_players")
      .update({ score: 0, speed_bonus: 0, answers: {} as any, ready: false })
      .eq("room_id", roomIdRef.current);
  }, [isHost]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomIdRef.current) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (isHost) {
      await supabase.from("battle_rooms").delete().eq("id", roomIdRef.current);
    } else {
      await supabase
        .from("battle_players")
        .delete()
        .eq("room_id", roomIdRef.current)
        .eq("player_id", playerId);
    }
    roomIdRef.current = null;
    setRoomCode(null);
    setRoomData(null);
  }, [isHost, playerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
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
