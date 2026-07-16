import { NextRequest, NextResponse } from "next/server";
import { handleIncomingWhatsappMessage } from "@/lib/whatsapp/handle-incoming";
import { waError, waLog, waWarn } from "@/lib/whatsapp/logger";
import { logApiError } from "@/lib/log-api-error";
import { verifyWhatsappSignature } from "@/lib/whatsapp/verify";
import type {
  ApiErrorResponse,
  WhatsappWebhookOkResponse,
  WhatsappWebhookPayload,
} from "@/types/whatsapp";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<string | ApiErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  waLog("GET vérification Meta reçue", {
    mode,
    tokenMatch: token === VERIFY_TOKEN,
    hasChallenge: Boolean(challenge),
    verifyTokenConfigured: Boolean(VERIFY_TOKEN),
  });

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    waLog("Vérification Meta OK — challenge renvoyé");
    return new NextResponse(challenge, { status: 200 });
  }

  waWarn("Vérification Meta refusée", {
    mode,
    expectedToken: VERIFY_TOKEN ? "(configuré)" : "(manquant)",
    receivedToken: token ?? "(absent)",
  });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<WhatsappWebhookOkResponse | ApiErrorResponse>> {
  const receivedAt = new Date().toISOString();
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();

  waLog("POST reçu", {
    receivedAt,
    bodyLength: rawBody.length,
    hasSignature: Boolean(signatureHeader),
    appSecretConfigured: Boolean(process.env.WHATSAPP_APP_SECRET),
  });

  if (!rawBody.length) {
    waWarn("Corps de requête vide — Meta n'a peut-être pas atteint le serveur");
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  if (!verifyWhatsappSignature(rawBody, signatureHeader)) {
    waWarn("Signature invalide — requête rejetée", {
      hasSignatureHeader: Boolean(signatureHeader),
      hint: process.env.WHATSAPP_APP_SECRET
        ? "Vérifiez WHATSAPP_APP_SECRET dans .env"
        : "WHATSAPP_APP_SECRET non défini (signature ignorée normalement)",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WhatsappWebhookPayload;
  try {
    body = JSON.parse(rawBody) as WhatsappWebhookPayload;
  } catch (error) {
    waError("JSON invalide", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  waLog("Payload parsé", {
    object: body.object,
    entryCount: body.entry?.length ?? 0,
    preview: rawBody.slice(0, 500),
  });

  if (body.object && body.object !== "whatsapp_business_account") {
    waWarn("Object inattendu (ignoré)", { object: body.object });
  }

  let messageCount = 0;
  let statusCount = 0;

  try {
    for (const entry of body.entry ?? []) {
      waLog("Entry", { entryId: entry.id, changeCount: entry.changes?.length ?? 0 });

      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) {
          waWarn("Change sans value", { field: change.field });
          continue;
        }

        waLog("Change", {
          field: change.field,
          phoneNumberId: value.metadata?.phone_number_id,
          messageCount: value.messages?.length ?? 0,
          statusCount: value.statuses?.length ?? 0,
        });

        for (const message of value.messages ?? []) {
          messageCount += 1;
          await handleIncomingWhatsappMessage(message);
        }

        for (const status of value.statuses ?? []) {
          statusCount += 1;
          waLog("Statut livraison", {
            messageId: status.id,
            status: status.status,
            recipient: status.recipient_id,
          });
        }
      }
    }
  } catch (error) {
    logApiError("/api/whatsapp/webhook", error, { method: "POST" });
    waError("Erreur traitement payload", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 },
    );
  }

  waLog("POST terminé", { messageCount, statusCount });
  return NextResponse.json({ status: "ok" });
}
