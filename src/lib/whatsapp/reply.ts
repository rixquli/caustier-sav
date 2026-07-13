import type {
  TechnicianReply,
  TechnicianReplyKind,
  WhatsappIncomingMessage,
} from "@/types/whatsapp";

const ACCEPT_VALUES = new Set([
  "oui",
  "yes",
  "ok",
  "accepte",
  "accepté",
  "accepter",
  "j'accepte",
]);

const REFUSE_VALUES = new Set([
  "non",
  "no",
  "refuse",
  "refusé",
  "refuser",
  "refusee",
  "je refuse",
]);

const BUTTON_PAYLOAD_PATTERN = /^(accept|refuse):(\d+)$/i;

function normalizeReplyText(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function buildWhatsappReplyButtonId(
  action: "accept" | "refuse",
  demandeId: number,
): string {
  return `${action}:${demandeId}`;
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

function extractButtonPayload(
  message: WhatsappIncomingMessage,
): string | null {
  return (
    message.interactive?.button_reply?.id ??
    message.button?.payload ??
    null
  );
}

function classifyTextReply(text: string): TechnicianReplyKind {
  const normalized = normalizeReplyText(text);

  if (ACCEPT_VALUES.has(normalized)) return "accept";
  if (REFUSE_VALUES.has(normalized)) return "refuse";
  return "unknown";
}

function extractDemandeIdFromText(text: string): number | null {
  const hashMatch = /#\s*(\d+)/.exec(text);
  if (hashMatch) {
    const id = Number(hashMatch[1]);
    return Number.isFinite(id) ? id : null;
  }

  const trailingMatch = /(?:^|\s)(\d+)\s*$/.exec(text.trim());
  if (trailingMatch) {
    const id = Number(trailingMatch[1]);
    return Number.isFinite(id) ? id : null;
  }

  return null;
}

function stripDemandeIdFromText(text: string): string {
  return text
    .replace(/#\s*\d+/g, "")
    .replace(/(?:^|\s)\d+\s*$/g, "")
    .trim();
}

export function parseTechnicianReply(
  message: WhatsappIncomingMessage,
): TechnicianReply {
  const payload = extractButtonPayload(message);
  if (payload) {
    const match = BUTTON_PAYLOAD_PATTERN.exec(payload.trim());
    if (match) {
      const demandeId = Number(match[2]);
      return {
        kind: match[1].toLowerCase() === "accept" ? "accept" : "refuse",
        demandeId: Number.isFinite(demandeId) ? demandeId : null,
      };
    }
  }

  const text = extractMessageText(message);
  if (!text) {
    return { kind: "unknown", demandeId: null };
  }

  const demandeId = extractDemandeIdFromText(text);
  const kind = classifyTextReply(stripDemandeIdFromText(text) || text);

  return { kind, demandeId };
}

/** @deprecated Utiliser parseTechnicianReply */
export function classifyTechnicianReply(text: string): TechnicianReplyKind {
  return classifyTextReply(text);
}
