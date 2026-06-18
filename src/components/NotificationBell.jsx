"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell } from "react-icons/fi";
import {
  formatNotificationTime,
  getNotificationHref,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell({ isAdmin }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  }

  async function handleOpenNotification(notification) {
    if (!notification.read_at) {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notification.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount ?? 0);
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id
                ? { ...n, read_at: new Date().toISOString() }
                : n,
            ),
          );
        }
      } catch {
        /* ignore */
      }
    }

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
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
        );
      }
    } catch {
      /* ignore */
    }
  }

  return (
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
  );
}
