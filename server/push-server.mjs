import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import 'dotenv/config';

import webpush from "web-push";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const STORE_FILE = process.env.PUSH_STORE_FILE || join(DATA_DIR, "subscriptions.json");
const PORT = Number(process.env.PORT || 8787);
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
const ADMIN_TOKEN = process.env.PUSH_ADMIN_TOKEN || "";

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("Missing VAPID keys. Generate them before starting the push server.");
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, JSON.stringify({ subscriptions: [] }, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
  };
}

async function writeStore(store) {
  await ensureStore();
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  });
  if (status === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(payload));
}

function authorized(req) {
  if (!ADMIN_TOKEN) return true;
  const header = req.headers.authorization || "";
  return header === `Bearer ${ADMIN_TOKEN}`;
}

async function removeSubscriptionByEndpoint(endpoint) {
  const store = await readStore();
  store.subscriptions = store.subscriptions.filter((entry) => entry.subscription?.endpoint !== endpoint);
  await writeStore(store);
}

async function saveSubscription(subscription, user) {
  const store = await readStore();
  const next = {
    subscription,
    userId: user?.userId || null,
    fullName: user?.fullName || null,
    role: user?.role || null,
    updatedAt: new Date().toISOString(),
  };

  const index = store.subscriptions.findIndex((entry) => entry.subscription?.endpoint === subscription.endpoint);
  if (index >= 0) {
    store.subscriptions[index] = { ...store.subscriptions[index], ...next };
  } else {
    store.subscriptions.push({
      ...next,
      createdAt: new Date().toISOString(),
    });
  }

  await writeStore(store);
  return next;
}

async function sendNotificationToSubscriptions(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { ok: true };
      } catch (error) {
        const statusCode = error?.statusCode || 0;
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscriptionByEndpoint(subscription.endpoint);
        }
        return { ok: false, error: error?.message || "Failed to send push" };
      }
    }),
  );

  return results.map((result) => (result.status === "fulfilled" ? result.value : { ok: false, error: result.reason?.message || "Failed" }));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/push/vapid-public-key") {
    sendJson(res, 200, { publicKey: VAPID_PUBLIC_KEY });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/push/subscribe") {
    const body = await readJson(req);
    if (!body.subscription?.endpoint) {
      sendJson(res, 400, { error: "Missing subscription" });
      return;
    }

    const saved = await saveSubscription(body.subscription, body.user);
    sendJson(res, 200, { ok: true, subscription: saved });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/push/unsubscribe") {
    const body = await readJson(req);
    if (!body.endpoint) {
      sendJson(res, 400, { error: "Missing endpoint" });
      return;
    }

    await removeSubscriptionByEndpoint(body.endpoint);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/push/notify") {
    if (!authorized(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const body = await readJson(req);
    const store = await readStore();
    const payload = {
      title: body.title || "Apartment",
      body: body.body || "You have a new update.",
      icon: body.icon || "/pwa-icon.svg",
      badge: body.badge || "/pwa-icon.svg",
      url: body.url || "/app",
      tag: body.tag || "apartment-update",
      data: body.data || {},
    };

    const targetUserIds = Array.isArray(body.userIds) && body.userIds.length ? new Set(body.userIds) : null;
    const recipients = targetUserIds
      ? store.subscriptions.filter((entry) => entry.userId && targetUserIds.has(entry.userId))
      : store.subscriptions;

    const results = await sendNotificationToSubscriptions(recipients, payload);
    sendJson(res, 200, { ok: true, sent: results.length, results });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Push server listening on http://localhost:${PORT}`);
});
