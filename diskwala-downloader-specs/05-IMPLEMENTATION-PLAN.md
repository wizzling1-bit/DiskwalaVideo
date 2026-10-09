# 05 — Implementation Plan

## 1. Plan overview

This plan converts the PRD/TRD/UI-UX/SEO specifications into a controlled delivery sequence. Work is ordered by dependency: resolve domain and source-provider uncertainty early, establish the static design system and layout, implement the gate and API contracts, then finish provider integration, QA, and launch.

**Indicative schedule:** approximately 8–12 focused working days for one developer *if* both providers have permitted, stable integration paths and Telegram settings are available promptly. If provider resolution requires reverse engineering, provider approval, a complex bot workflow, or a streaming proxy, the schedule can expand materially. The feasibility phase is a hard gate; do not promise production downloads solely based on the landing-page estimate.

## 2. Workstreams and milestones

| Milestone | Outcome | Exit condition |
|---|---|---|
| M0 — Decisions & feasibility | Domain, Telegram config, provider capabilities, allowed use documented | Owner confirms decisions; adapter feasibility report accepted |
| M1 — Project foundation | Astro project, design tokens, Cloudflare preview deployment | Build/typecheck and preview deployment pass |
| M2 — Static single-page UI | Responsive header, hero form, cards, guides, FAQ, footer | Visual and accessibility review passes on target viewports |
| M3 — Gate/API foundation | Gate modal, server-side session and Telegram association contract | All membership states and expiry/replay tests pass in staging |
| M4 — Provider adapters | Normalized results for enabled providers | Fixtures and real authorized test links pass; unsafe methods are excluded |
| M5 — Playback/download flows | Result panel, video element, authorized download action | Watch/download capabilities verified per provider and browser |
| M6 — Hardening and SEO | Security, performance, SEO, privacy/legal content | Launch checklist complete and no critical/high-risk issue remains |
| M7 — Production launch | Production domain, secret bindings, Telegram webhook, monitoring | Production smoke tests pass; rollback plan ready |

## 3. Phase 0 — Decisions and feasibility spike (Day 1–2)

### Tasks

1. **Confirm domain**
   - Confirm whether `diskwaladownloader.com` is intentional or whether the intended registered hostname differs.
   - Confirm registrar ownership and DNS access.
   - Choose canonical host (`www` or apex) and final HTTPS redirect policy.

2. **Confirm Telegram gate inputs**
   - Obtain the actual channel URL/username and channel identifier.
   - Obtain/create the bot username and token through the owner’s Telegram account.
   - Add/configure the bot with the permissions needed to check membership.
   - Choose the browser-to-Telegram identity-linking design (recommended: one-time deep link nonce with bot webhook).
   - Confirm whether the site must enforce membership strictly or may use self-attestation if Telegram integration proves unworkable. Strict verification is the recommended product behavior.

3. **Provider feasibility spike — Diskwala**
   - Collect owner-authorized representative links: valid, expired, invalid, removed, and unusual path cases.
   - Record exact URL patterns and redirects.
   - Identify a permitted, stable resolution path.
   - Validate whether a stream URL or direct download is made available without bypassing provider controls.
   - Capture MIME, size, filename, expiry, codec, and CORS behavior.

4. **Provider feasibility spike — Flezen**
   - Repeat the same tests separately; do not assume it behaves the same as Diskwala.
   - Confirm permitted access path and restrictions.

5. **Write an acceptance matrix**
   - Provider × input pattern × watch available × download available × auth required × file size known × expiry behavior × expected error.

### Deliverables

- Domain/Telegram configuration sheet (no secrets in the document/repository).
- Provider feasibility report with sample fixtures, tested paths, known limitations, and clear go/no-go per adapter.
- Approved v1 capability matrix.

### Exit criteria

No adapter enters production implementation unless its access/resolution path is sufficiently understood and policy-approved. If a provider cannot be supported responsibly, remove/disable it in v1 rather than building brittle logic.

## 4. Phase 1 — Project foundation (Day 2)

### Tasks

1. Initialize Astro project with static output.
2. Configure TypeScript, linting, formatting, test runner, and dependency lockfile.
3. Build minimal `BaseLayout.astro` with SEO slots (title, description, canonical, OG metadata).
4. Establish token stylesheet and global reset.
5. Create `index.astro` with semantic landmarks and temporary content structure.
6. Add original favicon draft and local placeholder OG image.
7. Configure Cloudflare Pages project from Git repository with `npm run build` and output directory `dist`.
8. Confirm root-level `/functions` convention and preview deployment discovery with a tiny health endpoint if Functions are required.
9. Add a README covering local setup, test commands, environment bindings, and deployment setup.

### Deliverables

