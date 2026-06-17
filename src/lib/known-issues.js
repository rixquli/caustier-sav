import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knownIssuesPath = path.join(__dirname, "known-issues.json");

function loadKnownIssues() {
  try {
    return JSON.parse(fs.readFileSync(knownIssuesPath, "utf8"));
  } catch (error) {
    return [];
  }
}

function saveKnownIssues(issues) {
  fs.writeFileSync(
    knownIssuesPath,
    JSON.stringify(issues, null, 2) + "\n",
    "utf8",
  );
}

function inferKeywordsFromQuestion(question) {
  const keywords = new Set();
  const normalized = question.toLowerCase();

  const codeMatches = question.match(/\bE\d{2}\b/gi);
  if (codeMatches) {
    codeMatches.forEach((code) => {
      const normalizedCode = code.toUpperCase();
      keywords.add(normalizedCode);
      keywords.add(`erreur ${normalizedCode}`);
    });
  }

  if (/voyant rouge/.test(normalized)) {
    keywords.add("voyant rouge");
  }
  if (/clignot/.test(normalized)) {
    keywords.add("clignote");
  }
  if (/machine/.test(normalized)) {
    keywords.add("machine");
  }
  if (/s'arrêt/.test(normalized) || /arrête/.test(normalized)) {
    keywords.add("s'arrête");
  }
  if (/pression basse/.test(normalized)) {
    keywords.add("pression basse");
  }
  if (/fuite/.test(normalized)) {
    keywords.add("fuite");
  }

  return Array.from(keywords);
}

export function getKnownIssues() {
  return loadKnownIssues();
}

export function buildModelPrompt(problemText) {
  const knownIssues = getKnownIssues();
  const lines = [
    "Voici une liste de problèmes connus avec leur numéro :",
    ...knownIssues.map((issue) => `${issue.id}: ${issue.question}`),
    "",
    "Pour chaque nouvelle question, renvoie uniquement le numéro du problème correspondant.",
    "Si aucune réponse connue ne correspond, renvoie seulement 0.",
    "Si tu as le moindre doute, renvoie 0.",
    "Ne devine pas et ne propose aucune explication.",
    "Répond uniquement avec un entier.",
    "Ne renvoie rien d'autre que le nombre.",
    "",
    `Question: ${problemText}`,
  ];

  return lines.join("\n");
}

export function findKnownIssueByText(problemText) {
  const normalized = problemText.toLowerCase();
  const knownIssues = getKnownIssues();
  const issue = knownIssues.find((issue) =>
    issue.keywords?.some((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    ),
  );
  return issue?.id ?? 0;
}

export function parseModelResponse(responseText) {
  const match = responseText.trim().match(/^(\d+)$/);
  if (match) {
    return Number(match[1]);
  }

  const fallback = responseText.match(/(\d+)/);
  if (fallback) {
    return Number(fallback[1]);
  }

  return 0;
}

export function buildFaqSuggestionPrompt(conversationHistory) {
  const lines = [
    "Vous êtes un assistant SAV. Vous devez analyser une conversation entre un client et un technicien.",
    "Si le problème n'est pas couvert par la FAQ existante, propose une nouvelle entrée FAQ.",
    "Réponds uniquement au format JSON avec trois champs : question, answer et keywords.",
    "Question : une formulation claire de la demande du client.",
    "Answer : une solution concise et utile du technicien.",
    "Keywords : liste de mots-clés courts permettant de retrouver cette FAQ (voyants, code erreur, type de problème).",
    "Ne fournis pas d'autres informations que l'objet JSON demandé.",
    "",
    "Conversation :",
    ...conversationHistory.map((msg) => `${msg.role}: ${msg.content}`),
    "",
    "Sortie JSON :",
  ];
  return lines.join("\n");
}

export function getAnswerById(id) {
  const knownIssues = getKnownIssues();
  return knownIssues.find((issue) => issue.id === id)?.answer ?? null;
}

export function saveFaqEntry({ question, answer, keywords }) {
  const knownIssues = getKnownIssues();
  const nextId =
    knownIssues.reduce((maxId, issue) => Math.max(maxId, issue.id), 0) + 1;
  const entry = {
    id: nextId,
    question,
    answer,
    keywords: keywords?.length ? keywords : inferKeywordsFromQuestion(question),
  };
  knownIssues.push(entry);
  saveKnownIssues(knownIssues);
  return entry;
}
