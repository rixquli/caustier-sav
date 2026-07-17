import { logActivity } from "@/db/demande";
import { sendAssignmentEmail, sendClientContactEmail } from "@/lib/mail";
import type { DemandeRowJoined } from "@/types/demande";
import type { TechnicienDisplay, TechnicienRow } from "@/types/technicien";
import {
  buildAcceptanceConfirmationBody,
  getClientContactInfo,
  type ClientContactInfo,
} from "./client-contact";
import { sendMessage, sendTextMessage } from "./send";

type TechnicianLike = Pick<
  TechnicienRow | TechnicienDisplay,
  "id" | "name" | "telephone" | "email"
> & {
  user_id?: string | null;
  userId?: string | null;
};

export type OfferDemandeInput = {
  demandeId: number;
  technician: TechnicianLike;
  clientName: string;
  description: string;
  type: string;
  priority: string;
  /** Titre pour l'email d'offre (sinon extrait de la description). */
  titre?: string;
  /**
   * Si true (ex. cascade refus avec skipNotifications), envoie un email
   * quand le technicien n'a pas de téléphone. Sinon l'email est géré par
   * notifyAssigneeOnAssignment.
   */
  allowEmailFallback?: boolean;
  activityDetails?: Record<string, unknown>;
};

export type DeliverClientContactInput = {
  demande: Pick<
    DemandeRowJoined,
    | "id"
    | "titre"
    | "client_name"
    | "client_nom"
    | "client_prenom"
    | "client_phone"
    | "client_email"
  >;
  technician: TechnicianLike;
  /** Source de l'envoi pour le journal d'activité. */
  reason: "whatsapp_accept" | "self_assign";
};

function demandeUrl(demandeId: number): string {
  const baseUrl = (
    process.env.BETTER_AUTH_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${baseUrl}/admin/demandes/${demandeId}`;
}

/**
 * Offre une demande au technicien (modèle B) : WhatsApp Accept/Refuse si tél,
 * sinon email avec lien fiche (sans coords client).
 */
export async function offerDemandeToTechnician(
  input: OfferDemandeInput,
): Promise<{ channel: "whatsapp" | "email" | "none"; error?: string }> {
  const {
    demandeId,
    technician,
    clientName,
    description,
    type,
    priority,
    titre,
    allowEmailFallback = false,
    activityDetails = {},
  } = input;

  const phone = technician.telephone?.trim();
  if (phone) {
    try {
      await sendMessage({
        demandeId,
        technicianNumber: phone,
        technicianName: technician.name,
        clientName,
        description,
        type,
        priority,
      });

      await logActivity({
        demandeId,
        userId: null,
        action: "whatsapp_message_sent",
        details: {
          technicianId: technician.id,
          technicianName: technician.name,
          technicianNumber: phone,
          clientName,
          description,
          type,
          priority,
          ...activityDetails,
        },
        isPublic: true,
      });

      return { channel: "whatsapp" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `[offerDemandeToTechnician] WhatsApp failed for demande #${demandeId}`,
        error,
      );
      await logActivity({
        demandeId,
        userId: null,
        action: "whatsapp_message_failed",
        details: {
          technicianId: technician.id,
          technicianName: technician.name,
          error: message,
          ...activityDetails,
        },
        isPublic: true,
      });
      return { channel: "none", error: message };
    }
  }

  if (!allowEmailFallback) {
    return { channel: "none" };
  }

  const email = technician.email?.trim();
  if (email) {
    const mailResult = await sendAssignmentEmail({
      to: email,
      name: technician.name,
      titre: titre?.trim() || description.slice(0, 80) || `Demande #${demandeId}`,
      demandeId,
      demandeUrl: demandeUrl(demandeId),
    });
    if (!mailResult.ok) {
      return { channel: "none", error: mailResult.error };
    }
    await logActivity({
      demandeId,
      userId: null,
      action: "assignment_email_sent",
      details: {
        technicianId: technician.id,
        technicianName: technician.name,
        email,
        ...activityDetails,
      },
      isPublic: true,
    });
    return { channel: "email" };
  }

  return { channel: "none" };
}

/**
 * Envoie les coordonnées client au technicien (après accept WhatsApp ou self-assign).
 * WhatsApp si téléphone, sinon email. Aucune notif navigateur.
 */
export async function deliverClientContactToTechnician(
  input: DeliverClientContactInput,
): Promise<{ channel: "whatsapp" | "email" | "none"; error?: string }> {
  const { demande, technician, reason } = input;
  const contact = getClientContactInfo(demande);
  const body = buildAcceptanceConfirmationBody(demande.id, contact);

  const phone = technician.telephone?.trim();
  if (phone) {
    try {
      await sendTextMessage(phone, body);
      await logContactDelivery(demande.id, technician, contact, reason, "whatsapp");
      return { channel: "whatsapp" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `[deliverClientContactToTechnician] WhatsApp failed for demande #${demande.id}`,
        error,
      );
      await logContactDelivery(
        demande.id,
        technician,
        contact,
        reason,
        "none",
        message,
      );
      return { channel: "none", error: message };
    }
  }

  const email = technician.email?.trim();
  if (email) {
    const mailResult = await sendClientContactEmail({
      to: email,
      technicianName: technician.name,
      demandeId: demande.id,
      titre: demande.titre,
      clientName: contact.clientName,
      clientPhone: contact.clientPhone,
      clientEmail: contact.clientEmail,
      demandeUrl: demandeUrl(demande.id),
    });
    if (!mailResult.ok) {
      await logContactDelivery(
        demande.id,
        technician,
        contact,
        reason,
        "none",
        mailResult.error,
      );
      return { channel: "none", error: mailResult.error };
    }
    await logContactDelivery(demande.id, technician, contact, reason, "email");
    return { channel: "email" };
  }

  await logContactDelivery(demande.id, technician, contact, reason, "none");
  return { channel: "none" };
}

async function logContactDelivery(
  demandeId: number,
  technician: TechnicianLike,
  contact: ClientContactInfo,
  reason: DeliverClientContactInput["reason"],
  channel: "whatsapp" | "email" | "none",
  error?: string,
): Promise<void> {
  const action =
    reason === "self_assign"
      ? "technician_self_assigned"
      : "client_contact_delivered";

  await logActivity({
    demandeId,
    userId: null,
    action,
    details: {
      technicianId: technician.id,
      technicianName: technician.name,
      channel,
      clientName: contact.clientName,
      clientPhone: contact.clientPhone,
      clientEmail: contact.clientEmail,
      ...(error ? { error } : {}),
    },
    isPublic: true,
  });
}
