const encoder = new TextEncoder();

export async function authorized(request, env) {
  if (!env.NEWSLETTER_PUBLISH_TOKEN) return false;
  // Hash both inputs to avoid comparing the bearer token itself character by character.
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(request.headers.get("Authorization") || "")));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(`Bearer ${env.NEWSLETTER_PUBLISH_TOKEN}`)));
  return a.reduce((difference, value, index) => difference | (value ^ b[index]), 0) === 0;
}

function validEntry(entry) {
  return entry && /^[a-f0-9]{64}$/.test(entry.id) && ["zh", "en"].includes(entry.language);
}

const done = new Set(["baseline", "sent", "no_recipients"]);

export async function publishing(request, env, api, reply) {
  if (!(await authorized(request, env))) return reply({ message: "Unauthorized." }, 401);
  if (!env.DB) return reply({ message: "Database is not configured." }, 503);
  const path = new URL(request.url).pathname;
  if (path === "/admin/state" && request.method === "GET") {
    const initialized = await env.DB.prepare("SELECT value FROM newsletter_meta WHERE key = 'initialized'").bind().first();
    const rows = await env.DB.prepare("SELECT id, status FROM publications").bind().all();
    return reply({ initialized: !!initialized, publications: rows.results });
  }
  if (request.method !== "POST") return reply({ message: "Method not allowed." }, 405);
  const raw = await request.text();
  if (encoder.encode(raw).length > 200000) return reply({ message: "Request too large." }, 413);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return reply({ message: "Invalid request." }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  if (path === "/admin/baseline") {
    const initialized = await env.DB.prepare("SELECT value FROM newsletter_meta WHERE key = 'initialized'").bind().first();
    if (initialized) return reply({ message: "Baseline already activated." }, 409);
    if (!Array.isArray(input.entries) || !input.entries.length || input.entries.length > 20 || !input.entries.every(validEntry)) {
      return reply({ message: "Invalid baseline entries." }, 400);
    }
    await env.DB.batch(
      input.entries.map((entry) =>
        env.DB.prepare("INSERT OR IGNORE INTO publications (id, language, status, updated_at) VALUES (?, ?, 'baseline', ?)").bind(
          entry.id,
          entry.language,
          now
        )
      )
    );
    return reply({ baselined: input.entries.length });
  }
  if (path === "/admin/activate") {
    await env.DB.prepare("INSERT OR IGNORE INTO newsletter_meta (key, value) VALUES ('initialized', ?)").bind(String(now)).run();
    return reply({ initialized: true });
  }
  if (path !== "/admin/publish") return reply({ message: "Not found." }, 404);
  if (
    !validEntry(input) ||
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 500 ||
    typeof input.html !== "string" ||
    !input.html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}") ||
    typeof input.text !== "string" ||
    !input.text.includes("{{{RESEND_UNSUBSCRIBE_URL}}}") ||
    typeof input.url !== "string" ||
    !input.url.startsWith("https://www.ifuryst.com/") ||
    encoder.encode(input.html).length > 90000
  )
    return reply({ message: "Invalid publication." }, 400);
  if (!(await env.DB.prepare("SELECT value FROM newsletter_meta WHERE key = 'initialized'").bind().first())) {
    return reply({ message: "Initialize the historical baseline first." }, 409);
  }
  const old = await env.DB.prepare("SELECT * FROM publications WHERE id = ?").bind(input.id).first();
  if (old && done.has(old.status)) return reply({ id: input.id, status: old.status });
  const segmentId = input.language === "en" ? env.SEGMENT_EN_ID : env.SEGMENT_ZH_ID;
  if (!segmentId || !env.RESEND_API_KEY) return reply({ message: "Resend segments are not configured." }, 503);
  const claimed = await env.DB.prepare(
    `INSERT INTO publications (id, language, status, lease_until, updated_at)
    VALUES (?, ?, 'pending', ?, ?) ON CONFLICT(id) DO UPDATE SET lease_until = excluded.lease_until,
    updated_at = excluded.updated_at WHERE lease_until < ? AND status NOT IN ('baseline', 'sent', 'no_recipients') RETURNING *`
  )
    .bind(input.id, input.language, now + 120, now, now)
    .first();
  if (!claimed) return reply({ message: "Publication is already being processed. Retry later." }, 409);
  const update = async (status, broadcastId = claimed.broadcast_id) =>
    env.DB.prepare("UPDATE publications SET status = ?, broadcast_id = ?, updated_at = ? WHERE id = ?")
      .bind(status, broadcastId, now, input.id)
      .run();
  let phase = claimed.status;
  let broadcastId = claimed.broadcast_id;
  try {
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM subscribers WHERE language IN (?, 'both')").bind(input.language).first();
    if (!count.count && !claimed.broadcast_id) {
      await update("no_recipients");
      return reply({ id: input.id, status: "no_recipients" });
    }
    const name = `ifuryst-${input.id}`;
    if (!broadcastId && phase === "creating") {
      // Recover a create timeout using the deterministic broadcast name. Never create blindly.
      let after = "";
      for (let page = 0; page < 10; page++) {
        const list = await api(env, `broadcasts?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`, null, undefined, "GET");
        const found = list.data.find((broadcast) => broadcast.name === name);
        if (found) {
          broadcastId = found.id;
          break;
        }
        if (!list.has_more || !list.data.length) break;
        after = list.data.at(-1).id;
      }
      if (!broadcastId) return reply({ message: "An earlier create attempt has an unknown outcome. Inspect Resend before retrying." }, 409);
      await update("ready", broadcastId);
      phase = "ready";
    }
    if (!broadcastId) {
      phase = "creating";
      await update(phase);
      const draft = await api(env, "broadcasts", {
        name,
        segment_id: segmentId,
        from: env.EMAIL_FROM,
        subject: `[ifuryst] ${input.title}`,
        html: input.html,
        text: input.text,
        send: false,
      });
      if (!draft.id) throw new Error("Missing broadcast ID");
      broadcastId = draft.id;
      phase = "ready";
      await update(phase, broadcastId);
    }
    const current = await api(env, `broadcasts/${broadcastId}`, null, undefined, "GET");
    if (["sent", "queued", "scheduled", "sending"].includes(current.status)) {
      await update("sent", broadcastId);
      return reply({ id: input.id, status: "sent", broadcast_id: broadcastId });
    }
    if (current.status !== "draft" || phase === "sending") {
      return reply({ message: "An earlier send has an unknown outcome. Inspect the existing broadcast in Resend." }, 409);
    }
    phase = "sending";
    await update(phase, broadcastId);
    await api(env, `broadcasts/${broadcastId}/send`, {});
    await update("sent", broadcastId);
    return reply({ id: input.id, status: "sent", broadcast_id: broadcastId });
  } catch (error) {
    // A returned 4xx rejected the operation. A timeout may have succeeded; retain that phase.
    if (error.status >= 400 && error.status < 500 && phase === "creating") await update("pending", broadcastId);
    if (error.status >= 400 && error.status < 500 && phase === "sending") await update("ready", broadcastId);
    throw error;
  } finally {
    await env.DB.prepare("UPDATE publications SET lease_until = 0 WHERE id = ?").bind(input.id).run();
  }
}
