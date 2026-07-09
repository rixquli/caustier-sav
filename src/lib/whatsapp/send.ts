import type { SendWhatsappTemplateInput } from "@/types/whatsapp";
import { normalizeWhatsappPhone } from "./phone";

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_KEY;

export async function sendMessage({
  technicianNumber,
  technicianName,
  clientName,
  description,
  type,
  priority,
}: SendWhatsappTemplateInput): Promise<void> {
  if (
    !technicianNumber ||
    !technicianName ||
    !clientName ||
    !description ||
    !type ||
    !priority
  ) {
    throw new Error("Missing required fields");
  }

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error("WHATSAPP_API_KEY ou PHONE_NUMBER_ID manquant");
  }

  const to = normalizeWhatsappPhone(technicianNumber);

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
                { type: "text", text: description },
                { type: "text", text: type },
                { type: "text", text: priority },
              ],
            },
          ],
        },
      }),
    },
  );

  const data = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Échec envoi WhatsApp");
  }
}
