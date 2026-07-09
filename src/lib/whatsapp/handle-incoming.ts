import {
  findAwaitingTechnicianResponse,
  getTechnicianByPhone,
  logActivity,
  updateDemande,
} from "@/db/db";
import { createNotification } from "@/db/notifications";
import type { WhatsappIncomingMessage } from "@/types/whatsapp";
import { waLog, waWarn } from "./logger";
import { normalizeWhatsappPhone } from "./phone";
import {
  classifyTechnicianReply,
  extractMessageText,
} from "./reply";

export async function handleIncomingWhatsappMessage(
  message: WhatsappIncomingMessage,
): Promise<void> {
  waLog("Message entrant", {
    messageId: message.id,
    from: message.from,
    fromNormalized: normalizeWhatsappPhone(message.from),
    type: message.type,
    timestamp: message.timestamp,
    raw: message,
  });

  const text = extractMessageText(message);
  if (!text) {
    waWarn("Message ignoré — pas de texte exploitable", {
      type: message.type,
      messageId: message.id,
    });
    return;
  }

  waLog("Texte extrait", { text });

  const replyKind = classifyTechnicianReply(text);
  waLog("Classification réponse", { text, replyKind });

  if (replyKind === "unknown") {
    waWarn("Réponse non reconnue (attendu: oui/non)", {
      text,
      from: message.from,
    });
    return;
  }

  const technician = await getTechnicianByPhone(message.from);
  if (!technician) {
    waWarn("Technicien introuvable pour ce numéro", {
      from: message.from,
      fromNormalized: normalizeWhatsappPhone(message.from),
      hint: "Vérifiez que le téléphone du technicien en base correspond (06… ou 33…)",
    });
    return;
  }

  waLog("Technicien trouvé", {
    id: technician.id,
    name: technician.name,
    telephone: technician.telephone,
    specialite: technician.specialite,
  });

  const demande = await findAwaitingTechnicianResponse(technician.id);
  if (!demande) {
    waWarn("Aucune demande en attente", {
      technicianId: technician.id,
      hint: "Il faut une demande avec status=nouvelle assignée à ce technicien (ou non assignée avec type=spécialité)",
    });
    return;
  }

  waLog("Demande trouvée", {
    demandeId: demande.id,
    status: demande.status,
    assignedTo: demande.assigned_to,
    type: demande.type,
    titre: demande.titre,
  });

  if (replyKind === "accept") {
    waLog("Traitement acceptation…", { demandeId: demande.id });

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

    waLog("Acceptation OK", {
      demandeId: demande.id,
      newStatus: "en_cours",
      technicianId: technician.id,
    });
    return;
  }

  waLog("Traitement refus…", { demandeId: demande.id });

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

  waLog("Refus enregistré", { demandeId: demande.id });
}
