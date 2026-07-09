import type { DemandeDisplay, DemandeMessageRow } from "@/types/demande";
import type { UserDisplay } from "@/types/user";

export const AI_ASSISTANT_LABEL = "Assistant IA";

export function personName(
  prenom: string | null | undefined,
  nom: string | null | undefined,
  fallback?: string | null,
): string {
  const full = [prenom, nom].filter(Boolean).join(" ");
  return full || fallback || "";
}

type MessageWithAuthor = DemandeMessageRow & {
  auteur_prenom?: string | null;
  auteur_nom?: string | null;
  auteur_name?: string | null;
};

export function isAiAssistantMessage(message: MessageWithAuthor): boolean {
  return (
    message.auteur_prenom === "Assistant" && message.auteur_nom === "IA"
  );
}

export function isClientMessage(
  message: Pick<DemandeMessageRow, "user_id">,
  demandeUserId: string,
): boolean {
  return String(message.user_id) === String(demandeUserId);
}

export function getClientViewMessageLabel(
  message: MessageWithAuthor,
  demande: Pick<DemandeDisplay, "user_id">,
  currentUser: UserDisplay | null,
): string {
  const fromClient = isClientMessage(message, demande.user_id);
  const isOwn =
    currentUser && String(message.user_id) === String(currentUser.id);

  if (fromClient) {
    return isOwn
      ? "Vous"
      : personName(
          message.auteur_prenom,
          message.auteur_nom,
          message.auteur_name,
        ) || "Client";
  }

  if (isAiAssistantMessage(message)) {
    return AI_ASSISTANT_LABEL;
  }

  const technicianName = personName(
    message.auteur_prenom,
    message.auteur_nom,
    message.auteur_name,
  );
  return technicianName ? `Technicien · ${technicianName}` : "Technicien";
}

export function isAdminOwnMessage(
  message: Pick<DemandeMessageRow, "user_id">,
  currentUser: UserDisplay | null,
): boolean {
  return Boolean(
    currentUser && String(message.user_id) === String(currentUser.id),
  );
}

export function getAdminViewMessageLabel(
  message: MessageWithAuthor,
  demande: Pick<
    DemandeDisplay,
    "user_id" | "client_prenom" | "client_nom" | "client_name"
  >,
  currentUser: UserDisplay | null,
): string {
  const fromClient = isClientMessage(message, demande.user_id);

  if (fromClient) {
    return (
      personName(
        message.auteur_prenom,
        message.auteur_nom,
        message.auteur_name,
      ) ||
      personName(demande.client_prenom, demande.client_nom, demande.client_name) ||
      "Client"
    );
  }

  if (isAdminOwnMessage(message, currentUser)) {
    return "Vous";
  }

  if (isAiAssistantMessage(message)) {
    return AI_ASSISTANT_LABEL;
  }

  const technicianName = personName(
    message.auteur_prenom,
    message.auteur_nom,
    message.auteur_name,
  );
  return technicianName ? `Technicien · ${technicianName}` : "Technicien";
}