- Working local development server.
- Clean production build.
- Preview URL.
- Token file and repository structure.

### Exit criteria

Build, typecheck, and preview deploy are repeatable from a clean checkout; no real tokens are committed.

## 5. Phase 2 — Visual implementation (Day 3–4)

### Tasks

1. Implement the compact header and responsive navigation.
2. Implement hero title, subtitle, URL input form, paste/clear buttons, provider hint, and main CTA.
3. Implement two utility cards (watch and download) with original icons and honest capability descriptions.
4. Implement supported provider section.
5. Implement the how-it-works steps and watch/download guidance.
6. Implement mobile/desktop usage sections, privacy/safe-use panel, FAQ accordion, and footer.
7. Write original copy. Use the PlayDiskWala screenshot for layout rhythm and style direction only; don't copy its exact paragraphs/logo/assets.
8. Add responsive behavior at small phone/tablet/desktop widths.
9. Ensure anchor scrolling, visible focus, target sizes, and reduced-motion behavior.
10. Compare visual screenshots to the approved design specification and tune spacing, typography, and card contrast.

### Deliverables

- Fully composed static landing page.
- Original brand mark/favicon and OG asset.
- Responsive screenshot set (360 px, 390 px, 768 px, 1024 px, 1440 px).

### Exit criteria

All sections render without API integration; no placeholder links, premium/login content, fake results, or dead controls remain.

## 6. Phase 3 — URL form and state model (Day 4–5)

### Tasks

1. Parse input with `new URL` and validate HTTP(S) scheme.
2. Implement exact-host allowlist, including correct `www` variants confirmed in Phase 0.
3. Reject malformed URLs, lookalike hostnames, unsupported providers, embedded credentials, and disallowed ports.
4. Build form states: empty, valid, invalid, unsupported, creating session, gate open.
5. Implement paste only through user interaction and handle browser permission errors.
6. Keep the input in tab memory through the gate sequence. Do not store it in localStorage/session analytics or URL parameters.
7. Prevent double submit and ensure Enter submits correctly.
8. Implement accessible validation and focus behavior.

### Deliverables

- Typed client-side URL validation module.
- Form unit tests for good/bad URLs.
- Deterministic state transitions.

### Exit criteria

Invalid and unsupported values never reach the provider adapter; host-suffix spoofing tests fail safely.

## 7. Phase 4 — Telegram gate and verification (Day 5–7)

### Tasks

1. Implement the gate modal based on the UI/UX specification.
2. Create `POST /api/gate/start` with short-lived nonce/session creation.
3. Implement bot deep link generation without embedding the source URL.
4. Implement Telegram webhook handler and associate a valid nonce with the Telegram numeric user ID.
5. Validate webhook authenticity and make nonce processing idempotent.
6. Implement membership lookup with the Telegram Bot API.
7. Store session state and expiry with a minimal D1 schema or approved alternative.
8. Implement gate-status/verify endpoint with states for waiting, verified, non-member, expired, and service unavailable.
9. Implement polling with bounded interval and timeout; add manual retry to avoid endless polling.
10. Require a short-lived verified grant/session before `/api/resolve` can run.
11. Add rate limits to gate session creation and polling.
12. Add privacy-safe logs and avoid raw source URLs/Telegram tokens in event payloads.

### Deliverables

- Tested membership workflow in staging.
- D1 schema/migration or equivalent state model.
- Secret configuration and webhook setup notes.
- Automated tests for member, non-member, invalid nonce, expired nonce, replay, bad webhook, and Telegram outage.

### Exit criteria

In strict mode, no resolve action succeeds without a valid, unexpired membership verification grant. A fake frontend button click cannot pass the gate.

## 8. Phase 5 — Provider adapters and normalized API (Day 6–8; dependent on Phase 0)

### Tasks

1. Create provider adapter interface and registry.
2. Implement server-side URL validation and dispatch only to enabled adapters.
3. Implement the Diskwala adapter only using the approved method identified in Phase 0.
4. Implement the Flezen adapter only using the approved method identified in Phase 0.
5. Normalize provider results to stable fields: provider, title, safe filename, MIME, optional size, capability flags, stream/download outcome, expiry, request ID.
6. Translate provider failures to stable error codes and user-safe messages.
7. Add outbound timeout, redirect-hop validation, response size/type limits for metadata retrieval, and SSRF protections.
8. Add per-session/IP/provider rate limits.
9. Add feature flags so provider support can be disabled independently without breaking the landing page.
10. Implement fixtures for success, invalid path, removed file, expired link, unsupported format, timeout, and malformed upstream response.
11. Test with controlled, owner-authorized real links in staging. Do not log real source URLs.
12. Document known unsupported patterns in the provider support matrix.

