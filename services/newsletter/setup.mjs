// Run after local review to configure production. Secrets are never written to files.
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

async function readSecret() {
  if (!process.stdin.isTTY) throw new Error("Run this in a terminal or provide RESEND_API_KEY in the environment.");
  process.stdout.write("Resend API key (hidden): ");
  const raw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      process.stdin.off("data", listener);
      process.stdin.setRawMode(raw);
      process.stdin.pause();
      process.stdout.write("\n");
      error ? reject(error) : resolve(value);
    };
    const listener = (bytes) => {
      for (const character of bytes.toString()) {
        if (character === "\u0003") {
          finish(new Error("Cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else value += character;
      }
    };
    process.stdin.on("data", listener);
  });
}

async function command(executable, args, secret) {
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: [secret ? "pipe" : "inherit", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${executable} exited ${code}`))));
    if (secret) child.stdin.end(secret);
  });
}

async function main() {
  const key = process.env.RESEND_API_KEY || (await readSecret());
  if (!/^re_[A-Za-z0-9_]+$/.test(key)) throw new Error("Invalid API key format");
  let lastRequest = 0;
  async function api(path, body) {
    const wait = Math.max(0, 600 - (Date.now() - lastRequest));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequest = Date.now();
    const response = await fetch(`https://api.resend.com/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Resend setup: HTTP ${response.status}`);
    return response.json();
  }
  const segments = [];
  let after = "";
  do {
    const page = await api(`segments?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`);
    segments.push(...page.data);
    after = page.has_more && page.data.length ? page.data.at(-1).id : "";
  } while (after);
  const configPath = resolve("services/newsletter/wrangler.jsonc");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  for (const language of ["zh", "en"]) {
    const name = `ifuryst-blog-${language}`;
    const segment = segments.find((item) => item.name === name) || (await api("segments", { name }));
    config.vars[`SEGMENT_${language.toUpperCase()}_ID`] = segment.id;
  }
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
  const publishToken = process.env.NEWSLETTER_PUBLISH_TOKEN || randomBytes(32).toString("hex");
  await command("wrangler", ["secret", "put", "RESEND_API_KEY", "--config", configPath], key);
  await command("wrangler", ["secret", "put", "NEWSLETTER_PUBLISH_TOKEN", "--config", configPath], publishToken);
  await command("gh", ["secret", "set", "NEWSLETTER_PUBLISH_TOKEN", "--repo", "iFurySt/ifuryst.github.io"], publishToken);
  await command("wrangler", ["d1", "migrations", "apply", "ifuryst-newsletter", "--remote", "--config", configPath]);
  await command("wrangler", ["deploy", "--config", configPath]);
  console.log("Worker deployed; matching publishing token stored in Worker and GitHub secrets. No newsletters were sent.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
