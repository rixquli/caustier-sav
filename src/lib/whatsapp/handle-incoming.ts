import {
  findAwaitingTechnicianResponse,
  getTechnicianByPhone,
  logActivity,
  updateDemande,
} from "@/db/db";
import { createNotification } from "@/db/notifications";
import type { WhatsappIncomingMessage } from "@/types/whatsapp";
import {
  classifyTechnicianReply,
  extractMessageText,
} from "./reply";

export async function handleIncomingWhatsappMessage(
  message: WhatsappIncomingMessage,
): Promise<void> {
  const text = extractMessageText(message);
  if (!text) {
    console.log("WhatsApp: message sans texte exploitable", message.type);
    return;
  }

  const replyKind = classifyTechnicianReply(text);
  if (replyKind === "unknown") {
    console.log(`WhatsApp: réponse non reconnue "${text}" de ${message.from}`);
    return;
  }

  const technician = await getTechnicianByPhone(message.from);
  if (!technician) {
    console.warn(`WhatsApp: technicien introuvable pour ${message.from}`);
    return;
  }

  const demande = await findAwaitingTechnicianResponse(technician.id);
  if (!demande) {
    console.warn(
      `WhatsApp: aucune demande en attente pour le technicien ${technician.id}`,
    );
    return;
  }

  if (replyKind === "accept") {
    await updateDemande(
      demande.id,
      {
        status: "en_cours",
        assignedTo: String(technician.id),
      },
      null,
    );

    await logActivity({
      demandeId: demande.id,
      userId: null,
      action: "whatsapp_technician_accepted",
      details: {
        technicianId: technician.id,
        technicianName: technician.name,
        phone: message.from,
        messageId: message.id,
        reply: text,
      },
      isPublic: true,
    });

    await createNotification({
      userId: demande.user_id,
      type: "technicien_assigne",
      demandeId: demande.id,
      message: `Demande #${demande.id} · ${technician.name} a accepté votre demande.`,
    });

    return;
  }

  await logActivity({
    demandeId: demande.id,
    userId: null,
    action: "whatsapp_technician_refused",
    details: {
      technicianId: technician.id,
      technicianName: technician.name,
      phone: message.from,
      messageId: message.id,
      reply: text,
    },
    isPublic: true,
  });
}
