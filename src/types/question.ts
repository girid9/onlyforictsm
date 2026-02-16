export interface Question {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[];
  answerIndex: number;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  topicCount: number;
  questionCount: number;
}

export interface Topic {
  id: string;
  name: string;
  questionCount: number;
}

export interface ParsedData {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>;
}

export interface SessionResult {
  subjectName: string;
  topicName: string;
  subjectId: string;
  topicId: string;
  total: number;
  correct: number;
  timeTaken: number;
  questionResults: {
    question: Question;
    selectedIndex: number;
    correct: boolean;
  }[];
}
