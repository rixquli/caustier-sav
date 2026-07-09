import { NextRequest, NextResponse } from "next/server";
import { handleIncomingWhatsappMessage } from "@/lib/whatsapp/handle-incoming";
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

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<WhatsappWebhookOkResponse | ApiErrorResponse>> {
  const rawBody = await request.text();

  if (
    !verifyWhatsappSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WhatsappWebhookPayload;
  try {
    body = JSON.parse(rawBody) as WhatsappWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        for (const message of value.messages ?? []) {
          await handleIncomingWhatsappMessage(message);
        }

        for (const status of value.statuses ?? []) {
          console.log(
            `WhatsApp statut ${status.id}: ${status.status} → ${status.recipient_id}`,
          );
        }
      }
    }
  } catch (error) {
    console.error("Erreur traitement webhook WhatsApp:", error);
  }

  return NextResponse.json({ status: "ok" });
}
