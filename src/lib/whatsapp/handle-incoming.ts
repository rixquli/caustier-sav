import {
  findAwaitingTechnicianResponse,
  getNextTechnicianBySpecialite,
  getRefusedTechnicianIdsForDemande,
  getTechnicianByPhone,
  logActivity,
  notifyAdmins,
  updateDemande,
} from "@/db/db";
import { createNotification } from "@/db/notifications";
import type { WhatsappIncomingMessage } from "@/types/whatsapp";
import { waError, waLog, waWarn } from "./logger";
import { normalizeWhatsappPhone } from "./phone";
import {
  classifyTechnicianReply,
  extractMessageText,
} from "./reply";
import { sendMessage } from "./send";

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

  const refusedIds = await getRefusedTechnicianIdsForDemande(demande.id);
  const nextTechnician = await getNextTechnicianBySpecialite(
    demande.type,
    refusedIds,
  );

  if (!nextTechnician) {
    await updateDemande(
      demande.id,
      { assignedTo: null },
      null,
      { skipNotifications: true },
    );

    await logActivity({
      demandeId: demande.id,
      userId: null,
      action: "whatsapp_no_technician_available",
      details: {
        refusedTechnicianIds: refusedIds,
        type: demande.type,
      },
      isPublic: true,
    });

    await notifyAdmins({
      type: "whatsapp_no_technician",
      demandeId: demande.id,
      message: `Demande #${demande.id} · aucun technicien disponible (${demande.type}) après refus.`,
    });

    waWarn("Aucun autre technicien disponible", {
      demandeId: demande.id,
      refusedIds,
      type: demande.type,
    });
    return;
  }

  await updateDemande(
    demande.id,
    { assignedTo: String(nextTechnician.id) },
    null,
    { skipNotifications: true },
  );

  const clientName =
    demande.client_name?.trim() ||
    [demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
    "Client";

  try {
    await sendMessage({
      technicianNumber: nextTechnician.telephone,
      technicianName: nextTechnician.name,
      clientName,
      description: demande.description,
      type: demande.type,
      priority: demande.priorite,
    });

    await logActivity({
      demandeId: demande.id,
      userId: null,
      action: "whatsapp_message_sent",
      details: {
        technicianId: nextTechnician.id,
        technicianName: nextTechnician.name,
        technicianNumber: nextTechnician.telephone,
        clientName,
        description: demande.description,
        type: demande.type,
        priority: demande.priorite,
        reassignedAfterRefusal: true,
        previousTechnicianId: technician.id,
      },
      isPublic: true,
    });

    waLog("Réassignation OK", {
      demandeId: demande.id,
      previousTechnicianId: technician.id,
      nextTechnicianId: nextTechnician.id,
      nextTechnicianName: nextTechnician.name,
    });
  } catch (error) {
    waError("Échec envoi WhatsApp au technicien suivant", error);
    await logActivity({
      demandeId: demande.id,
      userId: null,
      action: "whatsapp_message_failed",
      details: {
        technicianId: nextTechnician.id,
        technicianName: nextTechnician.name,
        previousTechnicianId: technician.id,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      isPublic: true,
    });
  }
}
