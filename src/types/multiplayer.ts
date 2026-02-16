export type RoomStatus = "lobby" | "playing" | "finished";

export interface RoomPlayer {
  name: string;
  ready: boolean;
  connected: boolean;
  score: number;
  speedBonus: number;
  answers: Record<number, { selected: number; correct: boolean; answeredAt: number }>;
}

export interface RoomSettings {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  questionCount: number;
  secondsPerQuestion: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface RoomGame {
  questionIndex: number;
  questionStartedAt: number;
}

export interface RoomData {
  code: string;
  hostId: string;
  createdAt: number;
  status: RoomStatus;
  players: Record<string, RoomPlayer>;
  settings?: RoomSettings;
  seed?: number;
  game?: RoomGame;
  chat?: Record<string, ChatMessage>;
}

export interface BattleResult {
  myScore: number;
  opponentScore: number;
  mySpeedBonus: number;
  opponentSpeedBonus: number;
  myCorrect: number;
  opponentCorrect: number;
  total: number;
  myName: string;
  opponentName: string;
  winner: "me" | "opponent" | "tie";
}