### Deliverables

- Provider adapters, registry, and normalized response schema.
- Unit/integration tests.
- Real-link QA report with redacted fixtures.
- Feature-flag state for each provider.

### Exit criteria

Only tested and policy-approved URL patterns are enabled. No adapter uses arbitrary proxying, access-control bypass, or insecure parsing.

## 9. Phase 6 — Media result, player, and download (Day 8–9)

### Tasks

1. Implement result card and capability-driven Watch/Download actions.
2. Mount video player only when the visitor selects Watch.
3. Use native video controls initially; configure `playsinline`, `preload="metadata"`, and no autoplay with sound.
4. Add playback states: ready, loading, playing, failed/unsupported, source expired.
5. Implement the authorized download path: provider direct URL/redirect or a reviewed bounded streaming flow.
6. Do not buffer full files into serverless memory; check cancellation, range-request, expiry, and content disposition behavior.
7. Sanitize filenames and validate MIME/content metadata before display or response headers.
8. Add retry/re-resolve path for expired download links.
9. Ensure media URLs aren't retained in localStorage or analytics.
10. Test mobile Safari/Chrome and desktop Chrome/Firefox/Edge for actual supported media fixtures.

### Deliverables

- Working Watch/Download UI for capabilities that passed provider QA.
- Clear unsupported/error messages.
- Playback/download compatibility report.

### Exit criteria

No action button appears unless it is supported by the returned result. Failed playback/download provides recovery rather than a blank panel.

## 10. Phase 7 — SEO, privacy, security, performance, and QA (Day 9–10)

### Tasks

1. Finalize `<title>`, description, canonical, robots, OG image, favicon, and `robots.txt`.
2. Generate and validate a sitemap containing the canonical homepage only.
3. Add truthful JSON-LD for `WebSite` and optional appropriate application schema; validate it.
4. Finalize privacy, safe use, non-affiliation, contact/reporting, and FAQ copy.
5. Confirm no placeholder provider cards, fake testimonials, fake metrics, dead footer links, or unsupported claims remain.
6. Run Lighthouse and inspect LCP/INP/CLS drivers.
7. Run axe/accessibility automated checks and manual keyboard testing.
8. Run cross-device browser matrix and screenshot regressions.
9. Run security checklist: SSRF, redirect validation, rate-limit, token replay, body-size limits, webhook authenticity, secret scanning, logging redaction.
10. Check analytics/console/network requests for raw URL or Telegram identifiers.
11. Complete legal/acceptable-use review and confirm reporting email.
12. Add Search Console verification instructions after canonical host is final.

### Deliverables

- QA report.
- SEO validation report.
- Security checklist with findings and remediations.
- Policy content approval.

### Exit criteria

No critical accessibility or security issue remains; all P0 acceptance criteria pass; any remaining limitation is visible to users and explicitly approved.

## 11. Phase 8 — production launch (Day 10–12)

### Pre-deploy
- Confirm final domain and Cloudflare zone/DNS access.
- Configure HTTPS and canonical redirects.
- Set production Telegram token, webhook secret, channel identifier, database bindings, and signing secret using Cloudflare secret/binding features.
- Configure webhook URL after production deploy and test it.
- Run D1 migrations and verify minimal retention/expiry cleanup.
- Confirm provider feature flags match the QA-approved capability matrix.
- Confirm preview deploys cannot be mistaken for production or indexed.
- Verify rollback target exists.

### Deploy
1. Merge approved release commit.
2. Wait for deployment outcome within the deployment workflow; check build logs for error exit codes.
3. Confirm homepage, assets, `/robots.txt`, sitemap, and every API health/smoke endpoint.
4. Verify the Telegram member and non-member flows with controlled accounts.
5. Run one supported Watch test and one supported Download test for each enabled provider.
6. Verify errors for unsupported URL and expired media link.
7. Confirm the canonical host/redirect and no mixed content.
8. Check Search Console property access and sitemap submission.

### Post-deploy monitoring
- Check Cloudflare Functions errors and latency.
- Watch Telegram verification error categories.
- Watch provider timeout/rate-limit categories without collecting raw source URLs.
- Verify logs are redacted.
- Review first-user feedback for unclear instructions or gate friction.
- Disable the affected provider quickly if upstream behavior changes; keep landing page available.

## 12. Test matrix

