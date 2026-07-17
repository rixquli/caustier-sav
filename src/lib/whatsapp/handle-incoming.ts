import {
  findPendingWhatsappDemandeForTechnician,
  getDemandeById,
  getNextTechnicianBySpecialite,
  getRefusedTechnicianIdsForDemande,
  getTechnicianByPhone,
  getTechnicianWhatsappResponseForDemande,
  logActivity,
  notifyAdmins,
  resolveDemandeForTechnicianWhatsappReply,
  updateDemande,
} from "@/db/db";
import {
  claimWhatsappEvent,
  releaseWhatsappEvent,
} from "@/db/whatsapp-events";
import { createNotification } from "@/db/notifications";
import type { WhatsappIncomingMessage } from "@/types/whatsapp";
import { getClientContactInfo } from "./client-contact";
import { waError, waLog, waWarn } from "./logger";
import {
  deliverClientContactToTechnician,
  offerDemandeToTechnician,
} from "./offer";
import { normalizeWhatsappPhone } from "./phone";
import { extractMessageText, parseTechnicianReply } from "./reply";
import { sendTextMessage } from "./send";

async function notifyTechnician(
  technicianPhone: string,
  body: string,
): Promise<void> {
  try {
    await sendTextMessage(technicianPhone, body);
  } catch (error) {
    waError("Échec envoi message WhatsApp au technicien", error);
  }
}

async function resolveDemandeForReply(
  technicianId: number,
  demandeIdHint: number | null,
) {
  if (demandeIdHint != null) {
    const demande = await resolveDemandeForTechnicianWhatsappReply(
      technicianId,
      demandeIdHint,
    );
    if (demande) return demande;

    const existing = await getDemandeById(demandeIdHint);
    if (!existing) {
      return { error: `Demande #${demandeIdHint} introuvable.` } as const;
    }

    const prior = await getTechnicianWhatsappResponseForDemande(
      demandeIdHint,
      technicianId,
    );
    if (prior === "accepted") {
      return {
        error: `Vous avez déjà accepté la demande #${demandeIdHint}.`,
      } as const;
    }
    if (prior === "refused") {
      return {
        error: `Vous avez déjà refusé la demande #${demandeIdHint}.`,
      } as const;
    }
    if (existing.status !== "nouvelle") {
      return {
        error: `La demande #${demandeIdHint} n'est plus en attente de réponse.`,
      } as const;
    }
    if (String(existing.assigned_to) !== String(technicianId)) {
      return {
        error: `La demande #${demandeIdHint} n'est plus assignée à vous.`,
      } as const;
    }

    return {
      error: `Impossible de traiter la demande #${demandeIdHint}.`,
    } as const;
  }

  const pending = await findPendingWhatsappDemandeForTechnician(technicianId);
  if (pending) return pending;

  return {
    error:
      "Aucune demande en attente de votre réponse. Utilisez les boutons du dernier message reçu.",
  } as const;
}

export async function handleIncomingWhatsappMessage(
  message: WhatsappIncomingMessage,
): Promise<void> {
  const claimed = await claimWhatsappEvent(message.id);
  if (!claimed) {
    waLog("Message déjà traité — ignoré", { messageId: message.id });
    return;
  }

  try {
    await processIncomingWhatsappMessage(message);
  } catch (error) {
    try {
      await releaseWhatsappEvent(message.id);
    } catch (releaseError) {
      waError("Échec libération idempotence WhatsApp", releaseError);
    }
    throw error;
  }
}

async function processIncomingWhatsappMessage(
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

  const reply = parseTechnicianReply(message);
  waLog("Classification réponse", { text, reply });

  if (reply.kind === "unknown") {
    waWarn("Réponse non reconnue (attendu: oui/non ou boutons)", {
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

  const resolved = await resolveDemandeForReply(technician.id, reply.demandeId);
  if ("error" in resolved) {
    waWarn("Réponse WhatsApp rejetée", {
      technicianId: technician.id,
      demandeIdHint: reply.demandeId,
      reason: resolved.error,
    });
    await notifyTechnician(technician.telephone, resolved.error);
    return;
  }

  const demande = resolved;

  waLog("Demande trouvée", {
    demandeId: demande.id,
    status: demande.status,
    assignedTo: demande.assigned_to,
    type: demande.type,
    titre: demande.titre,
    demandeIdHint: reply.demandeId,
  });

  if (reply.kind === "accept") {
    waLog("Traitement acceptation…", { demandeId: demande.id });

    await updateDemande(
      demande.id,
      {
        status: "en_cours",
        assignedTo: String(technician.id),
      },
      null,
      { skipNotifications: true },
    );

    const updated = await getDemandeById(demande.id);
    const contact = getClientContactInfo(updated ?? demande);

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
        clientName: contact.clientName,
        clientPhone: contact.clientPhone,
        clientEmail: contact.clientEmail,
      },
      isPublic: true,
    });

    await createNotification({
      userId: demande.user_id,
      type: "technicien_assigne",
      demandeId: demande.id,
      message: `Demande #${demande.id} · ${technician.name} a accepté votre demande.`,
    });

    waLog("Vérification post-acceptation", {
      demandeId: demande.id,
      status: updated?.status,
      assignedTo: updated?.assigned_to,
      clientPhone: contact.clientPhone,
    });

    if (updated?.status !== "en_cours") {
      waError("Échec persistance acceptation — statut inattendu en base", {
        demandeId: demande.id,
        expectedStatus: "en_cours",
        actualStatus: updated?.status ?? null,
        assignedTo: updated?.assigned_to ?? null,
      });
    }

    await deliverClientContactToTechnician({
      demande: updated ?? demande,
      technician,
      reason: "whatsapp_accept",
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
      { skipNotifications: true, skipActivityLog: true },
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

    await notifyTechnician(
      technician.telephone,
      `Demande #${demande.id} refusée. Aucun autre technicien disponible.`,
    );

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
    { skipNotifications: true, skipActivityLog: true },
  );

  await logActivity({
    demandeId: demande.id,
    userId: null,
    action: "whatsapp_technician_reassigned",
    details: {
      fromTechnicianId: technician.id,
      fromTechnicianName: technician.name,
      toTechnicianId: nextTechnician.id,
      toTechnicianName: nextTechnician.name,
    },
    isPublic: true,
  });

  const contact = getClientContactInfo(demande);

  const offerResult = await offerDemandeToTechnician({
    demandeId: demande.id,
    technician: nextTechnician,
    clientName: contact.clientName,
    description: demande.description,
    type: demande.type,
    priority: demande.priorite,
    titre: demande.titre,
    allowEmailFallback: true,
    activityDetails: {
      reassignedAfterRefusal: true,
      previousTechnicianId: technician.id,
      previousTechnicianName: technician.name,
    },
  });

  if (offerResult.channel !== "none") {
    await notifyTechnician(
      technician.telephone,
      `Demande #${demande.id} refusée. Elle a été proposée à ${nextTechnician.name}.`,
    );

    waLog("Réassignation OK", {
      demandeId: demande.id,
      previousTechnicianId: technician.id,
      nextTechnicianId: nextTechnician.id,
      nextTechnicianName: nextTechnician.name,
      channel: offerResult.channel,
    });
  } else {
    waError(
      "Échec envoi offre au technicien suivant",
      offerResult.error ?? "aucun canal",
    );
  }
}
