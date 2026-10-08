import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

export async function waitForPublishedSite(
  directory,
  { fetcher = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 30 } = {}
) {
  const expected = createHash("sha256")
    .update(await readFile(resolve(directory, "newsletter/index.json")))
    .digest("hex");
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetcher(`https://www.ifuryst.com/newsletter/index.json?deployment=${Date.now()}`, {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (
        response.ok &&
        createHash("sha256")
          .update(await response.text())
          .digest("hex") === expected
      )
        return;
    } catch {
      /* GitHub Pages may still be publishing the new deployment. */
    }
    if (attempt + 1 < attempts) await sleep(10000);
  }
  throw new Error("The new website manifest is not live yet. No newsletter was sent; rerun after Pages finishes publishing.");
}

export async function syncNewsletter({ directory, endpoint, token, fetcher = fetch, log = console.log }) {
  if (!token) throw new Error("NEWSLETTER_PUBLISH_TOKEN is required");
  const root = resolve(directory, "newsletter");
  const manifest = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.entries)) throw new Error("Invalid newsletter manifest");
  for (const entry of manifest.entries) {
    if (!/^[a-f0-9]{64}$/.test(entry.id) || !["zh", "en"].includes(entry.language)) throw new Error("Invalid manifest entry");
  }
  const url = new URL(endpoint);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("HTTPS is required");
  async function request(path, body) {
    const response = await fetcher(new URL(path, url), {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) throw new Error(`Newsletter ${path}: HTTP ${response.status}. Inspect Worker/Resend before retrying.`);
    return response.json();
  }
  const state = await request("/admin/state");
  if (!state.initialized) {
    for (let start = 0; start < manifest.entries.length; start += 20) {
      await request("/admin/baseline", { entries: manifest.entries.slice(start, start + 20).map(({ id, language }) => ({ id, language })) });
    }
    await request("/admin/activate", {});
    log(`Initialized ${manifest.entries.length} historical articles; no emails sent.`);
    return { baselined: manifest.entries.length, published: 0 };
  }
  const completed = new Set(state.publications.filter((row) => ["baseline", "sent", "no_recipients"].includes(row.status)).map((row) => row.id));
  let published = 0;
  for (const entry of manifest.entries) {
    if (completed.has(entry.id)) continue;
    const message = JSON.parse(await readFile(join(root, "messages", `${entry.id}.json`), "utf8"));
    if (message.id !== entry.id || message.language !== entry.language) throw new Error("Publication identity mismatch");
    const result = await request("/admin/publish", message);
    log(`${entry.language} ${entry.id.slice(0, 12)}: ${result.status}`);
    published++;
  }
  return { baselined: 0, published };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = process.env.NEWSLETTER_SITE_DIRECTORY || "_site";
  const run = async () => {
    if (!process.env.NEWSLETTER_PUBLISH_TOKEN) throw new Error("Configure NEWSLETTER_PUBLISH_TOKEN in GitHub Actions secrets before publishing.");
    if (process.env.NEWSLETTER_VERIFY_LIVE === "true") await waitForPublishedSite(directory);
    return syncNewsletter({
      directory,
      endpoint: process.env.NEWSLETTER_ENDPOINT || "https://ifuryst-newsletter.ifuryst.workers.dev",
      token: process.env.NEWSLETTER_PUBLISH_TOKEN,
    });
  };
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
