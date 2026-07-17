import { getStatutInfo } from "@/lib/constants";

export type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  demande_id: number | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATION_TYPES = {
  NOUVELLE_DEMANDE: "nouvelle_demande",
  REPONSE_CLIENT: "reponse_client",
  REPONSE_ADMIN: "reponse_admin",
  STATUT_CHANGE: "statut_change",
  /** Demande assignée au technicien lié (in-app / navigateur). */
  DEMANDE_ASSIGNEE: "demande_assignee",
} as const;

export function getNotificationHref(
  notification: Pick<NotificationRow, "demande_id">,
  isAdmin: boolean,
): string {
  if (!notification.demande_id) {
    return isAdmin ? "/admin/demandes" : "/demandes";
  }
  return isAdmin
    ? `/admin/demandes/${notification.demande_id}`
    : `/demandes/${notification.demande_id}`;
}

export function parseDbDateTime(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  if (dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const iso = dateStr.includes("T")
    ? dateStr
    : `${dateStr.trim().replace(" ", "T")}Z`;
  return new Date(iso);
}

export function formatNotificationTime(dateStr: string): string {
  const date = parseDbDateTime(dateStr);
  if (!date || Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

export function buildStatusChangeMessage(
  fromStatus: string,
  toStatus: string,
): string {
  const from = getStatutInfo(fromStatus).label;
  const to = getStatutInfo(toStatus).label;
  return `Statut mis à jour : ${from} → ${to}`;
}
