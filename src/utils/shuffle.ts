export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Mulberry32 PRNG - returns a function that produces deterministic floats in [0, 1) */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffle options for a question while preserving the correct answer mapping.
 * Returns { shuffledOptions, shuffledAnswerIndex }.
 */
export function shuffleOptions(
  options: string[],
  answerIndex: number,
  seed: number
): { shuffledOptions: string[]; shuffledAnswerIndex: number } {
  // Create indexed pairs
  const indexed = options.map((opt, i) => ({ opt, originalIndex: i }));
  const shuffled = seededShuffle(indexed, seed);
  const shuffledOptions = shuffled.map((s) => s.opt);
  const shuffledAnswerIndex = shuffled.findIndex(
    (s) => s.originalIndex === answerIndex
  );
  return { shuffledOptions, shuffledAnswerIndex };
}
