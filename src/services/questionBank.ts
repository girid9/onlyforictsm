import { ParsedData, Question } from "@/types/question";
import { buildParsedData } from "@/utils/parse";

const FILES = [
  "ictsm_theory_2nd_year.json",
  "wcs_2nd_year.json",
  "engineering_drawing_2nd_year.json",
  "employability_skills_2nd_year.json",
];

let cachedData: ParsedData | null = null;

export async function loadAll(): Promise<ParsedData> {
  if (cachedData) return cachedData;

  const results = await Promise.all(
    FILES.map(async (filename) => {
      const res = await fetch(`./data/${filename}`);
      if (!res.ok) {
        const fallbackRes = await fetch(`/data/${filename}`);
        if (!fallbackRes.ok) throw new Error(`Failed to load ${filename}`);
        const data = await fallbackRes.json();
        return { filename, data };
      }
      const data = await res.json();
      return { filename, data };
    })
  );

  cachedData = buildParsedData(results);
  return cachedData;
}

export function getCachedData(): ParsedData | null {
  return cachedData;
}

export function search(query: string): Question[] {
  if (!cachedData || !query.trim()) return [];
  const q = query.toLowerCase();
  const results: Question[] = [];

  for (const topics of Object.values(cachedData.questionsBySubjectTopic)) {
    for (const questions of Object.values(topics)) {
      for (const question of questions) {
        if (
          question.question.toLowerCase().includes(q) ||
          question.options.some((o) => o.toLowerCase().includes(q)) ||
          question.topicName.toLowerCase().includes(q) ||
          question.subjectName.toLowerCase().includes(q) ||
          (question.notes && question.notes.toLowerCase().includes(q))
        ) {
          results.push(question);
        }
      }
    }
  }

  return results.slice(0, 50);
}
