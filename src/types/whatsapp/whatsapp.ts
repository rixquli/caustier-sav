/** Payload brut reçu de Meta (WhatsApp Cloud API). */
export type WhatsappWebhookPayload = {
  object?: string;
  entry?: WhatsappWebhookEntry[];
};

export type WhatsappWebhookEntry = {
  id?: string;
  changes?: WhatsappWebhookChange[];
};

export type WhatsappWebhookChange = {
  field?: string;
  value?: WhatsappWebhookValue;
};

export type WhatsappWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
  }>;
  messages?: WhatsappIncomingMessage[];
  statuses?: WhatsappMessageStatus[];
};

export type WhatsappIncomingMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { payload?: string; text?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

export type WhatsappMessageStatus = {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
};

export type SendWhatsappTemplateInput = {
  technicianNumber: string;
  technicianName: string;
  clientName: string;
  description: string;
  type: string;
  priority: string;
};

export type TechnicianReplyKind = "accept" | "refuse" | "unknown";
