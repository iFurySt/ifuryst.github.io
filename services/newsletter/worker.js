import { publishing } from "./publishing.js";

const DAY = 86400;
const encoder = new TextEncoder();
const genericSuccess = { message: "Please check your inbox to confirm your subscription." };

async function hash(value) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200, origin = "") {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return Response.json(body, { status, headers });
}

function html(body, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ifuryst — Newsletter</title><style>body{font:18px/1.7 system-ui;max-width:560px;margin:12vh auto;padding:24px}button{font:inherit;padding:8px 20px;cursor:pointer}a{color:#067}</style><body>${body}<p><a href="https://www.ifuryst.com/">Back to the blog / 返回博客</a></p></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      },
    }
  );
}

async function takeQuota(db, bucket, maximum, expiresAt) {
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (bucket, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`
    )
    .bind(bucket, expiresAt, maximum)
    .first();
  return !!row;
}

async function resend(env, path, body, idempotencyKey, method = "POST", allowNotFound = false) {
  const headers = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(`https://api.resend.com/${path}`, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (response.status !== 429 || attempt === 2) break;
    const retry = Math.min(3000, Math.max(600, (Number(response.headers.get("Retry-After")) || 1) * 1000));
    await new Promise((resolve) => setTimeout(resolve, retry));
  }
  if (allowNotFound && response.status === 404) return null;
  if (response.status === 204) return {};
  if (!response.ok) {
    const error = new Error(`Resend API: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function subscribe(request, env, origin) {
  if (!env.DB || !env.RESEND_API_KEY) return json({ message: "Subscriptions are not configured yet." }, 503, origin);
  if (Number(request.headers.get("Content-Length") || 0) > 2048) return json({ message: "Request too large." }, 413, origin);
  const raw = await request.text();
  if (encoder.encode(raw).length > 2048) return json({ message: "Request too large." }, 413, origin);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ message: "Invalid request." }, 400, origin);
  }
  if (!input || typeof input !== "object") return json({ message: "Invalid request." }, 400, origin);
  // The invisible website field catches simple form bots without collecting extra reader data.
  if (input.website) return json(genericSuccess, 200, origin);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const language = input.language || "zh";
  if (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) || !["zh", "en", "both"].includes(language)) {
    return json({ message: "Please enter a valid email and language." }, 400, origin);
  }
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipBucket = `ip:${Math.floor(now / 3600)}:${await hash(ip)}`;
  if (!(await takeQuota(env.DB, ipBucket, 5, now + 3600))) return json({ message: "Please try again later." }, 429, origin);
  const existing = await env.DB.prepare("SELECT requested_at, email_sent_at FROM subscriptions WHERE email = ?").bind(email).first();
  if (existing && now - existing.requested_at < 300) {
    return existing.email_sent_at ? json(genericSuccess, 200, origin) : json({ message: "Please try again later." }, 503, origin);
  }
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await hash(token);
  // Updating an existing subscription requires confirmation, so a form submission cannot change preferences.
  const row = await env.DB.prepare(
    `INSERT INTO subscriptions (email, language, token_hash, expires_at, requested_at)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET language = excluded.language,
    token_hash = excluded.token_hash, expires_at = excluded.expires_at, requested_at = excluded.requested_at,
    confirmed_at = NULL, email_sent_at = NULL WHERE requested_at <= ? RETURNING email`
  )
    .bind(email, language, tokenHash, now + DAY, now, now - 300)
    .first();
  if (!row) return json(genericSuccess, 200, origin);
  const dayBucket = `daily:${Math.floor(now / DAY)}`;
  const maximum = Math.min(80, Math.max(1, Number(env.DAILY_CONFIRMATION_LIMIT) || 80));
  if (!(await takeQuota(env.DB, dayBucket, maximum, now + 2 * DAY))) {
    await env.DB.prepare("DELETE FROM subscriptions WHERE email = ? AND token_hash = ? AND confirmed_at IS NULL").bind(email, tokenHash).run();
    return json({ message: "Please try again tomorrow." }, 429, origin);
  }
  const link = `${new URL(request.url).origin}/confirm?token=${encodeURIComponent(token)}`;
  const english = language === "en";
  await resend(
    env,
    "emails",
    {
      from: env.EMAIL_FROM,
      reply_to: env.EMAIL_REPLY_TO,
      to: [email],
      subject: english ? "Confirm your subscription to ifuryst" : "确认订阅 ifuryst 的博客",
      html: `<p>${
        english ? "Please confirm that you want to receive new blog posts from ifuryst." : "请确认你希望通过邮件收到 ifuryst 的博客新文章。"
      }</p><p><a href="${link}">${english ? "Confirm subscription" : "确认订阅"}</a></p><p>${
        english
          ? "This link expires in 24 hours. If you did not request this, simply ignore this email."
          : "链接将在 24 小时后失效。如果不是你本人操作，请忽略这封邮件。"
      }</p>`,
      text: `${english ? "Confirm your subscription:" : "确认订阅："} ${link}\n${
        english ? "If you did not request this, ignore this email." : "如果不是你本人操作，请忽略这封邮件。"
      }`,
    },
    `confirmation-${tokenHash}`
  );
  await env.DB.prepare("UPDATE subscriptions SET email_sent_at = ? WHERE token_hash = ?").bind(now, tokenHash).run();
  return json(genericSuccess, 200, origin);
}

async function confirm(request, env) {
  if (!env.DB || !env.RESEND_API_KEY) return html("<h1>Subscriptions are not configured yet.</h1>", 503);
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!/^[a-f0-9-]{72}$/.test(token)) return html("<h1>Invalid confirmation link / 链接无效</h1>", 400);
  const tokenHash = await hash(token);
  const row = await env.DB.prepare("SELECT * FROM subscriptions WHERE token_hash = ?").bind(tokenHash).first();
  if (!row) return html("<h1>Invalid confirmation link / 链接无效</h1>", 400);
  if (row.confirmed_at) return html("<h1>Subscribed / 已订阅</h1><p>Thank you! / 谢谢你的订阅！</p>");
  if (row.expires_at < Math.floor(Date.now() / 1000))
    return html("<h1>Link expired / 链接已过期</h1><p>Please subscribe again from the blog. / 请回到博客重新订阅。</p>", 410);
  // GET only displays a button: email security scanners must not confirm subscriptions.
  if (request.method === "GET")
    return html(
      `<h1>Confirm subscription / 确认订阅</h1><form method="POST" action="/confirm?token=${token}"><button>Confirm / 确认</button></form>`
    );
  if (!env.SEGMENT_ZH_ID || !env.SEGMENT_EN_ID) return html("<h1>Please try again later / 请稍后重试</h1>", 503);
  const contactPath = `contacts/${encodeURIComponent(row.email)}`;
  const existing = await resend(env, contactPath, null, undefined, "GET", true);
  const contact = existing
    ? await resend(env, contactPath, { unsubscribed: false }, undefined, "PATCH")
    : await resend(env, "contacts", { email: row.email, unsubscribed: false });
  const contactId = contact.id || existing?.id;
  for (const [language, segment] of [
    ["zh", env.SEGMENT_ZH_ID],
    ["en", env.SEGMENT_EN_ID],
  ]) {
    const selected = row.language === "both" || row.language === language;
    await resend(env, `contacts/${contactId}/segments/${segment}`, null, undefined, selected ? "POST" : "DELETE", !selected);
  }
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO subscribers (email, language, confirmed_at, resend_contact_id)
    VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET language = excluded.language,
    confirmed_at = excluded.confirmed_at, resend_contact_id = excluded.resend_contact_id`
  )
    .bind(row.email, row.language, now, contactId)
    .run();
  await env.DB.prepare("UPDATE subscriptions SET confirmed_at = ?, resend_contact_id = ? WHERE token_hash = ?").bind(now, contactId, tokenHash).run();
  return html("<h1>Subscribed / 已订阅</h1><p>Thank you! New posts will arrive in your inbox. / 谢谢你的订阅！新文章会发送到你的邮箱。</p>");
}

export default {
  async scheduled(controller, env) {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
    await env.DB.prepare("DELETE FROM subscriptions WHERE expires_at < ?").bind(now).run();
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const origins = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const allowed = origins.includes(origin);
    if (url.pathname === "/health" && request.method === "GET")
      return json({
        ok: true,
        service: "ifuryst-newsletter",
        configured: !!(env.DB && env.RESEND_API_KEY && env.SEGMENT_ZH_ID && env.SEGMENT_EN_ID),
        publishing_configured: !!env.NEWSLETTER_PUBLISH_TOKEN,
      });
    if (url.pathname.startsWith("/admin/")) {
      try {
        return await publishing(request, env, resend, json);
      } catch {
        console.error("Newsletter publishing failed");
        return json({ message: "Publishing failed. Retry the existing publication." }, 503);
      }
    }
    if (url.pathname === "/subscribe") {
      if (!allowed) return json({ message: "Origin not allowed." }, 403);
      if (request.method === "OPTIONS")
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
            Vary: "Origin",
          },
        });
      if (request.method !== "POST") return json({ message: "Method not allowed." }, 405, origin);
    } else if (url.pathname === "/confirm") {
      if (!["GET", "POST"].includes(request.method)) return html("<h1>Method not allowed.</h1>", 405);
    } else return json({ message: "Not found." }, 404);
    try {
      return url.pathname === "/subscribe" ? await subscribe(request, env, origin) : await confirm(request, env);
    } catch (error) {
      // Never log email addresses, confirmation tokens, keys, or upstream response bodies.
      console.error(error.message?.startsWith("Resend ") ? error.message : "Newsletter request failed");
      return url.pathname === "/subscribe"
        ? json({ message: "Could not complete your request. Please try again later." }, 503, origin)
        : html("<h1>Please try again later / 请稍后重试</h1>", 503);
    }
  },
};
