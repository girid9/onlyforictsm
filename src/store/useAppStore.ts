import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Subject, Topic, Question, ParsedData, SessionResult } from "@/types/question";

interface AnswerRecord {
  selectedIndex: number;
  correct: boolean;
}

// Separate non-persisted store for question data
interface DataState {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>;
  loaded: boolean;
  sessionResult: SessionResult | null;
  setData: (data: ParsedData) => void;
  setSessionResult: (result: SessionResult | null) => void;
}

export const useDataStore = create<DataState>((set) => ({
  subjects: [],
  topicsBySubject: {},
  questionsBySubjectTopic: {},
  loaded: false,
  sessionResult: null,
  setData: (data: ParsedData) =>
    set({
      subjects: data.subjects,
      topicsBySubject: data.topicsBySubject,
      questionsBySubjectTopic: data.questionsBySubjectTopic,
      loaded: true,
    }),
  setSessionResult: (result) => set({ sessionResult: result }),
}));

// Persisted store for user progress
interface ProgressState {
  answers: Record<string, AnswerRecord>;
  bookmarkedIds: string[];
  lastVisited: {
    subjectId: string;
    topicId: string;
    subjectName: string;
    topicName: string;
  } | null;
  streak: number;
  xp: number;
  lastAnswerDate: string | null;
  settings: {
    autoAdvance: boolean;
    autoAdvanceDelay: number;
  };
  recordAnswer: (questionId: string, selectedIndex: number, correct: boolean) => void;
  toggleBookmark: (questionId: string) => void;
  setLastVisited: (info: ProgressState["lastVisited"]) => void;
  updateSettings: (settings: Partial<ProgressState["settings"]>) => void;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      answers: {},
      bookmarkedIds: [],
      lastVisited: null,
      streak: 0,
      xp: 0,
      lastAnswerDate: null,
      settings: {
        autoAdvance: false,
        autoAdvanceDelay: 2,
      },
      recordAnswer: (questionId, selectedIndex, correct) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const lastDate = state.lastAnswerDate;
          let newStreak = state.streak;
          let newXP = state.xp;

          if (correct) {
            newXP += 10;
            if (lastDate === today) {
              // Already answered today
            } else if (lastDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          }

          return {
            answers: { ...state.answers, [questionId]: { selectedIndex, correct } },
            xp: newXP,
            streak: newStreak,
            lastAnswerDate: today,
          };
        }),
      toggleBookmark: (questionId) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(questionId)
            ? state.bookmarkedIds.filter((id) => id !== questionId)
            : [...state.bookmarkedIds, questionId],
        })),
      setLastVisited: (info) => set({ lastVisited: info }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      clearProgress: () => set({ answers: {}, bookmarkedIds: [], lastVisited: null }),
    }),
    { name: "mcq-app-progress" }
  )
);
