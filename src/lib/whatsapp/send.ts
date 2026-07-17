import type { SendWhatsappTemplateInput } from "@/types/whatsapp";
import { normalizeWhatsappPhone } from "./phone";
import { buildWhatsappReplyButtonId } from "./reply";

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_KEY;

async function postWhatsappMessage(body: Record<string, unknown>): Promise<void> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error("WHATSAPP_API_KEY ou PHONE_NUMBER_ID manquant");
  }

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Échec envoi WhatsApp");
  }
}

/**
 * Message interactif unique portant Accepter / Refuser.
 * Le template Meta `notification_sav` doit être **sans boutons** (corps seul),
 * sinon le technicien reçoit deux CTA.
 */
export async function sendDemandeResponseButtons(
  demandeId: number,
  technicianNumber: string,
  context?: { clientName?: string; type?: string; priority?: string },
): Promise<void> {
  if (!technicianNumber?.trim()) {
    throw new Error("Missing required fields");
  }

  const to = normalizeWhatsappPhone(technicianNumber);
  const meta = [
    context?.clientName ? `Client : ${context.clientName}` : null,
    context?.type ? `Type : ${context.type}` : null,
    context?.priority ? `Priorité : ${context.priority}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyText = [
    `Demande #${demandeId} — Accepter ou refuser cette demande :`,
    meta || null,
  ]
    .filter(Boolean)
    .join("\n");

  await postWhatsappMessage({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: buildWhatsappReplyButtonId("accept", demandeId),
              title: "Accepter",
            },
          },
          {
            type: "reply",
            reply: {
              id: buildWhatsappReplyButtonId("refuse", demandeId),
              title: "Refuser",
            },
          },
        ],
      },
    },
  });
}

/**
 * Offre WhatsApp (modèle B) :
 * 1) template info (ouvre la fenêtre 24h) — sans boutons côté Meta
 * 2) un seul message interactif Accepter/Refuser
 *
 * Si le template Meta a déjà des boutons, définir WHATSAPP_TEMPLATE_HAS_BUTTONS=1
 * pour ne pas renvoyer le 2ᵉ message (évite le double CTA).
 */
export async function sendMessage({
  demandeId,
  technicianNumber,
  technicianName,
  clientName,
  description,
  type,
  priority,
}: SendWhatsappTemplateInput): Promise<void> {
  if (
    !demandeId ||
    !technicianNumber ||
    !technicianName ||
    !clientName ||
    !description ||
    !type ||
    !priority
  ) {
    throw new Error("Missing required fields");
  }

  const to = normalizeWhatsappPhone(technicianNumber);
  const labeledDescription = `Demande #${demandeId} — ${description}`;
  const templateHasButtons =
    process.env.WHATSAPP_TEMPLATE_HAS_BUTTONS === "1" ||
    process.env.WHATSAPP_TEMPLATE_HAS_BUTTONS === "true";

  await postWhatsappMessage({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "notification_sav",
      language: {
        code: "fr",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: technicianName },
            { type: "text", text: clientName },
            { type: "text", text: labeledDescription },
            { type: "text", text: type },
            { type: "text", text: priority },
          ],
        },
      ],
    },
  });

  if (templateHasButtons) {
    return;
  }

  try {
    await sendDemandeResponseButtons(demandeId, technicianNumber, {
      clientName,
      type,
      priority,
    });
  } catch (error) {
    console.error(
      `[WhatsApp] Boutons Accepter/Refuser non envoyés pour demande #${demandeId}`,
      error,
    );
    await postWhatsappMessage({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: `Demande #${demandeId} — répondez « oui ${demandeId} » ou « non ${demandeId} » pour cette demande uniquement.`,
      },
    });
  }
}

export async function sendTextMessage(
  toNumber: string,
  body: string,
): Promise<void> {
  if (!toNumber?.trim() || !body?.trim()) {
    throw new Error("Missing required fields");
  }

  const to = normalizeWhatsappPhone(toNumber);

  await postWhatsappMessage({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}
