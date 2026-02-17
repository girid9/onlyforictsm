import { AnswerRecord } from "@/store/useAppStore";
import { Question } from "@/types/question";

export interface TopicStats {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  total: number;
  attempted: number;
  correct: number;
  completion: number;
  accuracy: number;
}

export interface ActivityEntry {
  questionId: string;
  subjectName: string;
  topicName: string;
  correct: boolean;
  answeredAt: string;
}

export interface TrendPoint {
  label: string;
  accuracy: number;
}

export function getTopicStats(
  answers: Record<string, AnswerRecord>,
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>
): TopicStats[] {
  const stats: TopicStats[] = [];

  for (const [subjectId, topics] of Object.entries(questionsBySubjectTopic)) {
    for (const [topicId, questions] of Object.entries(topics)) {
      const total = questions.length;
      let attempted = 0;
      let correct = 0;

      for (const q of questions) {
        const a = answers[q.id];
        if (a) {
          attempted++;
          if (a.correct) correct++;
        }
      }

      if (attempted === 0) continue;

      const accuracy = Math.round((correct / attempted) * 100);
      const difficulty: TopicStats["difficulty"] =
        accuracy >= 70 ? "Easy" : accuracy >= 40 ? "Medium" : "Hard";

      stats.push({
        subjectId,
        topicId,
        subjectName: questions[0]?.subjectName ?? subjectId,
        topicName: questions[0]?.topicName ?? topicId,
        total,
        attempted,
        correct,
        accuracy,
        difficulty,
      });
    }
  }

  return stats;
}

export function getWeakTopics(
  answers: Record<string, AnswerRecord>,
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>,
  count = 4
): TopicStats[] {
  return getTopicStats(answers, questionsBySubjectTopic)
    .filter((t) => t.attempted >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count);
}

export function getSubjectProgress(
  answers: Record<string, AnswerRecord>,
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>,
  subjects: { id: string; name: string }[]
): SubjectProgress[] {
  return subjects.map((sub) => {
    const topics = questionsBySubjectTopic[sub.id] ?? {};
    let total = 0;
    let attempted = 0;
    let correct = 0;

    for (const questions of Object.values(topics)) {
      total += questions.length;
      for (const q of questions) {
        const a = answers[q.id];
        if (a) {
          attempted++;
          if (a.correct) correct++;
        }
      }
    }

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      total,
      attempted,
      correct,
      completion: total > 0 ? Math.round((attempted / total) * 100) : 0,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };
  });
}

export function getRecentActivity(
  answers: Record<string, AnswerRecord>,
  questionsBySubjectTopic: Record<string, Record<string, Question[]>>,
  count = 5
): ActivityEntry[] {
  // Build a lookup: questionId -> { subjectName, topicName }
  const lookup: Record<string, { subjectName: string; topicName: string }> = {};
  for (const topics of Object.values(questionsBySubjectTopic)) {
    for (const questions of Object.values(topics)) {
      for (const q of questions) {
        lookup[q.id] = { subjectName: q.subjectName, topicName: q.topicName };
      }
    }
  }

  return Object.entries(answers)
    .filter(([, a]) => a.answeredAt)
    .sort((a, b) => new Date(b[1].answeredAt!).getTime() - new Date(a[1].answeredAt!).getTime())
    .slice(0, count)
    .map(([id, a]) => ({
      questionId: id,
      subjectName: lookup[id]?.subjectName ?? "",
      topicName: lookup[id]?.topicName ?? "",
      correct: a.correct,
      answeredAt: a.answeredAt!,
    }));
}

export function getAccuracyTrend(
  answers: Record<string, AnswerRecord>,
  buckets = 10
): TrendPoint[] {
  const sorted = Object.values(answers)
    .filter((a) => a.answeredAt)
    .sort((a, b) => new Date(a.answeredAt!).getTime() - new Date(b.answeredAt!).getTime());

  if (sorted.length < 2) return [];

  const bucketSize = Math.max(1, Math.floor(sorted.length / buckets));
  const points: TrendPoint[] = [];

  for (let i = 0; i < sorted.length; i += bucketSize) {
    const slice = sorted.slice(i, i + bucketSize);
    const correct = slice.filter((a) => a.correct).length;
    const accuracy = Math.round((correct / slice.length) * 100);
    points.push({ label: `${i + 1}`, accuracy });
  }

  return points.slice(-buckets);
}
