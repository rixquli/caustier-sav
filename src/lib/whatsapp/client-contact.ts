import type { DemandeRowJoined } from "@/types/demande";

export type ClientContactInfo = {
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
};

export function getClientContactInfo(
  demande: Pick<
    DemandeRowJoined,
    | "id"
    | "client_name"
    | "client_nom"
    | "client_prenom"
    | "client_phone"
    | "client_email"
  >,
): ClientContactInfo {
  const clientName =
    demande.client_name?.trim() ||
    [demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
    "le client";
  const clientPhone = demande.client_phone?.trim() || null;
  const clientEmail = demande.client_email?.trim() || null;

  return { clientName, clientPhone, clientEmail };
}

export function buildAcceptanceConfirmationBody(
  demandeId: number,
  { clientName, clientPhone, clientEmail }: ClientContactInfo,
): string {
  if (clientPhone) {
    return `Demande #${demandeId} acceptée. Vous pouvez contacter ${clientName} au ${clientPhone}.`;
  }
  if (clientEmail) {
    return `Demande #${demandeId} acceptée. Téléphone client non renseigné — contactez ${clientName} par email : ${clientEmail}.`;
  }
  return `Demande #${demandeId} acceptée. Coordonnées client non renseignées — contactez l'administration.`;
}
