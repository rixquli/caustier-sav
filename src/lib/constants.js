export const DEMANDE_TYPES = [
  { value: "SAV", label: "SAV", badge: "badge-type--sav" },
  { value: "IA", label: "IA", badge: "badge-type--ia" },
  { value: "QUESTION", label: "Question", badge: "badge-type--question" },
  { value: "AUTRE", label: "Autre", badge: "badge-type--autre" },
];

export const DEMANDE_PRIORITES = [
  { value: "faible", label: "Faible", badge: "badge-prio--faible" },
  { value: "normale", label: "Normale", badge: "badge-prio--normale" },
  { value: "haute", label: "Haute", badge: "badge-prio--haute" },
  { value: "critique", label: "Critique", badge: "badge-prio--critique" },
];

export const DEMANDE_STATUTS = {
  nouvelle: { label: "Nouvelle", badge: "badge--info" },
  en_cours: { label: "En cours", badge: "badge--warning" },
  en_attente_client: { label: "En attente client", badge: "badge--purple" },
  resolue: { label: "Résolue", badge: "badge--success" },
  fermee: { label: "Fermée", badge: "badge--muted" },
};

export const ACTIVE_STATUSES = ["nouvelle", "en_cours", "en_attente_client"];
export const CLOSED_STATUSES = ["resolue", "fermee"];

export function getTypeLabel(value) {
  return DEMANDE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function getTypeBadge(value) {
  return DEMANDE_TYPES.find((t) => t.value === value)?.badge ?? "badge-type--autre";
}

export function getPrioriteLabel(value) {
  return DEMANDE_PRIORITES.find((p) => p.value === value)?.label ?? value;
}

export function getPrioriteBadge(value) {
  return DEMANDE_PRIORITES.find((p) => p.value === value)?.badge ?? "badge-prio--normale";
}

export function getStatutInfo(status) {
  return DEMANDE_STATUTS[status] ?? { label: status, badge: "badge--info" };
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}
