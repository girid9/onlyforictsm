import { Question, Subject, Topic, ParsedData } from "@/types/question";
import { slugify, humanizeFilename } from "./slug";

const ANSWER_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

interface RawQuestion {
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer?: string;
  notes?: string;
}

export function parseJsonFile(
  filename: string,
  data: Record<string, RawQuestion[]>
) {
  const subjectName = humanizeFilename(filename);
  const subjectId = slugify(subjectName);

  const topics: {
    topicId: string;
    topicName: string;
    questions: Question[];
  }[] = [];

  for (const [topicName, rawQuestions] of Object.entries(data)) {
    const topicId = slugify(topicName);
    const questions: Question[] = [];

    if (!Array.isArray(rawQuestions)) continue;

    rawQuestions.forEach((q, index) => {
      if (!q.question?.trim()) return;

      const options = [
        q.option_a || "",
        q.option_b || "",
        q.option_c || "",
        q.option_d || "",
      ];

      if (options.every((o) => !o.trim())) return;

      const answerIndex = ANSWER_MAP[q.answer?.toUpperCase() ?? ""];
      if (answerIndex === undefined) return;

      if (!options[answerIndex]?.trim()) return;

      questions.push({
        id: `${subjectId}-${topicId}-${index}-${slugify(q.question.slice(0, 40))}`,
        subjectId,
        subjectName,
        topicId,
        topicName,
        question: q.question,
        options,
        answerIndex,
        notes: q.notes?.trim() || undefined,
      });
    });

    if (questions.length > 0) {
      topics.push({ topicId, topicName, questions });
    }
  }

  return { subjectId, subjectName, topics };
}

export function buildParsedData(
  files: { filename: string; data: Record<string, RawQuestion[]> }[]
): ParsedData {
  const subjects: Subject[] = [];
  const topicsBySubject: Record<string, Topic[]> = {};
  const questionsBySubjectTopic: Record<string, Record<string, Question[]>> =
    {};

  for (const file of files) {
    const parsed = parseJsonFile(file.filename, file.data);
    let totalQuestions = 0;

    topicsBySubject[parsed.subjectId] = [];
    questionsBySubjectTopic[parsed.subjectId] = {};

    for (const topic of parsed.topics) {
      topicsBySubject[parsed.subjectId].push({
        id: topic.topicId,
        name: topic.topicName,
        questionCount: topic.questions.length,
      });
      questionsBySubjectTopic[parsed.subjectId][topic.topicId] =
        topic.questions;
      totalQuestions += topic.questions.length;
    }

    subjects.push({
      id: parsed.subjectId,
      name: parsed.subjectName,
      topicCount: parsed.topics.length,
      questionCount: totalQuestions,
    });
  }

  return { subjects, topicsBySubject, questionsBySubjectTopic };
}
