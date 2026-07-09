import ollama from "ollama";
import {
  addMessage,
  getAiAssistantUserId,
  getFaqById,
  listFaq,
} from "@/db/db";
import { buildFaqMatchPrompt, parseModelResponse } from "@/lib/known-issues";
import type { DemandeDisplay } from "@/types/demande";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

export type FaqRow = {
  id: number;
  question: string;
  reponse: string;
  categorie: string | null;
  created_at: string;
  updated_at: string;
};

export async function findMatchingFaqEntry(
  titre: string,
  description: string,
): Promise<FaqRow | undefined> {
  const faqEntries = (await listFaq()) as FaqRow[];
  if (!faqEntries.length) {
    return undefined;
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
    return undefined;
  }

  return (await getFaqById(faqId)) as FaqRow | undefined;
}

export async function analyzeDemandeForKnownSolution(
  demande: Pick<DemandeDisplay, "id" | "titre" | "description">,
) {
  const assistantId = await getAiAssistantUserId();
  if (!assistantId) {
    console.warn("Assistant IA introuvable, analyse ignorée.");
    return null;
  }

  let faqEntry: FaqRow | undefined;
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
