import type { PushSubscriptionRow } from "./push";

export type ApiErrorResponse = {
  error: string;
};

export type VapidPublicKeyResponse = {
  publicKey: string;
};

/** Corps POST /api/push/subscribe (forme PushSubscription.toJSON()). */
export type SubscribePushRequest = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
};

export type SubscribePushResponse = {
  ok: true;
  subscription: Pick<
    PushSubscriptionRow,
    "id" | "endpoint" | "user_id" | "created_at"
  >;
};

export type UnsubscribePushRequest = {
  endpoint: string;
};

export type UnsubscribePushResponse = {
  ok: true;
};
