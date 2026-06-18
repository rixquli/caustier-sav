import ollama from "ollama";
import {
  addMessage,
  getAiAssistantUserId,
  getFaqById,
  listFaq,
} from "@/db/db";
import { buildFaqMatchPrompt, parseModelResponse } from "@/lib/known-issues";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

export async function findMatchingFaqEntry(titre, description) {
  const faqEntries = listFaq();
  if (!faqEntries.length) {
    return null;
  }

  const problemText = [titre, description].filter(Boolean).join("\n\n");
  const prompt = buildFaqMatchPrompt(problemText, faqEntries);

  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: "user", content: prompt }],
    options: { temperature: 0 },
  });

  const faqId = parseModelResponse(response.message.content);
  if (!faqId) {
    return null;
  }

  return getFaqById(faqId);
}

export async function analyzeDemandeForKnownSolution(demande) {
  const assistantId = getAiAssistantUserId();
  if (!assistantId) {
    console.warn("Assistant IA introuvable, analyse ignorée.");
    return null;
  }

  let faqEntry;
  try {
    faqEntry = await findMatchingFaqEntry(demande.titre, demande.description);
  } catch (error) {
    console.error("Analyse IA impossible:", error);
    return null;
  }

  if (!faqEntry?.reponse?.trim()) {
    return null;
  }

  const contenu = [
    "Bonjour,",
    "",
    "Nous avons identifié un problème similaire dans notre base de connaissances.",
    "",
    faqEntry.reponse.trim(),
    "",
    "Si cela ne résout pas votre problème, un technicien prendra le relais.",
  ].join("\n");

  return addMessage({
    demandeId: demande.id,
    userId: assistantId,
    contenu,
  });
}
