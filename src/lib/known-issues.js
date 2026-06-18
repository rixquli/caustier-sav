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

export function getKnownIssues() {
  return loadKnownIssues();
}

function buildIssueMatchPrompt(problemText, entries) {
  const lines = [
    "Voici une liste de problèmes connus avec leur numéro :",
    ...entries.map((entry) => `${entry.id}: ${entry.question}`),
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

export function buildModelPrompt(problemText) {
  return buildIssueMatchPrompt(problemText, getKnownIssues());
}

export function buildFaqMatchPrompt(problemText, faqEntries) {
  return buildIssueMatchPrompt(problemText, faqEntries);
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

export function parseFaqSuggestionResponse(responseText) {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (Object.keys(parsed).length === 0) {
      return {};
    }

    const question =
      typeof parsed.question === "string" ? parsed.question.trim() : "";
    const answer =
      typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!question || !answer) {
      return null;
    }

    const noSolutionPattern =
      /\b(\{\s*\}|null|undefined|aucune solution|pas de solution|pas de solution explicite|pas de solution claire|pas de solution confirmée|il n'y a pas de solution|ne contient pas de solution|solution explicite et confirmée|conversation fournie)\b/i;
    if (noSolutionPattern.test(answer)) {
      return {};
    }

    const uncertainPattern =
      /\b(pas sûr|incertain|peut varier|généralement|souvent|possible|probablement|peut être|il se peut|il est recommandé|consultez|support technique|expert technique|en fonction de|différents|information spécifique|contacter|diagnostic|vague|solution adaptée|trouver une solution)\b/i;
    if (uncertainPattern.test(answer)) {
      return {};
    }

    return { question, answer };
  } catch (error) {
    return null;
  }
}

export function buildFaqSuggestionMessages(conversationHistory) {
  const system = [
    "Tu es un outil d'EXTRACTION pour un SAV. Tu n'es pas un assistant qui répond aux questions.",
    "Ta SEULE source d'information est la conversation fournie par l'utilisateur.",
    "Tu n'as AUCUNE connaissance générale. Tu n'as pas le droit d'utiliser ce que tu sais par ailleurs.",
    "Tu ne dois proposer une entrée FAQ QUE si la conversation contient EXPLICITEMENT une solution concrète donnée et confirmée par le technicien.",
    "N'invente jamais de solution. Ne déduis pas, ne suppose pas, ne complète pas.",
    "Si la conversation ne contient pas de solution claire, factuelle et explicite, réponds exactement : {}",
    "En cas de doute, réponds exactement : {}",
    'Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour : {"question": "<texte>", "answer": "<texte>"} ou {}',
    'N\'utilise jamais "{}" comme valeur de question ou answer. Si la réponse serait "{}", alors l\'objet complet doit être exactement {}.',
    "N'explique jamais pourquoi tu réponds {}. Les phrases comme 'il n'y a pas de solution explicite' sont interdites.",
    "La réponse ne doit jamais être générique ou hypothétique (ex : 'peut signifier', 'peut varier', 'consultez le support', 'il est recommandé', 'contactez le fabricant'). Dans ces cas, réponds {}.",
  ].join("\n");

  const user = [
    "Conversation à analyser (ta seule source d'information) :",
    "---",
    ...conversationHistory.map((msg) => `${msg.role}: ${msg.content}`),
    "---",
    "Rappel : si cette conversation ne contient pas de solution explicite et confirmée, réponds exactement {}. N'utilise jamais tes propres connaissances.",
    "Sortie JSON :",
  ].join("\n");

  return { system, user };
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
  };
  knownIssues.push(entry);
  saveKnownIssues(knownIssues);
  return entry;
}
