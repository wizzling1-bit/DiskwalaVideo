# 02 — Technical Requirements Document (TRD)

## 1. Purpose and architecture decision

This document defines the technical approach for a single-page Astro website on Cloudflare Pages, with narrowly scoped server-side endpoints for provider resolution and Telegram membership verification.

**Recommended topology:**

- **Astro static frontend:** emits the landing page, guide sections, FAQ, metadata, and accessible UI shell.
- **Cloudflare Pages Functions:** same-origin `/api/*` endpoints for membership handshake, server-side Telegram checks, supported-link resolution, rate limiting, and normalized API responses.
- **Cloudflare D1:** optional but recommended for short-lived verification nonce/session association and minimal abuse-control state. Do not use it to store user media links or history by default.
- **Telegram Bot API:** server-to-server membership check and bot deep-link handshake. Bot token stays in a secret binding.
- **Provider adapters:** separate modules for the approved Diskwala and Flezen source families. Each adapter must be enabled only after feasibility, policy, and fixture testing.

The public experience remains free and has no website account system. “No login” means no website username/password/account; it does not remove the technical requirement to establish a trusted Telegram user identity if membership must be verified strictly.

## 2. Deployment compatibility note

Astro's static output does not require an Astro server adapter. Cloudflare's Astro/Pages guide lists `npm run build` and `dist` as the normal Pages configuration for an Astro site: [Cloudflare Astro Pages deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/). Cloudflare Pages Functions can run server-side code in a root-level `/functions` directory and bind services such as D1: [Pages Functions](https://developers.cloudflare.com/pages/functions/).

Use `output: 'static'` unless a concrete requirement needs Astro on-demand rendering. Keep `/functions` at repository root (not inside `dist`). Do not blindly install an Astro Cloudflare adapter just to deploy static HTML. Re-check the official framework guide at implementation time because Cloudflare's platform and adapter guidance can change.

## 3. Proposed technology stack

| Layer | Choice | Reason / constraint |
|---|---|---|
| Framework | Astro (static output) | Content-rich landing page with minimal client-side JavaScript and good HTML output |
| Language | TypeScript | Typed provider adapters and API contracts |
| Styling | CSS custom properties + component-scoped/global CSS | Low runtime overhead; tokenized design system |
| Interactive islands | Small vanilla TypeScript modules or minimal Astro client directives | Input validation, modal, FAQ, player result states; avoid shipping a full SPA unless justified |
| Hosting/CDN | Cloudflare Pages | Static asset hosting and deploy previews |
| API | Cloudflare Pages Functions | Same-origin endpoints; no separate server to maintain |
| State/nonce storage | Cloudflare D1 for expiring verification records; avoid DB if using a proven stateless/token design | Nonce association and replay prevention require server-side state or signed state plus one-time consumption |
| Membership integration | Telegram Bot API | Server-side verification, bot deep-link association |
| Validation | URL parser + explicit hostname and path allowlists; shared schema validation library only if needed | Avoid permissive URL and payload parsing |
| Tests | Vitest for unit tests; Playwright for end-to-end smoke tests; axe-core or equivalent for accessibility | Adapter fixtures, UI flows, and regression coverage |
| Quality gates | ESLint, TypeScript typecheck, formatting, build | Catch defects before deploy |
| Version control/CI | GitHub + Cloudflare Pages Git integration | Preview deployments and deploy-on-merge workflow |

Prefer current stable versions compatible with each other at implementation time. Pin dependencies in the lockfile; do not specify stale version numbers in the PRD or auto-upgrade major versions during launch without validation.

## 4. Repository layout

Suggested structure (adapt paths if the project template differs):

```text
/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── og-cover.png
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── LinkForm.astro
│   │   ├── TelegramGate.astro
│   │   ├── MediaResult.astro
│   │   ├── ProviderCard.astro
│   │   ├── StepList.astro
│   │   └── FaqAccordion.astro
│   ├── content/                  # approved single-page copy or data
│   ├── layouts/BaseLayout.astro
│   ├── pages/index.astro
│   ├── scripts/
│   │   ├── link-form.ts
│   │   ├── telegram-gate.ts
│   │   └── faq.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── components.css
│   └── utils/
│       ├── host-allowlist.ts
│       ├── safe-filename.ts
│       └── api-client.ts
├── functions/
│   └── api/
│       ├── gate/start.ts
│       ├── gate/status.ts
│       ├── telegram/webhook.ts
│       └── resolve.ts
├── server/                       # pure server-side logic imported by Functions
│   ├── telegram/
│   │   ├── client.ts
│   │   ├── membership.ts
│   │   └── tokens.ts
│   ├── providers/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── diskwala.ts
│   │   └── flezen.ts
│   ├── security/
│   │   ├── rate-limit.ts
│   │   ├── validate-url.ts
│   │   └── response.ts
│   └── config.ts
├── tests/
│   ├── fixtures/
│   ├── unit/
│   └── e2e/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── wrangler.toml                 # or Cloudflare's current equivalent config
└── README.md
```

**Boundary rule:** client files must not import server-side provider/Telegram modules. Secret-bearing code must only be referenced by Functions/server modules.

## 5. Runtime architecture

### 5.1 Landing page

`src/pages/index.astro` renders semantic HTML at build time. The hero form, gate modal, result state, and FAQ can be progressively enhanced by small client modules. Core headings, guide copy, support list, privacy note, and footer remain visible if JavaScript is disabled.

### 5.2 Public API

The frontend uses same-origin endpoints to avoid unnecessary CORS configuration:

- `POST /api/gate/start` — create a short-lived gate session/nonce and produce the configured Telegram bot deep link.
- `GET /api/gate/status?session=<opaque-token>` — return waiting/verified/expired status. Token must be scoped, high entropy, short-lived, and never be a user ID or Telegram bot token.
- `POST /api/telegram/webhook` — Telegram bot webhook handler to associate a valid `start` payload with the Telegram user who started the bot. Validate webhook authenticity using Telegram's configured webhook secret/token mechanism and do not trust arbitrary requests.
- `POST /api/resolve` — validate the current verification grant and supported source URL, run the appropriate provider adapter, return a normalized result.
- Optional `POST /api/gate/verify` — explicitly ask the backend to check membership for an already-associated Telegram user/session. The backend, not the browser, calls Telegram's membership API.

Avoid putting the raw source URL, Telegram identifier, or media URL into query parameters, logs, browser history, or analytics. Send source links in a POST body over HTTPS.

### 5.3 High-level sequence

1. Browser validates URL syntax and detects a supported host for helpful UX.
2. On submit, browser requests `POST /api/gate/start`.
3. API creates a random session ID/nonce with an expiry (recommended starting range: 5–10 minutes) and returns the bot deep link. Session data stores only the minimum fields required to complete the challenge.
4. Browser opens the Telegram channel URL and bot deep link, or guides the visitor through them in a clear sequence. Bot receives the opaque `start` payload and associates it with the Telegram numeric user ID on the server.
5. Browser polls gate status with a conservative interval and hard timeout, or user presses Verify. Server calls Telegram Bot API `getChatMember` for the configured channel and user ID, then marks the session verified only when the returned status meets the product's membership rule.
6. Browser sends the source URL to `POST /api/resolve` along with a short-lived verification grant or session cookie/token.
7. API validates origin, CSRF posture if cookies are used, schema, rate limits, URL host, path, and resolver policy before dispatching to an adapter.
8. Adapter normalizes the result, removes internal fields/tokens, and returns the allowed actions.
9. Browser renders result/player/download controls. No content is automatically played or downloaded.

### 5.4 Membership flow caveat

A channel URL and “I have joined” button are not enough for strict verification. The backend needs the visitor's Telegram numeric user ID from an approved authentication/association flow, plus a bot configuration that can query the target channel. Telegram deep links support a `start` parameter (documented at [Telegram bot links](https://core.telegram.org/api/links)). Keep that parameter opaque, random, short-lived, and one-time. Never ask the user to type a Telegram ID into a free-form field and treat it as proof of identity.

If Telegram does not provide sufficient identity/member data for the chosen flow, stop strict gating and either redesign the flow or obtain explicit approval for a clearly labeled, non-enforced self-attestation gate. Do not claim strict verification in the latter case.

## 6. Configuration and secrets

Suggested server-side settings (names are examples; do not commit actual values):

| Setting / binding | Purpose | Exposure |
|---|---|---|
| `PUBLIC_SITE_URL` | Approved public origin, used for canonical/session return URLs | Build/public URL only |
| `PUBLIC_TELEGRAM_CHANNEL_URL` | Channel join destination | Public |
| `PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username for deep link | Public |
| `TELEGRAM_BOT_TOKEN` | Bot API calls and webhook handling | Secret binding only |
| `TELEGRAM_CHANNEL_ID` | Numeric or supported channel identifier for member lookup | Server-side configuration; treat as non-public operational config |
| `TELEGRAM_WEBHOOK_SECRET` | Authenticate/guard webhook requests | Secret binding only |
| `SESSION_SIGNING_SECRET` | Sign scoped short-lived state/grants if used | Secret binding only |
| D1 binding, e.g. `DB` | Nonce/session mapping and expiry | Server only |
| `PROVIDER_DISKWALA_ENABLED` | Feature flag after validation | Server config |
| `PROVIDER_FLEZEN_ENABLED` | Feature flag after validation | Server config |
| `RATE_LIMIT_*` | Tunable resolver and gate rate limits | Server config |

Do not expose private variables with public build prefixes. If the platform requires a public environment variable convention, only the explicitly public channel URL and bot username may be public. Bot tokens and signing secrets must never be included in `import.meta.env` values rendered to the client.

## 7. API contracts

Use `application/json`, validate payload schema server-side, and return a stable `requestId` for support/debugging without exposing internal traces. Response examples below are contracts, not live provider behavior.

### 7.1 `POST /api/gate/start`

Request:

```json
{}
```

Response `200`:

```json
{
  "sessionToken": "opaque-short-lived-token",
  "botDeepLink": "https://t.me/configured_bot?start=opaque_nonce",
  "channelUrl": "https://t.me/configured_channel",
  "expiresAt": "ISO-8601 timestamp"
}
```

Rules:
- Create the session server-side with a cryptographically strong random nonce.
- Never encode the source URL in the Telegram `start` payload.
- Apply origin protections, rate limiting, and expiration.
- Do not create a session for every keystroke; only on explicit submit.

### 7.2 `GET /api/gate/status`

Response variants:

```json
{ "status": "waiting", "expiresAt": "ISO-8601 timestamp" }
```

```json
{ "status": "verified", "grant": "short-lived-scoped-grant", "expiresAt": "ISO-8601 timestamp" }
```

```json
{ "status": "not_member", "retryable": true }
```

```json
{ "status": "expired", "retryable": true }
```

Do not return Telegram numeric IDs, channel internal data, bot responses, or secret values.

### 7.3 `POST /api/resolve`

Request:

```json
{
  "url": "https://approved-provider.example/approved-share-pattern",
  "intent": "watch"
}
```

`intent` is either `watch` or `download`. The example hostname above is illustrative; production requests must use configured supported providers.

Normalized success response:

```json
{
  "provider": "diskwala",
  "status": "ready",
  "title": "Safe display title when available",
  "fileName": "example.mp4",
  "mimeType": "video/mp4",
  "fileSizeBytes": null,
  "capabilities": {
    "watch": true,
    "download": true
  },
  "media": {
    "kind": "stream",
    "url": "short-lived-authorized-url"
  },
  "expiresAt": "ISO-8601 timestamp or null",
  "requestId": "non-sensitive-request-id"
}
```

Notes:
- Return only fields that are known and supported. `fileSizeBytes`, `title`, or one capability may be omitted/null where unavailable.
- If a signed URL is returned, document its lifetime and re-resolution path.
- If media must be served through an API endpoint, use a bounded, reviewed streaming/redirect design; do not make a generic proxy endpoint.
- Do not expose upstream cookies, authorization headers, session keys, parser traces, or provider error bodies.

Error response:

```json
{
  "error": {
    "code": "UNSUPPORTED_LINK",
    "message": "This link type is not supported yet.",
    "retryable": false
  },
  "requestId": "non-sensitive-request-id"
}
```

Recommended error codes: `INVALID_URL`, `UNSUPPORTED_HOST`, `UNSUPPORTED_LINK`, `GATE_REQUIRED`, `GATE_EXPIRED`, `MEMBERSHIP_NOT_VERIFIED`, `PROVIDER_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, `MEDIA_UNAVAILABLE`, `WATCH_UNAVAILABLE`, `DOWNLOAD_UNAVAILABLE`, `RATE_LIMITED`, `TIMEOUT`, `INTERNAL_ERROR`.

### 7.4 HTTP status policy

- `200`: successful status or resolver response, including defined non-error states.
- `400`: malformed JSON or malformed URL.
- `401`/`403`: missing or invalid verification grant; use a consistent policy and do not leak membership detail unnecessarily.
- `404`: unsupported API route or resource; do not use it to disclose private upstream details.
- `413`: body is too large.
- `422`: well-formed but unsupported URL/pattern.
- `429`: rate limited; include `Retry-After` when appropriate.
- `502`/`503`/`504`: upstream/provider unavailable or timeout.
- `500`: unexpected internal failure with a request ID.

## 8. Provider adapter design

### 8.1 Adapter interface

```ts
export type ResolveIntent = 'watch' | 'download';

export interface ResolveInput {
  url: URL;
  intent: ResolveIntent;
}

export interface MediaResolution {
  provider: 'diskwala' | 'flezen';
  title?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  watchUrl?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface ProviderAdapter {
  readonly id: 'diskwala' | 'flezen';
  canHandle(url: URL): boolean;
  validateUrl(url: URL): void;
  resolve(input: ResolveInput, context: ServerContext): Promise<MediaResolution>;
}
```

The actual implementation may use a richer discriminated union. Keep this seam; do not blend provider-specific HTML parsing into the UI.

### 8.2 Feasibility spike — mandatory before enabling an adapter

For each source family, the engineer must:
1. Collect at least 5 owner-authorized or otherwise appropriate test URLs covering valid, malformed, expired, removed, and unusual-path cases.
2. Document exact allowed hostnames and path patterns. Avoid a hostname-only allowlist if a host provides multiple unrelated features.
3. Confirm a permitted and stable resolution approach (documented/public API, provider-approved link, or an approved direct-link method that does not bypass access controls).
4. Inspect CORS behavior, signed URL expiry, redirects, file-size metadata, codec/MIME types, and mobile playback.
5. Check whether direct download requires session cookies or authentication. Do not reuse private cookies from another account or defeat such controls.
6. Record limits/rate policies and implement conservative rate limiting.
7. Add unit fixtures and end-to-end tests that mock provider responses.
8. If no compliant reliable path exists, leave the adapter disabled and surface the provider as “coming later” or remove it from “supported” copy.

### 8.3 Redirect and outbound request safety

- Do not fetch any URL simply because the user pasted it.
- Parse the URL with a standards-compliant URL parser and require `https:` by default; allow `http:` only if the owner explicitly approves and it is necessary.
- Require exact, normalized hostname membership. Reject usernames/passwords embedded in the URL, localhost names, private/link-local IPs, IPv6 local ranges, non-default ports unless explicitly approved, and malformed IDN/lookalike domains.
- Prevent DNS rebinding and SSRF by restricting outbound destinations at every redirect hop and refusing private/reserved IP destinations.
- Follow only a small, defined number of redirects and revalidate each `Location` target against the allowed policy.
- Use short timeouts, response size bounds for metadata fetches, and accepted content types.
- Never provide a general `fetch?url=` endpoint or proxy arbitrary bytes.
- Do not run user-supplied code, shell commands, or arbitrary parser expressions.

## 9. Telegram membership implementation

### 9.1 Preconditions

- Product owner provides the real channel URL/username and the channel identifier accepted by Telegram API calls.
- Product owner provides/configures the bot identity.
- Bot is configured with the permissions necessary for member checks according to current Telegram documentation.
- Test cases include a confirmed member, a non-member, a user who leaves after verification, a blocked bot, an expired nonce, duplicate nonce use, and Telegram API timeout.

### 9.2 State model

Possible session states:

`created → awaiting_telegram → identity_linked → checking_membership → verified → consumed`

Alternative terminal states:

`expired`, `not_member`, `verification_error`, `revoked`.

- Recommended session TTL: 5–10 minutes for the initial association challenge.
- Recommended verified grant TTL: short (e.g., 5–15 minutes) and scoped to a resolve attempt. Confirm exact duration with product owner after abuse testing.
- Store only nonce hash if practical, session state, Telegram numeric user ID for the short verification window, creation/expiry timestamps, and minimal request metadata for security.
- Purge expired rows using scheduled cleanup where available or lazy cleanup.
- If the app only verifies when resolving, check current membership at the time of each new resolve attempt; do not assume historical verification means current membership indefinitely.

### 9.3 Bot webhook security

- Validate Telegram webhook secret headers/current recommended configuration.
- Reject oversized, malformed, unauthenticated, or replayed payloads.
- Accept only expected `/start <opaque_nonce>` payloads for browser association.
- Do not echo the nonce or user ID into public logs.
- Store the association atomically; consume a nonce at most once.
- Handle bot messages idempotently.

### 9.4 API errors and user messaging

- `not_member`: “We couldn’t confirm that your Telegram account has joined the channel. Join the channel and verify again.”
- `verification_error`: “Telegram verification is temporarily unavailable. Your link has not been processed. Try again shortly.”
- `expired`: “This verification session expired. Start again to continue.”
- `identity_link_missing`: “Open the verification bot using the button in this page, then return here.”

Do not expose raw Telegram API responses or channel membership details to the browser.

## 10. File transfer and playback design

### Playback
- Prefer exposing a short-lived provider-authorized stream URL when that is permitted and works in supported browsers.
- Validate MIME type and source host before assigning URL to a media element.
- If a source requires protected cookies or a provider session, do not try to emulate or bypass the session. Display unsupported/unavailable status.
- Keep media unmounted/unrequested until the user clicks **Watch online**, not merely when the result card appears.
- Use native `<video controls playsinline preload="metadata">` unless the provider's stream format requires a tested specialized player.

### Downloads
- Prefer provider-issued direct URLs/redirects that are allowed by the source and keep the browser responsible for file transfer.
- If a Pages Function has to relay data, first validate platform response-size/streaming limits and cancellation behavior; never `arrayBuffer()` an entire large video into memory.
- If redirects are used, confirm they do not leak short-lived tokenized URLs into application logs and that the expiry is long enough for the normal user action.
- Sanitize filenames; strip path separators, control characters, CR/LF, and unsafe quoted header characters.
- Support unknown file size; do not fabricate estimates.
- If a browser blocks download due to cross-origin `Content-Disposition` or source policy, display guidance rather than creating an infinite retry loop.

## 11. Data handling and privacy

### Do not collect by default
- Website username/password; none exists.
- Full link history.
- Media files.
- Raw direct media URLs in analytics.
- Telegram bot tokens or full Telegram API output in logs.

### Minimal operational data
- Short-lived gate session/nonce state.
- Telegram numeric ID only as needed to verify membership and only for the defined short-lived purpose.
- Request IDs, coarse response category, timestamp, latency, and privacy-safe rate-limit keys if necessary.

### Retention
- Set and document exact expiry values before launch.
- Expire session data automatically; clean up stale D1 rows.
- Add a privacy contact/report destination before launch.
- Review Cloudflare, error-monitoring, and analytics logs for accidental URL/token capture.

## 12. Security requirements checklist

- [ ] HTTPS enforced; HSTS only after HTTPS setup and subdomain strategy are final.
- [ ] Strict outbound hostname/path allowlist and redirect validation.
- [ ] SSRF controls for private and reserved IP ranges.
- [ ] Request body size limit and content-type validation.
- [ ] Input schema validation on server.
- [ ] Rate limiting for gate creation, verification polling, webhook, resolve, and any media proxy.
- [ ] Short-lived nonce and grant expiration; replay prevention.
- [ ] Telegram credentials stored only in secret bindings.
- [ ] Webhook validation and idempotency.
- [ ] CORS restricted to the first-party origin if a cross-origin client is ever used; same-origin is preferred.
- [ ] Appropriate cache controls on API/session responses; do not cache user-specific verification data publicly.
- [ ] Safe error messages; detailed stack traces remain server-only.
- [ ] Content Security Policy reviewed against actual media/provider needs; avoid unsafe inline script exceptions where feasible.
- [ ] `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, and suitable `Permissions-Policy` headers configured after testing.
- [ ] File names and response headers sanitized.
- [ ] Dependency and secret scan passes before launch.

## 13. Performance and observability

### Frontend
- Keep the initial JS payload small; do not ship a full client framework without evidence it is needed.
- Use system fonts or a small locally served font subset if a custom typeface is selected.
- Avoid large decorative images; the interface is primarily typography, CSS gradients, and subtle component surfaces.
- Lazy-load non-critical below-the-fold images if any.

### API
- Apply per-IP/session rate limits and upstream timeouts.
- Use bounded retries only for transient errors; no retry loops.
- Set explicit timeouts for Telegram and provider requests.
- Log `requestId`, route, outcome category, duration, and status; redact URLs, cookies, and authorization details.
- Monitor 4xx/5xx rate, Telegram lookup failures, resolver latency, timeouts, and abuse signals.

## 14. Testing strategy

### Unit tests
- Supported hostname/parser rejects lookalike domains.
- Provider adapter chooses only correct provider based on exact URL patterns.
- URL path validation, redirect target validation, filename sanitization, MIME/capability mapping.
- Expiry, token signature, nonce replay, and session transition rules.
- Normalized API responses do not contain provider secrets.

### Integration tests
- Gate start → bot association → member check → verified session.
- Non-member, expired challenge, duplicate deep link, bad webhook secret, and Telegram API failure.
- Resolve calls reject absent/expired grant before contacting providers.
- Provider success, provider 4xx, timeouts, expired source, malformed response, and unsupported capability.
- Large media path is not buffered into Worker memory.

### Browser/end-to-end tests
- First visit and mobile navigation.
- Empty/malformed/unsupported URL.
- Gate modal open/close and focus return.
- Join/verify states, including errors and retry.
- Result card with only relevant actions.
- Video playback success and playback failure.
- Download initiation and expired URL recovery.
- FAQ keyboard interaction and reduced-motion preferences.
- Widths: 320, 360, 390, 768, 1024, 1440 CSS pixels; no unintended horizontal scroll.

### Manual security checks
- Attempt host suffix spoofing, protocol-relative URLs, IP literals, non-default ports, redirects to private IPs, double-encoded paths, credentials in URLs, huge bodies, polling spam, and replayed verification tokens.
- Confirm source URL and Telegram user ID do not appear in analytics or routine logs.
- Confirm browser devtools do not reveal bot token or private bindings.

## 15. Build and deploy configuration

Typical static Astro scripts (adapt to selected package manager):

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint ."
  }
}
```

Cloudflare Pages configuration for a static Astro app with Functions:

- Framework preset: `Astro` (if available in dashboard)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Functions directory: `/functions` at repository root
- Git branch: configured production branch (e.g. `main`)

Use the current Cloudflare configuration file convention offered by the dashboard/CLI, and verify that the Pages deployment discovers the root `/functions` directory. Pages Functions are not part of the static `dist` directory.

### Local commands

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

Use Cloudflare's local Pages development workflow (for example, Wrangler with the built `dist` output and Functions) to test runtime bindings, webhooks, and API behavior before production. Do not assume `astro preview` alone reproduces the full Cloudflare Functions runtime.

## 16. Release and rollback

1. Merge behind provider feature flags with test providers/mocks in preview environment.
2. Verify Preview deployment, bindings, environment variables, Telegram webhook URL, D1 migrations, and secrets.
3. Run browser/accessibility/security smoke tests on preview.
4. Enable one provider at a time only after successful feasibility and acceptance tests.
5. Deploy production, then verify canonical URL, redirects, SSL, homepage, gate endpoint, Telegram membership flow, provider endpoint, `robots.txt`, sitemap, and noindex/canonical behavior.
6. Keep the previous successful Pages deployment available for rollback.
7. If resolution starts failing or an upstream provider changes, disable the adapter feature flag and show a clear unsupported/unavailable state while preserving the landing page.

## 17. External documentation

- [Astro on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages Functions overview](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions getting started](https://developers.cloudflare.com/pages/functions/get-started/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram bot deep links](https://core.telegram.org/api/links)
