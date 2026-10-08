# Blog newsletter

Node.js 24 is required for the SQLite-backed tests and local browser harness.
The Jekyll renderer uses Nokogiri, already available through the site's bundle.

## Architecture

- The Jekyll form submits to the Cloudflare Worker. A confirmation email expires
  after 24 hours; GET shows a button and POST confirms consent. Scanner visits
  do not subscribe readers. Resend Contacts join the dedicated
  `ifuryst-blog-zh` / `ifuryst-blog-en` segments; `both` joins both.
- D1 stores pending confirmations, confirmed language preferences, short-lived
  request counters, and publication IDs. Public endpoints never expose readers.
- `_plugins/newsletter.rb` extracts the rendered article body after Liquid and
  Markdown. It writes `newsletter/index.json` and email JSON into the built site.
  These contain only already-public articles, with absolute links, inline email
  styles, image fallbacks, plain text, and Resend unsubscribe placeholders.
- The deployment job waits for the exact manifest to appear on `www.ifuryst.com`,
  then calls authenticated Worker endpoints. Initial activation baselines every
  current article without sending. Later deployments send each new file/language
  once. Corrections and URL/translation-key changes do not resend. A file rename
  is a new identity.
- Resend Broadcasts target the relevant dedicated segment and honor unsubscribe
  status. D1 preferences alone are not used to decide whether to send to a reader.
- The Worker claims each publication with a D1 lease, creates a draft, saves its
  ID, and sends that exact draft. A create timeout recovers by deterministic
  broadcast name. An ambiguous send checks provider status; it never blindly
  resends a draft after a timeout. Unresolved outcomes stop CI for inspection.
- With no confirmed readers for a language, that article is marked skipped;
  future subscribers do not receive the backlog.

Long articles keep complete top-level blocks up to 65 KB and link to the original.
Videos become links; scripts and interactive content are removed. Browser-only
math/diagrams may need reading in the original article. Set `newsletter: false`
in a post to exclude it. Translation notes and the author's prose are preserved.

## Local verification

```sh
npm test --prefix services/newsletter
bundle exec ruby services/newsletter/renderer.test.rb
```

For a browser preview, create a temporary override outside the repository:

```yaml
newsletter:
  enabled: true
  provider: resend
  endpoint: http://127.0.0.1:8787/subscribe
  site_url: https://www.ifuryst.com
```

```sh
bundle exec jekyll build --config _config.yml,_config.no-imagemagick.yml,/tmp/ifuryst-newsletter-local.yml --destination /tmp/ifuryst-newsletter-site
node services/newsletter/dev-server.mjs /tmp/ifuryst-newsletter-site
```

Visit http://127.0.0.1:8787/ and subscribe with an example address. Fake inbox:
`/__test/mail`; confirmed count: `/__test/state`. This server binds only to
loopback, uses an in-memory database, and never sends real mail. Set
`NEWSLETTER_DEV_PORT=8788` to use another port, and use that same port in
the temporary Jekyll endpoint override. It also accepts the Docker preview
origins `http://localhost:8081` and `http://127.0.0.1:8081`; production
Worker origins remain restricted to the published blog domains. Tests cover
initialization, language targeting, corrections, concurrency, create/send
failures, and stale deployments. Node's SQLite module is experimental.

## First production setup (before pushing the enabled UI)

Worker: `ifuryst-newsletter`; D1: `ifuryst-newsletter`.
Endpoint: https://ifuryst-newsletter.ifuryst.workers.dev/subscribe.
Sender: `ifuryst <letters@ifuryst.com>`; replies: `ifuryst@gmail.com`.

Wrangler and `gh` must be logged into the intended Cloudflare account and
`iFurySt/ifuryst.github.io`. Run from the repository root:

```sh
node services/newsletter/setup.mjs
```

The hidden prompt accepts a Resend key with email, Contacts, Segments, and
Broadcasts access. Setup creates/reuses the two blog segments, writes their
non-secret IDs to Wrangler config, stores `RESEND_API_KEY` and a random
`NEWSLETTER_PUBLISH_TOKEN` as Worker secrets, saves the matching token in GitHub
Actions secrets, applies migrations, and deploys the Worker. It sends no
newsletters. Review and commit the updated segment IDs with the source. The
first subsequent site deployment baselines all current articles without sending.

After deployment, test email delivery with a real mailbox. Local fake-Resend tests
do not prove inbox delivery. For later manual Worker updates:

```sh
wrangler d1 migrations apply ifuryst-newsletter --remote --config services/newsletter/wrangler.jsonc
wrangler deploy --config services/newsletter/wrangler.jsonc
```

The optional **Deploy newsletter Worker** workflow is manual. To use it, add a
scoped `CLOUDFLARE_API_TOKEN` GitHub secret for Workers Scripts and D1 on the
configured account. Worker code is not deployed by the Jekyll workflow. Never
copy local OAuth credentials into GitHub.

## Secrets, limits, and recovery

Source, migrations, tests, account/database/segment IDs, and public endpoints
may be committed. Keys, bearer tokens, `.dev.vars`, `.env*`, `.wrangler/`, SQLite
files, and subscriber exports must not be committed. `services/` is excluded
from Jekyll output. Subscriber data stays in D1/Resend.

CORS is not authentication. Signup uses a honeypot, a five-minute email cooldown,
five requests per IP per hour, and 80 confirmation attempts per UTC day. Other
uses of the Resend account share its allowance. Failures consume quota
conservatively. Daily cleanup removes expired data. Every `/admin/` endpoint
requires authentication. `/health` reports configuration, not delivery or quotas.

If CI reports an unknown outcome, inspect the existing Resend Broadcast and D1
publication row before retrying. Queued/sent/scheduled messages are reconciled
without another send. Do not delete publication history or reset initialization
in production without deciding how to treat previous articles.

Rotate the Resend secret through the hidden prompt, without pasting it into chat:

```sh
wrangler secret put RESEND_API_KEY --config services/newsletter/wrangler.jsonc
```
