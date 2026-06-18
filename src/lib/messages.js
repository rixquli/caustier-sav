export const AI_ASSISTANT_LABEL = "Assistant IA";

export function personName(prenom, nom, fallback) {
  const full = [prenom, nom].filter(Boolean).join(" ");
  return full || fallback || "";
}

export function isAiAssistantMessage(message) {
  return (
    message.auteur_prenom === "Assistant" &&
    message.auteur_nom === "IA"
  );
}

export function isClientMessage(message, demandeUserId) {
  return String(message.user_id) === String(demandeUserId);
}

export function getClientViewMessageLabel(message, demande, currentUser) {
  const fromClient = isClientMessage(message, demande.user_id);
  const isOwn =
    currentUser && String(message.user_id) === String(currentUser.id);

  if (fromClient) {
    return isOwn
      ? "Vous"
      : personName(message.auteur_prenom, message.auteur_nom, message.auteur_name) ||
          "Client";
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

export function isAdminOwnMessage(message, currentUser) {
  return currentUser && String(message.user_id) === String(currentUser.id);
}

export function getAdminViewMessageLabel(message, demande, currentUser) {
  const fromClient = isClientMessage(message, demande.user_id);

  if (fromClient) {
    return (
      personName(
        message.auteur_prenom,
        message.auteur_nom,
        message.auteur_name,
      ) ||
      personName(
        demande.client_prenom,
        demande.client_nom,
        demande.client_name,
      ) ||
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
