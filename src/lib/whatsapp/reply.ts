import type {
  TechnicianReplyKind,
  WhatsappIncomingMessage,
} from "@/types/whatsapp";

const ACCEPT_VALUES = new Set([
  "oui",
  "yes",
  "ok",
  "accepte",
  "accepté",
  "j'accepte",
]);

const REFUSE_VALUES = new Set([
  "non",
  "no",
  "refuse",
  "refusé",
  "refusee",
  "je refuse",
]);

function normalizeReplyText(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function extractMessageText(
  message: WhatsappIncomingMessage,
): string | null {
  if (message.type === "text" && message.text?.body) {
    return message.text.body;
  }

  if (message.type === "button") {
    return message.button?.text ?? message.button?.payload ?? null;
  }

  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ??
      message.interactive?.button_reply?.id ??
      message.interactive?.list_reply?.title ??
      message.interactive?.list_reply?.id ??
      null
    );
  }

  return null;
}

export function classifyTechnicianReply(text: string): TechnicianReplyKind {
  const normalized = normalizeReplyText(text);

  if (ACCEPT_VALUES.has(normalized)) return "accept";
  if (REFUSE_VALUES.has(normalized)) return "refuse";
  return "unknown";
}
