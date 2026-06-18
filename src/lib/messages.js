export function personName(prenom, nom, fallback) {
  const full = [prenom, nom].filter(Boolean).join(" ");
  return full || fallback || "";
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

  const technicianName = personName(
    message.auteur_prenom,
    message.auteur_nom,
    message.auteur_name,
  );
  return technicianName ? `Technicien · ${technicianName}` : "Technicien";
}
