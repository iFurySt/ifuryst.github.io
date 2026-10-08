import { test } from "node:test";
import assert from "node:assert/strict";
import { database } from "./test-database.mjs";
import worker from "./worker.js";
import { syncNewsletter, waitForPublishedSite } from "../../.github/scripts/send-newsletter.mjs";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = "https://newsletter.example.com";
const origin = "https://www.ifuryst.com";
function subscription(input) {
  return new Request(`${base}/subscribe`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "127.0.0.1",
    },
    body: JSON.stringify(input),
  });
}
function environment(db) {
  return {
    DB: db,
    RESEND_API_KEY: "test-only",
    ALLOWED_ORIGINS: origin,
    EMAIL_FROM: "blog@example.com",
    DAILY_CONFIRMATION_LIMIT: "80",
    SEGMENT_ZH_ID: "zh-segment",
    SEGMENT_EN_ID: "en-segment",
    NEWSLETTER_PUBLISH_TOKEN: "test-admin-token",
  };
}

function admin(path, body) {
  return new Request(`${base}/admin/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: "Bearer test-admin-token", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function publication(number, language = "zh") {
  return {
    id: number.toString(16).padStart(64, "0"),
    language,
    title: "A test article",
    url: "https://www.ifuryst.com/blog/test/",
    html: '<p>Article</p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>',
    text: "Article\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}",
  };
}

function addSubscriber(db, language = "both") {
  db.sqlite.prepare("INSERT INTO subscribers VALUES (?, ?, ?, ?)").run("reader@example.com", language, 1, "reader-id");
}

function mockBroadcasts({ failCreate = false, failSend = false } = {}) {
  const broadcasts = [];
  let sends = 0;
  return {
    broadcasts,
    get sends() {
      return sends;
    },
    async fetch(url, options) {
      const path = new URL(url).pathname;
      if (path === "/broadcasts" && options.method === "POST") {
        const body = JSON.parse(options.body);
        if (body.name.length > 70) return Response.json({ message: "Broadcast name exceeds 70 characters" }, { status: 422 });
        broadcasts.push({ ...body, id: `broadcast-${broadcasts.length + 1}`, status: "draft" });
        if (failCreate) {
          failCreate = false;
          throw new Error("Simulated create timeout after acceptance");
        }
        return Response.json({ id: broadcasts.at(-1).id });
      }
      if (path === "/broadcasts" && options.method === "GET") return Response.json({ data: broadcasts, has_more: false });
      const broadcast = broadcasts.find((item) => path.startsWith(`/broadcasts/${item.id}`));
      if (!broadcast) return new Response("", { status: 404 });
      if (path.endsWith("/send")) {
        sends++;
        if (failSend) {
          failSend = false;
          throw new Error("Simulated ambiguous send timeout");
        }
        broadcast.status = "queued";
        return Response.json({ id: broadcast.id });
      }
      return Response.json(broadcast);
    },
  };
}

test("publishing is authenticated, baselines history, and sends each new language only once", async () => {
  const db = database();
  const env = environment(db);
  const api = mockBroadcasts();
  const original = globalThis.fetch;
  globalThis.fetch = api.fetch;
  const directory = await mkdtemp(join(tmpdir(), "newsletter-sync-"));
  try {
    assert.equal((await worker.fetch(new Request(`${base}/admin/state`), env)).status, 401);
    const old = publication(1);
    const fresh = publication(2, "en");
    await mkdir(join(directory, "newsletter/messages"), { recursive: true });
    const manifest = async (entries) => {
      await writeFile(join(directory, "newsletter/index.json"), JSON.stringify({ version: 1, entries }));
      for (const entry of entries) await writeFile(join(directory, "newsletter/messages", `${entry.id}.json`), JSON.stringify(entry));
    };
    const sync = () =>
      syncNewsletter({
        directory,
        endpoint: base,
        token: env.NEWSLETTER_PUBLISH_TOKEN,
        fetcher: (url, options) => worker.fetch(new Request(url, options), env),
        log: () => {},
      });
    await manifest([old]);
    assert.deepEqual(await sync(), { baselined: 1, published: 0 });
    assert.equal(api.broadcasts.length, 0);
    addSubscriber(db);
    await manifest([old, fresh]);
    assert.deepEqual(await sync(), { baselined: 0, published: 1 });
    assert.equal(api.broadcasts.length, 1);
    assert.equal(api.sends, 1);
    assert.equal(api.broadcasts[0].segment_id, "en-segment");
    assert.equal(api.broadcasts[0].send, false);
    fresh.title = "Edited title";
    await manifest([old, fresh]);
    assert.deepEqual(await sync(), { baselined: 0, published: 0 });
    assert.equal(api.sends, 1);
    assert.equal((await worker.fetch(admin("baseline", { entries: [old] }), env)).status, 409);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("create timeouts recover the existing draft instead of duplicating it", async () => {
  const db = database();
  const env = environment(db);
  addSubscriber(db);
  const api = mockBroadcasts({ failCreate: true });
  const original = globalThis.fetch;
  globalThis.fetch = api.fetch;
  try {
    await worker.fetch(admin("activate", {}), env);
    assert.equal((await worker.fetch(admin("publish", publication(3)), env)).status, 503);
    assert.equal(db.sqlite.prepare("SELECT status FROM publications").get().status, "creating");
    assert.equal((await worker.fetch(admin("publish", publication(3)), env)).status, 200);
    assert.equal(api.broadcasts.length, 1);
    assert.equal(api.sends, 1);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
  }
});

test("publishing waits for the exact live manifest and fails closed on stale deployments", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsletter-live-"));
  try {
    await mkdir(join(directory, "newsletter"));
    const manifest = JSON.stringify({ version: 1, entries: [publication(9)] });
    await writeFile(join(directory, "newsletter/index.json"), manifest);
    let attempts = 0;
    await waitForPublishedSite(directory, {
      attempts: 2,
      sleep: async () => {},
      fetcher: async () => new Response(++attempts === 1 ? "{}" : manifest),
    });
    assert.equal(attempts, 2);
    await assert.rejects(waitForPublishedSite(directory, { attempts: 1, fetcher: async () => new Response("{}") }), /No newsletter was sent/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an ambiguous send is not repeated; accepted sends reconcile from provider status", async () => {
  const db = database();
  const env = environment(db);
  addSubscriber(db);
  const api = mockBroadcasts({ failSend: true });
  const original = globalThis.fetch;
  globalThis.fetch = api.fetch;
  try {
    await worker.fetch(admin("activate", {}), env);
    assert.equal((await worker.fetch(admin("publish", publication(4)), env)).status, 503);
    assert.equal((await worker.fetch(admin("publish", publication(4)), env)).status, 409);
    assert.equal(api.sends, 1);
    api.broadcasts[0].status = "sent";
    assert.equal((await worker.fetch(admin("publish", publication(4)), env)).status, 200);
    assert.equal(api.sends, 1);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
  }
});

test("a simultaneous deploy cannot send twice and empty language lists are skipped", async () => {
  const db = database();
  const env = environment(db);
  addSubscriber(db, "en");
  const api = mockBroadcasts();
  const original = globalThis.fetch;
  let release;
  let started;
  const waiting = new Promise((resolve) => {
    started = resolve;
  });
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/send")) {
      started();
      await gate;
    }
    return api.fetch(url, options);
  };
  try {
    await worker.fetch(admin("activate", {}), env);
    const skipped = await worker.fetch(admin("publish", publication(5)), env);
    assert.equal((await skipped.json()).status, "no_recipients");
    const first = worker.fetch(admin("publish", publication(6, "en")), env);
    await waiting;
    assert.equal((await worker.fetch(admin("publish", publication(6, "en")), env)).status, 409);
    release();
    assert.equal((await first).status, 200);
    assert.equal(api.sends, 1);
  } finally {
    release();
    globalThis.fetch = original;
    db.sqlite.close();
  }
});

test("double opt-in uses real SQLite, scanners do not confirm, and confirmation is repeatable", async () => {
  const db = database();
  const env = environment(db);
  const sent = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (options.method === "GET") return new Response("", { status: 404 });
    sent.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : null });
    return Response.json({ id: "contact-or-email-id" });
  };
  try {
    assert.equal((await worker.fetch(subscription({ email: "reader@example.com", language: "en" }), env)).status, 200);
    assert.equal(sent.length, 1);
    assert.equal(db.sqlite.prepare("SELECT confirmed_at FROM subscriptions").get().confirmed_at, null);
    const confirmation = sent[0].body.text.match(/https:\/\/\S+/)[0];
    assert.equal((await worker.fetch(new Request(confirmation), env)).status, 200);
    assert.equal(sent.length, 1);
    assert.equal(db.sqlite.prepare("SELECT confirmed_at FROM subscriptions").get().confirmed_at, null);
    assert.equal((await worker.fetch(new Request(confirmation, { method: "POST" }), env)).status, 200);
    assert.equal(sent[1].url, "https://api.resend.com/contacts");
    assert.equal(sent[1].body.email, "reader@example.com");
    assert.equal(sent[2].method, "DELETE");
    assert.equal(sent[3].method, "POST");
    assert.ok(sent[3].url.endsWith("/segments/en-segment"));
    assert.ok(db.sqlite.prepare("SELECT confirmed_at FROM subscriptions").get().confirmed_at);
    assert.equal(db.sqlite.prepare("SELECT language FROM subscribers").get().language, "en");
    assert.equal((await worker.fetch(new Request(confirmation, { method: "POST" }), env)).status, 200);
    assert.equal(sent.length, 4);
    assert.equal((await worker.fetch(subscription({ email: "reader@example.com" }), env)).status, 200);
    assert.equal(sent.length, 4);
    assert.equal((await worker.fetch(new Request(`${base}/confirm?token=invalid`), env)).status, 400);
    const expired = crypto.randomUUID() + crypto.randomUUID();
    const digest = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(expired))).toString("hex");
    db.sqlite.prepare("UPDATE subscriptions SET token_hash = ?, confirmed_at = NULL, expires_at = 0").run(digest);
    assert.equal((await worker.fetch(new Request(`${base}/confirm?token=${expired}`, { method: "POST" }), env)).status, 410);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
  }
});

test("rejects foreign origins and invalid input, while honeypot does not send", async () => {
  const db = database();
  const env = environment(db);
  assert.equal(
    (await worker.fetch(new Request(`${base}/subscribe`, { method: "POST", headers: { Origin: "https://other.example" } }), env)).status,
    403
  );
  assert.equal((await worker.fetch(subscription(null), env)).status, 400);
  assert.equal((await worker.fetch(subscription({ email: "bad" }), env)).status, 400);
  assert.equal((await worker.fetch(subscription({ email: "reader@example.com", language: "xx" }), env)).status, 400);
  assert.equal((await worker.fetch(subscription({ email: "reader@example.com", website: "spam" }), env)).status, 200);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM subscriptions").get().count, 0);
  const preflight = await worker.fetch(new Request(`${base}/subscribe`, { method: "OPTIONS", headers: { Origin: origin } }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
  db.sqlite.close();
});

test("unconfirmed preference changes cannot modify a confirmed subscriber", async () => {
  const db = database();
  const env = environment(db);
  addSubscriber(db, "en");
  const original = globalThis.fetch;
  let message;
  const operations = [];
  globalThis.fetch = async (url, options) => {
    operations.push({ url, method: options.method });
    if (options.method === "GET") return Response.json({ id: "reader-id", unsubscribed: true });
    if (url.endsWith("/emails")) message = JSON.parse(options.body);
    return Response.json({ id: "reader-id" });
  };
  try {
    await worker.fetch(subscription({ email: "reader@example.com", language: "both" }), env);
    assert.equal(db.sqlite.prepare("SELECT language FROM subscribers").get().language, "en");
    const link = message.text.match(/https:\/\/\S+/)[0];
    assert.equal((await worker.fetch(new Request(link, { method: "POST" }), env)).status, 200);
    assert.equal(db.sqlite.prepare("SELECT language FROM subscribers").get().language, "both");
    assert.equal(operations.filter((item) => item.url.includes("/segments/") && item.method === "POST").length, 2);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
  }
});

test("daily budget caps confirmation email sends and upstream failures do not report success", async () => {
  const db = database();
  const env = { ...environment(db), DAILY_CONFIRMATION_LIMIT: "1" };
  const original = globalThis.fetch;
  let sent = 0;
  globalThis.fetch = async () => {
    sent++;
    return Response.json({ id: "email-id" });
  };
  try {
    assert.equal((await worker.fetch(subscription({ email: "one@example.com" }), env)).status, 200);
    assert.equal((await worker.fetch(subscription({ email: "two@example.com" }), env)).status, 429);
    assert.equal(sent, 1);
    globalThis.fetch = async () => new Response("", { status: 401 });
    const now = Math.floor(Date.now() / 1000);
    db.sqlite.prepare("DELETE FROM rate_limits WHERE bucket = ?").run(`daily:${Math.floor(now / 86400)}`);
    assert.equal((await worker.fetch(subscription({ email: "three@example.com" }), env)).status, 503);
    assert.equal((await worker.fetch(subscription({ email: "three@example.com" }), env)).status, 503);
  } finally {
    globalThis.fetch = original;
    db.sqlite.close();
  }
});
