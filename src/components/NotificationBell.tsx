"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiX } from "react-icons/fi";
import {
  formatNotificationTime,
  getNotificationHref,
  NOTIFICATION_TYPES,
  type NotificationRow,
} from "@/lib/notifications";

const POLL_MS = 5_000;
const TOAST_DURATION_MS = 8_000;
const PERMISSION_PROMPT_KEY = "caustier-notif-permission-asked";
const PERMISSION_PROMPT_DELAY_MS = 500;

type NotificationBellProps = {
  isAdmin: boolean;
};

type NotificationsResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
};

type ToastItem = {
  id: number;
  title: string;
  message: string;
  href: string;
};

function browserNotificationTitle(type: string): string {
  if (type === NOTIFICATION_TYPES.DEMANDE_ASSIGNEE) {
    return "Demande assignée";
  }
  return "Nouvelle notification";
}

function supportsNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function hasAskedPermissionPrompt(): boolean {
  try {
    return localStorage.getItem(PERMISSION_PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

function markPermissionPromptAsked(): void {
  try {
    localStorage.setItem(PERMISSION_PROMPT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function NotificationBell({ isAdmin }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supportsNotifications() ? Notification.permission : "denied",
  );
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownUnreadIdsRef = useRef<Set<number> | null>(null);
  const toastTimersRef = useRef<Map<number, number>>(new Map());
  const baseTitleRef = useRef(
    typeof document !== "undefined" ? document.title : "Caustier SAV",
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (notification: NotificationRow) => {
      // Toast utile surtout quand l'onglet est au premier plan
      if (document.visibilityState !== "visible") return;

      const title = browserNotificationTitle(notification.type);
      const href = getNotificationHref(notification, isAdmin);
      setToasts((prev) => {
        if (prev.some((t) => t.id === notification.id)) return prev;
        return [
          ...prev,
          {
            id: notification.id,
            title,
            message: notification.message,
            href,
          },
        ];
      });
      const existing = toastTimersRef.current.get(notification.id);
      if (existing) window.clearTimeout(existing);
      const timer = window.setTimeout(() => {
        dismissToast(notification.id);
      }, TOAST_DURATION_MS);
      toastTimersRef.current.set(notification.id, timer);
    },
    [dismissToast, isAdmin],
  );

  const showDesktopNotification = useCallback(
    (notification: NotificationRow) => {
      if (!supportsNotifications()) return;
      if (Notification.permission !== "granted") return;

      try {
        const browserNotif = new Notification(
          browserNotificationTitle(notification.type),
          {
            body: notification.message,
            tag: `notif-${notification.id}`,
            requireInteraction: true,
            silent: false,
          },
        );
        browserNotif.onclick = () => {
          window.focus();
          router.push(getNotificationHref(notification, isAdmin));
          browserNotif.close();
        };
      } catch {
        /* ignore */
      }
    },
    [isAdmin, router],
  );

  const flashDocumentTitle = useCallback((message: string) => {
    if (document.visibilityState === "visible") return;
    const previous = baseTitleRef.current || document.title;
    document.title = `● ${message}`;
    window.setTimeout(() => {
      if (document.visibilityState !== "visible") {
        document.title = previous;
      }
    }, 4000);
  }, []);

  const requestPermissionOnGesture = useCallback(async () => {
    if (!supportsNotifications()) return;
    if (Notification.permission !== "default") {
      setPermission(Notification.permission);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissPermissionModal = useCallback(() => {
    markPermissionPromptAsked();
    setShowPermissionModal(false);
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    await requestPermissionOnGesture();
    dismissPermissionModal();
  }, [dismissPermissionModal, requestPermissionOnGesture]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      const list = data.notifications ?? [];
      setNotifications(list);
      setUnreadCount(data.unreadCount ?? 0);

      const unread = list.filter((n) => !n.read_at);
      const unreadIds = new Set(unread.map((n) => n.id));

      if (knownUnreadIdsRef.current !== null) {
        const newlyArrived = unread.filter(
          (n) => !knownUnreadIdsRef.current!.has(n.id),
        );
        for (const notification of newlyArrived) {
          // Toujours tenter la notif OS (onglet ouvert mais pas forcément actif)
          showDesktopNotification(notification);
          pushToast(notification);
          flashDocumentTitle(browserNotificationTitle(notification.type));
        }
      }

      knownUnreadIdsRef.current = unreadIds;
    } catch {
      /* ignore */
    }
  }, [flashDocumentTitle, pushToast, showDesktopNotification]);

  useEffect(() => {
    if (supportsNotifications()) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!supportsNotifications()) return;
    if (Notification.permission !== "default") return;
    if (hasAskedPermissionPrompt()) return;

    const timerId = window.setTimeout(() => {
      setShowPermissionModal(true);
    }, PERMISSION_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, POLL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        document.title = baseTitleRef.current;
        void fetchNotifications();
      } else {
        baseTitleRef.current = document.title.replace(/^●\s*/, "");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      toastTimersRef.current.clear();
    };
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await requestPermissionOnGesture();
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  }

  async function handleOpenNotification(notification: NotificationRow) {
    if (!notification.read_at) {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notification.id }),
        });
        if (res.ok) {
          const data = (await res.json()) as { unreadCount?: number };
          setUnreadCount(data.unreadCount ?? 0);
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id
                ? { ...n, read_at: new Date().toISOString() }
                : n,
            ),
          );
          knownUnreadIdsRef.current?.delete(notification.id);
        }
      } catch {
        /* ignore */
      }
    }

    dismissToast(notification.id);
    setOpen(false);
    router.push(getNotificationHref(notification, isAdmin));
  }

  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read_at: n.read_at ?? new Date().toISOString(),
          })),
        );
        knownUnreadIdsRef.current = new Set();
        setToasts([]);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="header-notif" ref={containerRef}>
        <button
          type="button"
          className="header-notif-btn"
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
              : "Notifications"
          }
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <FiBell aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="header-notif-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="header-notif-dropdown" role="menu">
            <div className="header-notif-header">
              <span className="header-notif-title">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="header-notif-mark-all"
                  onClick={handleMarkAllRead}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {permission === "default" && (
              <div className="header-notif-permission-hint">
                <p>
                  Activez les notifications bureau pour être alerté même hors de
                  cet onglet.
                </p>
                <button
                  type="button"
                  className="header-notif-enable-btn"
                  onClick={() => void requestPermissionOnGesture()}
                >
                  Activer les notifications PC
                </button>
              </div>
            )}

            {permission === "denied" && (
              <p className="header-notif-permission-hint">
                Notifications navigateur bloquées dans les paramètres du
                navigateur.
              </p>
            )}

            {loading ? (
              <p className="header-notif-empty">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="header-notif-empty">Aucune notification.</p>
            ) : (
              <ul className="header-notif-list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`header-notif-item${notification.read_at ? "" : " header-notif-item--unread"}`}
                      role="menuitem"
                      onClick={() => handleOpenNotification(notification)}
                    >
                      <span className="header-notif-item-message">
                        {notification.message}
                      </span>
                      <span className="header-notif-item-time">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {toasts.length > 0 && (
        <div className="notif-toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className="notif-toast">
              <button
                type="button"
                className="notif-toast-body"
                onClick={() => {
                  dismissToast(toast.id);
                  router.push(toast.href);
                }}
              >
                <strong className="notif-toast-title">{toast.title}</strong>
                <span className="notif-toast-message">{toast.message}</span>
              </button>
              <button
                type="button"
                className="notif-toast-close"
                aria-label="Fermer"
                onClick={() => dismissToast(toast.id)}
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showPermissionModal && (
        <div
          className="modal-overlay"
          onClick={dismissPermissionModal}
          role="presentation"
        >
          <div
            className="modal-card notif-permission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-permission-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="notif-permission-title">
                  Activer les notifications
                </h2>
                <p className="modal-header-subtitle">
                  Recevez une alerte sur votre ordinateur dès qu&apos;une
                  nouvelle notification arrive.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={dismissPermissionModal}
                aria-label="Fermer"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className="notif-permission-modal-body">
              <p>
                Autorisez les notifications navigateur pour être prévenu même
                lorsque cet onglet n&apos;est pas au premier plan.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={dismissPermissionModal}
                >
                  Plus tard
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleEnableNotifications()}
                >
                  Activer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
