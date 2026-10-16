import { assistantKnowledge } from "./assistant.knowledge.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "do",
  "does",
  "did",
  "how",
  "what",
  "where",
  "when",
  "why",
  "can",
  "could",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "and",
  "or",
  "it",
  "this",
  "that",
  "with",
  "please",
  "help",
  "tell",
]);

const FALLBACK_ANSWER =
  "I couldn't find a sufficiently relevant answer in the FIXL help guide. Try using the exact name of the page or feature, or contact your system administrator. I won't guess at undocumented workflows.";


function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => {
      // Normalize common plurals: "stocks" -> "stock".
      if (word.length > 4 && word.endsWith("s")) {
        return word.slice(0, -1);
      }
      return word;
    })
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}


function similarity(questionTokens, candidate) {
  const candidateTokens = new Set(tokenize(candidate));

  if (!questionTokens.length || !candidateTokens.size) return 0;

  const overlap = questionTokens.filter((token) =>
    candidateTokens.has(token),
  ).length;

  const coverage = overlap / questionTokens.length;
  const precision = overlap / candidateTokens.size;

  // Give a little more importance to covering the user's question.
  return 0.7 * coverage + 0.3 * precision;
}

export function findAssistantAnswer(question, userRole) {
  const normalizedQuestion = String(question || "").trim();

  if (!normalizedQuestion) {
    return {
      answer: "Please enter a question about using FIXL.",
      matched: false,
      category: null,
    };
  }

  const questionTokens = tokenize(normalizedQuestion);

  const candidates = assistantKnowledge.filter(
    (entry) => Array.isArray(entry.roles) && entry.roles.includes(userRole),
  );

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of candidates) {
    const phrases = [
      entry.id,
      entry.category,
      ...(entry.questions || []),
      ...(entry.keywords || []),
    ];

    for (const phrase of phrases) {
      const score = similarity(questionTokens, phrase);

      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }
  }

  // Conservative threshold: uncertain matches should not be presented as facts.
  if (!bestEntry || bestScore < 0.45) {
    return {
      answer: FALLBACK_ANSWER,
      matched: false,
      category: null,
    };
  }

  return {
    answer: bestEntry.answer,
    matched: true,
    category: bestEntry.category,
  };
}
