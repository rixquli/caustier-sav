import { getStatutInfo } from "@/lib/constants";

export const NOTIFICATION_TYPES = {
  NOUVELLE_DEMANDE: "nouvelle_demande",
  REPONSE_CLIENT: "reponse_client",
  REPONSE_ADMIN: "reponse_admin",
  STATUT_CHANGE: "statut_change",
};

export function getNotificationHref(notification, isAdmin) {
  if (!notification.demande_id) return isAdmin ? "/admin/demandes" : "/demandes";
  return isAdmin
    ? `/admin/demandes/${notification.demande_id}`
    : `/demandes/${notification.demande_id}`;
}

export function parseDbDateTime(dateStr) {
  if (!dateStr) return null;
  if (dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const iso = dateStr.includes("T")
    ? dateStr
    : `${dateStr.trim().replace(" ", "T")}Z`;
  return new Date(iso);
}

export function formatNotificationTime(dateStr) {
  const date = parseDbDateTime(dateStr);
  if (!date || Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildStatusChangeMessage(fromStatus, toStatus) {
  const from = getStatutInfo(fromStatus).label;
  const to = getStatutInfo(toStatus).label;
  return `Statut mis à jour : ${from} → ${to}`;
}
