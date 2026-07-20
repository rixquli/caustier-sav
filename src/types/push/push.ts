/** Ligne brute telle que stockée en DB (`push_subscriptions`). */
export type PushSubscriptionRow = {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type PushSubscriptionId = PushSubscriptionRow["id"] | string;

/** Données pour créer / upsert un abonnement push. */
export type CreatePushSubscriptionInput = Pick<
  PushSubscriptionRow,
  "user_id" | "endpoint" | "p256dh" | "auth"
> & {
  user_agent?: string | null;
};

/** Payload JSON envoyé au service worker via Web Push. */
export type PushNotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};
