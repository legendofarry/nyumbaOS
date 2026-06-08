// src\lib\push-notifications.ts
type PushUser = {
  userId: string;
  fullName: string;
  role: string;
};

function apiBase() {
  const base = import.meta.env.VITE_PUSH_API_BASE_URL?.trim();
  if (base) {
    return base;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function apiUrl(path: string) {
  return new URL(path, apiBase()).toString();
}

function base64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; ++index) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function ensureSubscriptionSaved(subscription: PushSubscription, user: PushUser) {
  const response = await fetch(apiUrl("/api/push/subscribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription, user }),
  });

  if (!response.ok) {
    throw new Error("Could not save push subscription");
  }
}

export async function enablePushNotifications(user: PushUser) {
  if (typeof window === "undefined") {
    throw new Error("Push notifications can only be enabled in the browser");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("This browser does not support push notifications");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const keyResponse = await fetch(apiUrl("/api/push/vapid-public-key"));
  if (!keyResponse.ok) {
    throw new Error("Could not load push key");
  }

  const { publicKey } = (await keyResponse.json()) as { publicKey?: string };
  if (!publicKey) {
    throw new Error("Push public key is missing");
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(publicKey),
    }));

  await ensureSubscriptionSaved(subscription, user);
  return subscription;
}

export async function disablePushNotifications(userId: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();

  if (!existing) {
    return;
  }

  await fetch(apiUrl("/api/push/unsubscribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: existing.endpoint,
      userId,
    }),
  });

  await existing.unsubscribe();
}

export async function getPushSubscriptionState() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { supported: false, enabled: false, permission: "default" as NotificationPermission };
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();

  return {
    supported: true,
    enabled: !!existing,
    permission: Notification.permission,
  };
}
