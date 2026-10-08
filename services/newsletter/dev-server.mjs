// Local-only browser harness: in-memory database and fake Resend, never real email.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import worker from "./worker.js";
import { database } from "./test-database.mjs";

const root = resolve(process.argv[2] || "/tmp/ifuryst-newsletter-site");
const port = Number(process.env.NEWSLETTER_DEV_PORT || 8787);
const db = database();
const env = {
  DB: db,
  RESEND_API_KEY: "local-fake-key",
  ALLOWED_ORIGINS: `http://127.0.0.1:${port},http://localhost:${port},http://127.0.0.1:8081,http://localhost:8081`,
  EMAIL_FROM: "ifuryst <letters@ifuryst.com>",
  SEGMENT_ZH_ID: "local-zh",
  SEGMENT_EN_ID: "local-en",
  NEWSLETTER_PUBLISH_TOKEN: "local-test-token",
};
let lastMail;
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (!String(url).startsWith("https://api.resend.com/")) return nativeFetch(url, options);
  if (options.method === "GET") return new Response("", { status: 404 });
  if (String(url).endsWith("/emails")) lastMail = JSON.parse(options.body);
  return Response.json({ id: "local-fake-id" });
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/__test/mail") {
      const link = lastMail?.text.match(/http:\/\/\S+/)?.[0];
      outgoing.setHeader("Content-Type", "text/html; charset=utf-8");
      outgoing.end(
        link
          ? `<h1>Local test inbox</h1><p>Fake confirmation email; nothing was sent.</p><a href="${link}">Confirm test subscription</a>`
          : "<h1>Local test inbox</h1><p>No messages yet.</p>"
      );
      return;
    }
    if (url.pathname === "/__test/state") {
      outgoing.setHeader("Content-Type", "application/json");
      outgoing.end(JSON.stringify({ confirmed: db.sqlite.prepare("SELECT COUNT(*) AS count FROM subscribers").get().count }));
      return;
    }
    if (["/subscribe", "/confirm", "/health"].includes(url.pathname) || url.pathname.startsWith("/admin/")) {
      const chunks = [];
      for await (const chunk of incoming) chunks.push(chunk);
      const request = new Request(url, {
        method: incoming.method,
        headers: incoming.headers,
        body: ["GET", "HEAD"].includes(incoming.method) ? undefined : Buffer.concat(chunks),
      });
      const response = await worker.fetch(request, env);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let file = resolve(root, "." + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      outgoing.writeHead(403);
      outgoing.end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    outgoing.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    outgoing.end(await readFile(file));
  } catch {
    outgoing.writeHead(404);
    outgoing.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Local newsletter preview: http://127.0.0.1:${port} (fake Resend, in-memory DB)`));
