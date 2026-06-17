function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/\W+/)
    .filter((word) => word.length > 2);
}

function similarity(text1, text2) {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection += 1;
    }
  }

  return intersection / Math.max(tokens1.size, tokens2.size);
}

export function findFaqMatches(text, faqEntries, { limit = 3, threshold = 0.2 } = {}) {
  if (!text?.trim() || !faqEntries?.length) {
    return [];
  }

  return faqEntries
    .map((entry) => {
      const questionScore = similarity(text, entry.question);
      const answerScore = similarity(text, entry.reponse) * 0.5;
      const score = Math.max(questionScore, answerScore);

      return { ...entry, score };
    })
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
