import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudyRoomSettings {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  questionCount: number;
}

export interface StudyMember {
  name: string;
  connected: boolean;
  score: number;
  answers: Record<number, { selected: number; correct: boolean }>;
}

export interface StudyChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface StudyRoomData {
  code: string;
  hostId: string;
  status: "lobby" | "studying" | "finished";
  members: Record<string, StudyMember>;
  settings?: StudyRoomSettings;
  chat: StudyChatMessage[];
  currentQuestion: number;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generatePlayerId(): string {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useStudyRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<StudyRoomData | null>(null);
  const [playerId] = useState<string>(() => {
    const stored = sessionStorage.getItem("study-player-id");
    if (stored) return stored;
    const id = generatePlayerId();
    sessionStorage.setItem("study-player-id", id);
    return id;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const isHost = roomData?.hostId === playerId;

  const fetchRoomState = useCallback(async (code: string) => {
    const { data: room } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (!room) {
      setRoomData(null);
      setRoomCode(null);
      return;
    }

    const { data: dbMembers } = await supabase
      .from("study_room_members")
      .select("*")
      .eq("room_id", room.id);

    const { data: dbMessages } = await supabase
      .from("study_room_messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    const membersMap: Record<string, StudyMember> = {};
    (dbMembers || []).forEach((m) => {
      membersMap[m.player_id] = {
        name: m.name,
        connected: m.connected,
        score: m.score,
        answers: (m.answers as Record<string, any>) || {},
      };
    });

    const chat: StudyChatMessage[] = (dbMessages || []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      text: m.text,
      createdAt: new Date(m.created_at).getTime(),
    }));

    roomIdRef.current = room.id;
    const settings = room.settings as unknown as StudyRoomSettings | undefined;

    setRoomData({
      code: room.code,
      hostId: room.host_id,
      status: room.status as StudyRoomData["status"],
      members: membersMap,
      settings,
      chat,
      currentQuestion: (settings as any)?.currentQuestion ?? 0,
    });
  }, []);

  const subscribeToRoom = useCallback(
    (code: string, dbRoomId: string) => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const channel = supabase
        .channel(`study-${code}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms", filter: `id=eq.${dbRoomId}` }, () => fetchRoomState(code))
        .on("postgres_changes", { event: "*", schema: "public", table: "study_room_members", filter: `room_id=eq.${dbRoomId}` }, () => fetchRoomState(code))
        .on("postgres_changes", { event: "*", schema: "public", table: "study_room_messages", filter: `room_id=eq.${dbRoomId}` }, () => fetchRoomState(code))
        .subscribe();

      channelRef.current = channel;
    },
    [fetchRoomState]
  );

  const createRoom = useCallback(
    async (nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const code = generateCode();
        const { data: existing } = await supabase.from("study_rooms").select("id").eq("code", code).single();
        if (existing) return createRoom(nickname);

        const { data: room, error: err } = await supabase
          .from("study_rooms")
          .insert({ code, host_id: playerId, status: "lobby" })
          .select()
          .single();

        if (err || !room) throw new Error(err?.message || "Failed to create room");

        await supabase.from("study_room_members").insert({
          room_id: room.id,
          player_id: playerId,
          name: nickname,
          connected: true,
          score: 0,
          answers: {},
        });

        roomIdRef.current = room.id;
        setRoomCode(code);
        await fetchRoomState(code);
        subscribeToRoom(code, room.id);
      } catch (e: any) {
        setError(e.message || "Failed to create room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, fetchRoomState, subscribeToRoom]
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      setLoading(true);
      setError(null);
      try {
        const upperCode = code.toUpperCase().trim();
        const { data: room } = await supabase.from("study_rooms").select("*").eq("code", upperCode).single();
        if (!room) { setError("Room not found"); setLoading(false); return; }

        const { data: existing } = await supabase.from("study_room_members").select("*").eq("room_id", room.id);
        const alreadyIn = existing?.find((m) => m.player_id === playerId);

        if (alreadyIn) {
          await supabase.from("study_room_members").update({ connected: true, name: nickname }).eq("room_id", room.id).eq("player_id", playerId);
        } else {
          await supabase.from("study_room_members").insert({
            room_id: room.id,
            player_id: playerId,
            name: nickname,
            connected: true,
            score: 0,
            answers: {},
          });
        }

        roomIdRef.current = room.id;
        setRoomCode(upperCode);
        await fetchRoomState(upperCode);
        subscribeToRoom(upperCode, room.id);
      } catch (e: any) {
        setError(e.message || "Failed to join room");
      } finally {
        setLoading(false);
      }
    },
    [playerId, fetchRoomState, subscribeToRoom]
  );

  const updateSettings = useCallback(
    async (settings: StudyRoomSettings) => {
      if (!roomIdRef.current || !isHost) return;
      await supabase.from("study_rooms").update({ settings: settings as any }).eq("id", roomIdRef.current);
    },
    [isHost]
  );

  const startStudying = useCallback(async () => {
    if (!roomIdRef.current || !isHost) return;
    await supabase.from("study_rooms").update({
      status: "studying",
      settings: { ...(roomData?.settings as any), currentQuestion: 0 } as any,
    }).eq("id", roomIdRef.current);

    await supabase.from("study_room_members").update({ score: 0, answers: {} as any }).eq("room_id", roomIdRef.current);
  }, [isHost, roomData?.settings]);

  const submitAnswer = useCallback(
    async (questionIndex: number, selected: number, correct: boolean) => {
      if (!roomIdRef.current) return;
      const { data: member } = await supabase
        .from("study_room_members")
        .select("score, answers")
        .eq("room_id", roomIdRef.current)
        .eq("player_id", playerId)
        .single();

      if (!member) return;
      const currentAnswers = (member.answers as Record<string, any>) || {};
      const newAnswers = { ...currentAnswers, [questionIndex]: { selected, correct } };
      const points = correct ? 10 : 0;

      await supabase.from("study_room_members").update({
        answers: newAnswers as any,
        score: (member.score || 0) + points,
      }).eq("room_id", roomIdRef.current).eq("player_id", playerId);
    },
    [playerId]
  );

  const advanceQuestion = useCallback(
    async (nextIndex: number) => {
      if (!roomIdRef.current || !isHost) return;
      const qCount = roomData?.settings?.questionCount || 10;
      if (nextIndex >= qCount) {
        await supabase.from("study_rooms").update({ status: "finished" }).eq("id", roomIdRef.current);
      } else {
        await supabase.from("study_rooms").update({
          settings: { ...(roomData?.settings as any), currentQuestion: nextIndex } as any,
        }).eq("id", roomIdRef.current);
      }
    },
    [isHost, roomData?.settings]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomIdRef.current || !text.trim()) return;
      const me = roomData?.members[playerId];
      await supabase.from("study_room_messages").insert({
        room_id: roomIdRef.current,
        sender_id: playerId,
        sender_name: me?.name || "Unknown",
        text: text.trim(),
      });
    },
    [playerId, roomData?.members]
  );

  const leaveRoom = useCallback(async () => {
    if (!roomIdRef.current) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (isHost) {
      await supabase.from("study_rooms").delete().eq("id", roomIdRef.current);
    } else {
      await supabase.from("study_room_members").delete().eq("room_id", roomIdRef.current).eq("player_id", playerId);
    }
    roomIdRef.current = null;
    setRoomCode(null);
    setRoomData(null);
  }, [isHost, playerId]);

  const restartSession = useCallback(async () => {
    if (!roomIdRef.current || !isHost) return;
    await supabase.from("study_rooms").update({
      status: "studying",
      settings: { ...(roomData?.settings as any), currentQuestion: 0 } as any,
    }).eq("id", roomIdRef.current);
    await supabase.from("study_room_members").update({ score: 0, answers: {} as any }).eq("room_id", roomIdRef.current);
  }, [isHost, roomData?.settings]);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return {
    roomCode, roomData, playerId, isHost, error, loading,
    createRoom, joinRoom, updateSettings, startStudying,
    submitAnswer, advanceQuestion, sendMessage, leaveRoom,
    restartSession, setError,
  };
}
