import ollama from "ollama";
import {
  buildModelPrompt,
  findKnownIssueByText,
  parseModelResponse,
  getAnswerById,
} from "./src/lib/known-issues.js";

const userProblem = "j'ai un voyant rouge";
const prompt = buildModelPrompt(userProblem);

const response = await ollama.chat({
  model: "mistral",
  messages: [{ role: "user", content: prompt }],
});

let issueId = findKnownIssueByText(userProblem);
if (!issueId) {
  issueId = parseModelResponse(response.message.content);
}

if (issueId === 0) {
  console.log("Résultat du modèle : 0 (pas de réponse connue)");
} else {
  console.log("Résultat du modèle :", issueId);
  console.log("Réponse connue :", getAnswerById(issueId));
}
