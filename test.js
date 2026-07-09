import ollama from "ollama";
import {
  buildModelPrompt,
  parseModelResponse,
  getAnswerById,
  buildFaqSuggestionMessages,
  parseFaqSuggestionResponse,
} from "./src/lib/known-issues.js";

const userProblem = "j'ai un voyant rouge et un code E03";
const prompt = buildModelPrompt(userProblem);
// const prompt = ``;

async function runSingleTest(iteration) {
  const response = await ollama.chat({
    model: "llama3.2:3b",
    messages: [{ role: "user", content: prompt }],
    options: { temperature: 0 },
  });

  let issueId = parseModelResponse(response.message.content);

  if (issueId == 0) {
  }
  console.log(`${issueId}`);

  // if (issueId !== 0) {
  //   throw new Error(
  //     `Iteration ${iteration}: expected issueId 0, got ${issueId}`,
  //   );
  // }

  // const conv = [
  //   {
  //     role: "user",
  //     content: `${userProblem}`,
  //   },
  //   {
  //     role: "assistant",
  //     content: "faut qu'tu re",
  //   },
  // ];
  // const { system, user } = buildFaqSuggestionMessages(conv);
  // const faq = await ollama.chat({
  //   model: "llama3.2:3b",
  //   messages: [
  //     { role: "system", content: system },
  //     { role: "user", content: user },
  //   ],
  //   options: { temperature: 0 },
  // });

  // const parsedFaq = parseFaqSuggestionResponse(faq.message.content);
  // const isEmpty = !parsedFaq || Object.keys(parsedFaq).length === 0;

  // if (!isEmpty) {
  //   throw new Error(
  //     `Iteration ${iteration}: expected {}, got ${JSON.stringify(parsedFaq)}`,
  //   );
  // }
  // if (isEmpty) {
  //   throw new Error(
  //     `Iteration ${iteration}: expected != {}, got ${JSON.stringify(parsedFaq)}`,
  //   );
  // } else {
  //   console.log(`Iteration ${iteration}: OK, got ${JSON.stringify(parsedFaq)}`);
  //   if (parsedFaq.answer == null || parsedFaq.answer.trim() === "") {
  //     throw new Error(
  //       `Iteration ${iteration}: expected non-empty answer, got ${JSON.stringify(parsedFaq)}`,
  //     );
  //   }
  // }

  // console.log(`Iteration ${iteration}: OK`);
}

// for (let i = 1; i <= ; i += 1) {
// await runSingleTest(i);
// }

runSingleTest(0);
// console.log("Tous les tests sont passés : résultat {} confirmé 10 fois.");
