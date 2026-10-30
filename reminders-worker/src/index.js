import { verifyToken } from "@clerk/backend";
import { sendPushNotification } from "@mmmike/web-push/send";
import { countDue, isValidDate, localDayAndHour } from "./logic.mjs";

/** Small, authenticated Web Push server for Clerk + a Cloudflare D1 binding.
 * A user can write/remove only subscriptions belonging to their Clerk ID.
 * Cron keeps no browser tab, login session or JS timer running.
 */
const origins = (env) => String(env.ALLOWED_ORIGINS || "")
  .split(",").map((value) => value.trim()).filter(Boolean);

function cors(req, env) {
  const requestOrigin = req.headers.get("Origin");
  const allowed = origins(env);
  return {
    "Access-Control-Allow-Origin": requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : "null",
    "Access-Control-Allow-Methods": "PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}
function reply(req, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(req, env) },
  });
}
function isPushEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host === "updates.push.services.mozilla.com"
      || host === "push.services.mozilla.com"
      || host === "web.push.apple.com"
      || host === "api.push.apple.com"
      || host.endsWith(".push.apple.com")
      || host.endsWith(".notify.windows.com");
  } catch { return false; }
}
function validSubscription(sub) {
  return sub && typeof sub === "object" && isPushEndpoint(sub.endpoint)
    && typeof sub.keys?.p256dh === "string" && /^[A-Za-z0-9_-]{80,120}$/.test(sub.keys.p256dh)
    && typeof sub.keys?.auth === "string" && /^[A-Za-z0-9_-]{15,40}$/.test(sub.keys.auth);
}
async function clerkUser(req, env) {
  const bearer = req.headers.get("Authorization") || "";
  if (!bearer.startsWith("Bearer ") || !env.CLERK_JWT_KEY) throw new Error("No auth");
  const payload = await verifyToken(bearer.slice(7), {
    jwtKey: env.CLERK_JWT_KEY,
    authorizedParties: origins(env),
  });
  if (!payload?.sub || typeof payload.sub !== "string") throw new Error("No user");
  return payload.sub;
}
async function parsePayload(req) {
  const text = await req.text();
  if (text.length > 48_000) throw new Error("Payload too large");
  return JSON.parse(text);
}
function validChores(chores) {
  if (!Array.isArray(chores) || chores.length > 200) return false;
  const seen = new Set();
  for (const c of chores) {
    if (typeof c?.id !== "string" || c.id.length < 1 || c.id.length > 130
      || !isValidDate(c.dueDate) || seen.has(c.id)) return false;
    seen.add(c.id);
  }
  return true;
}
async function writeSubscription(req, env, owner) {
  const body = await parsePayload(req);
  if (!validSubscription(body.subscription) || !validChores(body.chores)
    || ![9, 18].includes(body.hour)
    || typeof body.timezone !== "string" || body.timezone.length > 100) {
    return reply(req, env, { error: "Invalid subscription or schedule" }, 400);
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: body.timezone });
  } catch {
    return reply(req, env, { error: "Unknown timezone" }, 400);
  }
  const endpoint = body.subscription.endpoint;
  const current = await env.DB.prepare("SELECT owner FROM reminder_devices WHERE endpoint=?")
    .bind(endpoint).first();
  if (current && current.owner !== owner) {
    return reply(req, env, { error: "Subscription belongs to another account" }, 409);
  }
  if (!current) {
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM reminder_devices WHERE owner=?")
      .bind(owner).first();
    if (Number(count?.total || 0) >= 5) {
      return reply(req, env, { error: "Maximum five connected devices" }, 429);
    }
  }
  // Do not reset last_notified_day when app resyncs the schedule.
  await env.DB.prepare(`INSERT INTO reminder_devices
    (endpoint, owner, subscription_json, chores_json, timezone, notify_hour, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      subscription_json=excluded.subscription_json,
      chores_json=excluded.chores_json,
      timezone=excluded.timezone,
      notify_hour=excluded.notify_hour,
      updated_at=excluded.updated_at`)
    .bind(endpoint, owner, JSON.stringify(body.subscription), JSON.stringify(body.chores),
      body.timezone, body.hour, new Date().toISOString()).run();
  return reply(req, env, { registered: true });
}
async function deleteSubscription(req, env, owner) {
  const body = await parsePayload(req);
  if (!isPushEndpoint(body.endpoint)) return reply(req, env, { error: "Invalid endpoint" }, 400);
  await env.DB.prepare("DELETE FROM reminder_devices WHERE endpoint=? AND owner=?")
    .bind(body.endpoint, owner).run();
  return reply(req, env, { registered: false });
}
async function checkAndSend(row, env, now) {
  const { day, hour } = localDayAndHour(row.timezone, now);
  if (hour !== Number(row.notify_hour) || day === row.last_notified_day) return;
  const count = countDue(JSON.parse(row.chores_json), day);
  if (count === 0) return;
  // Atomic claim before sending: hourly cron retries cannot duplicate a day.
  const claimed = await env.DB.prepare(`UPDATE reminder_devices SET last_notified_day=?
    WHERE endpoint=? AND (last_notified_day IS NULL OR last_notified_day != ?)`)
    .bind(day, row.endpoint, day).run();
  if ((claimed.meta?.changes || 0) !== 1) return;
  try {
    const valid = await sendPushNotification(
      JSON.parse(row.subscription_json),
      {
        title: "CuraCasa · Promemoria",
        body: count === 1 ? "Hai una faccenda in scadenza" : `Hai ${count} faccende in scadenza`,
        data: { count, day },
      },
      {
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
        subject: env.VAPID_SUBJECT,
      },
    );
    if (!valid) {
      await env.DB.prepare("DELETE FROM reminder_devices WHERE endpoint=?").bind(row.endpoint).run();
    }
  } catch (err) {
    // Network/transient error: unlock the day for retry, retaining daily limit.
    console.warn("Push send failed", String(err));
    await env.DB.prepare("UPDATE reminder_devices SET last_notified_day=NULL WHERE endpoint=? AND last_notified_day=?")
      .bind(row.endpoint, day).run();
  }
}
async function deliverDue(env) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
    throw new Error("VAPID credentials are not configured");
  }
  // Beta safeguard: 40 devices per hourly trigger; expand via queue for scale.
  const result = await env.DB.prepare("SELECT * FROM reminder_devices ORDER BY updated_at DESC LIMIT 40").all();
  const now = new Date();
  const rows = result.results || [];
  for (let i = 0; i < rows.length; i += 5) {
    await Promise.allSettled(rows.slice(i, i + 5).map((row) => checkAndSend(row, env, now)));
  }
}
export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path === "/health" && req.method === "GET") {
      return reply(req, env, { ok: true, pushConfigured: Boolean(env.VAPID_PUBLIC_KEY && env.CLERK_JWT_KEY) });
    }
    if (path !== "/api/reminders") return reply(req, env, { error: "Not found" }, 404);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req, env) });
    if (!origins(env).includes(req.headers.get("Origin"))) {
      return reply(req, env, { error: "Origin denied" }, 403);
    }
    if (!["PUT", "DELETE"].includes(req.method)) return reply(req, env, { error: "Method not allowed" }, 405);
    let user;
    try {
      user = await clerkUser(req, env);
    } catch {
      return reply(req, env, { error: "Unauthorized Clerk session" }, 401);
    }
    try {
      return req.method === "PUT"
        ? await writeSubscription(req, env, user)
        : await deleteSubscription(req, env, user);
    } catch (error) {
      console.error("Reminder request failed", String(error));
      return reply(req, env, { error: "Unable to update reminders" }, 500);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(deliverDue(env));
  },
};