| Area | Test | Expected result |
|---|---|---|
| Input | Empty string | Inline validation; no gate/API request |
| Input | Malformed URL | Helpful validation error |
| Input | `https://diskwala.com.example.org/path` | Rejected as unsupported host |
| Input | Approved valid provider URL | Gate opens before resolution |
| Gate | Visitor is channel member | Verified state then resolver may run |
| Gate | Visitor is not a member | Resolver not called; join/retry guidance displayed |
| Gate | Visitor only clicks “I joined” but no trusted identity link | Strict verification still fails/continues waiting |
| Gate | Challenge expired | Request new challenge; do not reuse expired token |
| Gate | Challenge replayed | Rejected or marked consumed idempotently without issuing a new grant |
| Gate | Telegram API outage | Fail closed for resolver; clear retry message |
| Resolver | Unsupported host | No outbound provider request |
| Resolver | Redirect to private IP | Blocked |
| Resolver | Provider timeout | Stable retryable error; no stack trace shown |
| Resolver | File deleted/expired | Safe user message; allow new link submission |
| Result | Watch unavailable | Watch button omitted/disabled with explanation |
| Result | Download unavailable | Download button omitted/disabled with explanation |
| Playback | Supported MP4 | Native player loads with controls; no auto sound |
| Playback | Unsupported codec | Helpful failure state; no broken layout |
| Download | Filename contains `../` or control chars | Filename sanitized before display/headers |
| Privacy | Source URL entered | No localStorage persistence and no analytics payload containing URL |
| Privacy | Browser/client bundle inspection | No bot token or private signing secret present |
| SEO | Production canonical | Matches final canonical hostname |
| SEO | Preview deployment | No competing indexable canonical/sitemap |
| Responsive | 320, 360, 390, 768, 1024, 1440 widths | No unintended overflow; controls usable |
| Accessibility | Keyboard through input → modal → result | Focus visible, trapped/restored appropriately, status messages announced |
| Operations | Provider disabled by feature flag | Landing page remains functional; provider is not advertised as working |

## 13. Risk register and mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Provider doesn't expose a permitted stable resolution path | High | Complete feasibility spike first; disable adapter rather than reverse-engineering access controls |
| Telegram membership cannot be reliably associated with browser | High | Use one-time deep-link identity association and server-side check; test permissions before UI polish is finalized |
| Source changes and resolver breaks | High | Adapter isolation, fixtures, provider flags, clear unsupported state, operational alerting |
| Serverless download limits or large file memory use | High | Prefer provider-approved direct URL/redirect; prototype streaming before enabling proxy transfer |
| SSRF through pasted URLs or redirects | High | Exact allowlists, redirect revalidation, reserved IP rejection, bounded requests, no arbitrary proxy |
| Pasted URLs leak into logs/analytics | High | Redaction tests, minimal logs, no client persistence, review observability vendors |
| Unclear domain spelling | Medium | Confirm ownership and canonical before launch |
| Single-page content doesn't rank for many distinct queries | Medium | Focus homepage on core tool intent; add genuinely useful pages only after v1 and separately approved |
| Telegram gate creates friction | Medium | Explain requirement before submitting, keep actions clear, make errors recoverable, measure only aggregate events if approved |
| Misleading provider/speed claims | Medium | Capability-driven UI and truthful copy; avoid unsupported promises |

## 14. Definition of done by workstream

### UI
- Responsive from 320 CSS px up, no unintended horizontal scroll.
- Original brand/artwork and consistent tokens.
- Accessible modal, input, buttons, FAQ, and result panel.

### API/security
- Validation and rate limiting applied server-side.
- Membership verification can't be bypassed by client-side state manipulation in strict mode.
- No arbitrary outbound fetch/proxy, SSRF path, or token leakage.
- Expected failure categories have stable API errors.

### Provider support
- Supported patterns documented and tested with approved links.
- Watch/download capabilities reported truthfully.
- Feature flags can disable unstable adapters.

### SEO/content
- Metadata/canonical/sitemap/robots configured for the actual domain.
- Original, useful content; no fabricated claims or search spam.
- Privacy, non-affiliation, acceptable-use, and reporting details match implementation.

### Operations
- Clean production build/deploy.
- Production smoke tests passed.
- Secrets and bindings configured out of source control.
- Rollback path documented and available.

## 15. Handover checklist

- [ ] README includes local run/build/test instructions.
- [ ] Environment variable/binding inventory documents names and purposes but no secret values.
- [ ] Telegram bot creation, permissions, webhook setup, and secret rotation instructions are documented.
- [ ] D1 schema/migrations and data retention rules are documented, if D1 is used.
- [ ] Provider URL patterns and limits are documented with redacted fixtures.
- [ ] Test results include provider capability matrix and actual browser coverage.
- [ ] Cloudflare Pages build settings and root Functions layout are documented.
- [ ] SEO/Search Console setup and final canonical host are documented.
- [ ] Known unsupported link types and recovery instructions are published.
- [ ] Contact/report channel works.
- [ ] Previous deployment rollback route is known to the operator.
