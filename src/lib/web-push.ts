import webpush from "web-push";
import { logger } from "@/lib/logger";
import {
  deletePushSubscriptionById,
  listPushSubscriptionsForUser,
} from "@/db/push-subscription";
import type { PushNotificationPayload } from "@/types/push";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@caustier.fr";

  if (!publicKey || !privateKey) {
    logger.warn("Web Push disabled: missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  return publicKey || null;
}

function isGoneStatus(statusCode: unknown): boolean {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Envoie un push à tous les abonnements de l'utilisateur.
 * Fire-and-forget friendly : n'élève jamais (log + cleanup 410).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
): Promise<void> {
  if (!ensureVapidConfigured()) return;

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          body,
        );
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;

        if (isGoneStatus(statusCode)) {
          await deletePushSubscriptionById(sub.id);
          logger.info("Removed expired push subscription", {
            userId,
            subscriptionId: sub.id,
            statusCode,
          });
          return;
        }

        logger.warn("Web Push send failed", {
          userId,
          subscriptionId: sub.id,
          statusCode,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );
}
