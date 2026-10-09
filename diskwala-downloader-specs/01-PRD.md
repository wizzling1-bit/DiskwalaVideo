# 01 — Product Requirements Document (PRD)

## 1. Document control

| Field | Value |
|---|---|
| Product | Diskwala Downloader & Player |
| Document | PRD |
| Status | Implementation baseline; provider feasibility remains a gate |
| Primary platform | Responsive web, mobile-first |
| Deployment target | Cloudflare Pages |
| Frontend framework | Astro |
| Public access | Free; no website account or premium tier |
| Domain requested | `https://diskwaladownloader.com/` — verify spelling before launch |

## 2. Product summary

Diskwala Downloader & Player is a single-page web utility that lets a visitor submit a link from a supported file-sharing provider, pass a Telegram-channel membership gate, then watch the resolved media online or download an authorized file. The landing page should feel premium, fast, clean, minimal, and trustworthy on both desktop and mobile. Its visual structure follows the supplied PlayDiskWala reference: compact navigation, prominent centered headline, input-and-action area, small utility cards, explanatory guide sections, platform guidance, FAQ accordion, and a dark footer. Brand identity, copy, icons, and exact components must be original.

The app has no website accounts, passwords, premium membership tiers, pricing table, or on-site login. Telegram membership is the only intended user gate. Do not label the product “ad-free,” “official,” “unlimited,” or “guaranteed high-speed” unless those claims are independently true and approved.

## 3. Problem statement

People receive shared media links and want a clearer, mobile-friendly way to determine whether the link is supported, watch media in-browser, or download an authorized file. Existing provider pages may present confusing transitions or inconsistent mobile experiences. The product should offer one predictable front door, explain what it supports, fail safely when a link cannot be resolved, and make the Telegram requirement clear before the user spends time waiting for a result.

## 4. Product vision

Deliver a fast, responsive, low-friction link utility with a clear consent and access flow: paste → understand the Telegram requirement → verify → resolve → watch or download. Every supported flow should have visible progress, human-readable failure states, and a clear way back to the input.

## 5. Goals and non-goals

### 5.1 Goals

1. Reproduce the reference's broad visual hierarchy and premium dark interface without copying its logo, source assets, or exact wording.
2. Make the URL input and primary action obvious above the fold on common mobile and desktop viewports.
3. Support share-link resolution for the explicitly approved `diskwala.com` and `flezen.com` domain families, subject to the feasibility and policy review in the TRD.
4. Show a Telegram membership modal when the visitor submits a link to proceed to either **Watch** or **Download**.
5. Verify channel membership server-side before issuing a resolver response when strict gating is enabled.
6. Avoid website account creation, passwords, premium upsells, pricing screens, or unnecessary personal-data collection.
7. Ship a static Astro landing page on Cloudflare Pages, adding a narrowly scoped Functions API only where needed.
8. Keep first load fast, responsive, accessible, and indexable.
9. Provide useful on-page instructions, provider support information, privacy information, and FAQs that are unique to this product.

### 5.2 Non-goals for v1

- Website account system, account profile, password reset, paid plans, subscriptions, or checkout.
- Bulk or batch downloads.
- Download queues, persistent user history, cloud library, or user-uploaded files.
- Browser extensions, Android/iOS native apps, desktop apps, or Telegram-native file delivery bot features beyond what is required for membership verification.
- Arbitrary URL proxying or a general-purpose URL fetcher.
- Bypassing DRM, paywalls, provider authentication, access controls, rate limits, or anti-bot mechanisms.
- Claiming support for a media format or provider URL until tested and documented.
- Copying PlayDiskWala's exact copy, logo, illustrations, source code, or unique branded assets.
- A multi-page SEO content hub in v1; the requested product is a single-page website.

## 6. Target users and use cases

### Persona A — Mobile link recipient
Receives a shared media URL in a messaging app. Wants to paste it on a phone and understand the steps without installing an app or navigating complex menus.

### Persona B — Desktop downloader
Uses a laptop browser, copies a supported share URL, and wants to either preview it or save the permitted media file locally.

### Persona C — First-time visitor
Does not know whether a source is supported. Needs examples, provider labels, clear error messages, and a transparent explanation of why joining Telegram is required.

### Persona D — Returning Telegram member
Has already joined the channel. Expects the site to verify membership with minimal repeated friction, while understanding that verification can fail if the bot cannot inspect channel membership.

## 7. Product principles

- **Utility first:** one clear main input, one primary action, no competing monetization CTAs.
- **Transparent gate:** explain the Telegram requirement before opening Telegram; do not pretend that a click is proof of membership.
- **No fake success:** show “Checking membership…” or “Resolving link…” only while work is actually underway.
- **Fail gracefully:** report unsupported host, invalid URL, inaccessible source, unavailable media, or verification issue separately.
- **Privacy by default:** do not store pasted links, direct media URLs, or user browsing history unless operationally essential and explicitly disclosed.
- **Permission-respecting downloads:** the utility is for content the visitor owns or has permission to access and download. Do not bypass technical access controls.
- **Accessible and responsive:** keyboard, touch, screen-reader, zoom, reduced-motion, and contrast requirements are part of acceptance criteria, not polish.

## 8. Information architecture — single page

Recommended section order:

1. **Header:** original wordmark/play symbol, optional anchor links (How it works, Supported sites, FAQ), and one Telegram/community link. Do not include Login, Join Premium, or Pricing.
2. **Hero:** concise headline, one-sentence explanation, supported-provider hint, URL input, paste control, primary “Continue” action.
3. **Utility cards:** “Watch online” and “Download a file” explained as outcomes available after successful verification/resolution. If both actions use one submit flow, make this explicit in the result panel.
4. **Product overview:** original concise explainer for the service and limitations.
5. **Supported providers:** clear Diskwala and Flezen tiles with valid domain examples and an “unsupported URL” note.
6. **How it works:** 3–4 numbered steps, including the Telegram join/verify requirement.
7. **Watch and download guide:** separate outcome descriptions; never imply every link can be converted or downloaded.
8. **Mobile and desktop usage:** short, device-specific tips.
9. **Privacy and safe use:** retention statement, permitted-use rule, non-affiliation statement, contact/reporting route.
10. **FAQ:** 6–10 concise questions covering supported URLs, Telegram verification, video playback, download failures, privacy, device compatibility, and legal/authorized use.
11. **Footer:** brand, in-page anchors, Telegram channel, contact/reporting email placeholder, copyright year generated at build time or in a stable component.

A single-page requirement means these should initially be section anchors and dialogs/panels rather than multiple content routes. The footer must not contain dead links. If legal review requires separate policies, add only the necessary routes in a later approved change.

## 9. Core user journeys

### Journey A — submit and pass the Telegram gate
1. Visitor opens the homepage.
2. Visitor pastes a URL, or types it manually.
3. Client performs basic syntax validation and displays the detected provider only when it can safely identify a supported hostname.
4. Visitor presses **Continue**, **Watch**, or **Download**.
5. The Telegram gate modal opens. It explains that the visitor must join the named channel before this request can proceed, and offers **Join Telegram** and **I’ve joined — verify** actions.
6. Visitor joins via the configured Telegram destination and returns to the page.
7. The visitor presses verify. The client asks the API to check membership using the configured Telegram identity-linking flow.
8. If membership is valid, the server issues a short-lived, scoped authorization/session result and the app resolves the original submitted link.
9. If resolution succeeds, show a media result with available metadata, then **Watch online** and/or **Download** actions.
10. If membership verification fails, explain the likely cause and offer retry, open Telegram again, or return to edit the URL.

**Important:** a static “I’ve joined” button cannot prove membership. Strict membership is only enabled after the Telegram identity-linking and bot permissions described in the TRD are implemented. If strict verification cannot be configured, the product owner must explicitly approve a self-attestation gate and label it honestly.

### Journey B — watch a supported media link
1. Visitor submits a supported link.
2. Gate and membership verification succeed.
3. API response indicates that the source offers a safe, authorized stream/preview.
4. UI displays a responsive HTML5 player only for supported media URLs and formats.
5. User can play/pause, scrub when supported, change volume, and use native fullscreen controls.
6. If playback is blocked by codec, CORS, token expiry, or source policy, show a useful error and offer download (only if separately available) or edit link.

### Journey C — download a supported media file
1. Visitor submits a supported link and passes the Telegram gate.
2. API confirms the file is eligible for a normal download flow.
3. UI shows filename where safely available, approximate file size where known, format, and a download control.
4. Download uses the provider's authorized download URL or a scoped server-created response; it must not expose long-lived secrets in logs or permanent browser storage.
5. If a direct download is unavailable or unsupported, say so and do not present a non-working download button.

### Journey D — unsupported or invalid URL
1. Client blocks malformed or non-HTTP(S) values.
2. Client/API validates the hostname against the exact allowlist.
3. The app displays a specific message: “Paste a share link from Diskwala or Flezen.”
4. Do not attempt to fetch arbitrary external URLs or follow redirects to unapproved hosts.

## 10. Functional requirements

Priority labels: **P0** required to launch; **P1** useful enhancement; **P2** later.

### FR-01 — landing page structure (P0)
- Render the full single-page homepage with header, hero utility form, provider information, how-it-works section, watch/download guidance, FAQ, privacy/safe-use section, and footer.
- All navigation destinations must scroll to an existing section or open a real external destination.
- Use original content and brand assets.

### FR-02 — URL input (P0)
- Accept only a syntactically valid HTTP or HTTPS URL.
- Trim surrounding whitespace and reject empty values.
- Provide a paste-from-clipboard control only after explicit user action; gracefully handle clipboard permission denial.
- Provide an accessible clear-input action.
- Preserve the current input in component memory during modal transitions. Do not write raw links to localStorage, analytics, or URLs.
- Do not auto-submit when the user pastes or types; submission must be intentional.

### FR-03 — supported-host detection (P0)
- Recognize approved hostnames only; use parsed URL hostname, not substring tests.
- Initial source families are `diskwala.com`, its approved `www` variant, `flezen.com`, and its approved `www` variant. Confirm host variants during the implementation spike.
- Reject lookalike hosts such as `diskwala.com.attacker.example` or `flezen.com.example`.
- Display a neutral provider label without making a claim about media availability.

### FR-04 — Telegram gate (P0)
- Show a modal/panel on submission before resolving or playing/downloading.
- Modal must state that users need to join the configured Telegram channel to continue.
- Display the configured channel CTA and a clear **Verify membership** control.
- Include an accessible close/cancel action; closing returns to the page and does not silently resolve the URL.
- Preserve the pending URL in memory for the current tab only.
- Include loading, verified, not-a-member, verification-unavailable, expired-session, and retry states.
- Strict verification must use a trusted user identity and a server-side Telegram Bot API check; a bare button click is not verification.

### FR-05 — identity association for verification (P0 for strict gate)
- Implement a time-limited opaque session nonce associated with a Telegram bot deep-link flow or an approved Telegram authentication flow.
- The bot/backend must associate the current browser session nonce with the Telegram numeric user ID without exposing bot tokens to the browser.
- The server must check current channel membership for that user.
- The bot must be configured with the permissions required by Telegram for reliable member lookups. If the verification API returns inconclusive, fail closed for resolving and offer retry/help.
- Nonces must expire, be single-use where appropriate, and be protected against replay.

### FR-06 — provider resolution (P0, subject to feasibility spike)
- Expose a same-origin API endpoint that identifies the provider and resolves a submitted supported URL.
- Return a normalized result independent of provider-specific response shape.
- Provider adapter must validate expected URL patterns and reject unsupported variants before any outbound request.
- Return only necessary media metadata and a scoped stream/download URL or equivalent server-mediated outcome, subject to legal and provider-policy approval.
- Never bypass DRM, paywalls, authentication, signed access restrictions, anti-bot controls, or provider rate limits.
- If no stable, permitted integration is available for a provider, show “This link type is not supported yet” and disable that provider in the UI rather than shipping brittle or deceptive behavior.

### FR-07 — result state (P0)
- Show an accessible result panel after successful resolution.
- Include provider name, safe filename if available, file type, file size if available, preview if supported, and available actions.
- Show separate **Watch online** and **Download** actions only when the API reports them available.
- Show expiry information for signed URLs only if useful; do not reveal internal tokens or upstream secret parameters in telemetry.

### FR-08 — HTML5 player (P0 if online playback included in MVP)
- Use native controls initially rather than building custom controls that duplicate native accessibility features.
- Support responsive sizing, correct aspect ratio, captions where supplied, and clear playback failure states.
- Set `playsinline` on mobile; do not autoplay with sound.
- Do not load remote media until gate/resolve success.

### FR-09 — download delivery (P0 if downloading included in MVP)
- Use `Content-Disposition: attachment` or a provider's safe direct download path where supported.
- Sanitize filename and extension; never trust raw filename/header values from a source without validation.
- Do not buffer large media files into memory in a Pages Function. Prefer an approved upstream redirect or streaming design and verify runtime limits during implementation.
- Handle expiry and download failure with a retry action that revalidates authorization.

### FR-10 — FAQ accordion (P0)
- Native button semantics; expose `aria-expanded` and `aria-controls`.
- Keyboard accessible and usable on touch devices.
- Avoid adding FAQ content purely for keyword stuffing.

### FR-11 — privacy, acceptable use, and non-affiliation (P0)
- Explain what the product receives, whether it stores links, how long session/nonces are retained, and how to request removal or report abuse.
- State that source-platform names are used to describe compatibility and that the tool is not affiliated with those providers unless formal authorization exists.
- State that visitors are responsible for rights to content they access or download.
- Do not claim “we never store anything” until logging and provider integrations are reviewed to substantiate it.

### FR-12 — error handling (P0)
Provide distinct UI messages for:
- empty input;
- malformed URL;
- unsupported host;
- unsupported link pattern;
- membership not verified;
- verification service unavailable;
- provider timeout;
- provider rejected the request or link expired;
- file unavailable/deleted;
- playback format unsupported;
- download unavailable;
- rate limited;
- unexpected server error.

### FR-13 — analytics and telemetry (P1)
- Optional, privacy-aware measurement may record generic events such as `submit_attempt`, `gate_open`, `membership_verified`, `resolve_success`, and `resolve_failure_category`.
- Never send raw URLs, file names, direct media URLs, Telegram IDs, bot tokens, or full error payloads to analytics.
- Do not add advertising scripts or cross-site tracking in v1.

### FR-14 — contact/report channel (P0)
- Add a real contact/reporting route before launch (can initially be a configured mailto link if maintained).
- Use it for copyright/abuse reports and privacy requests. Do not publish a fake address.

## 11. UX copy requirements

Voice: direct, calm, useful; no exaggerated speed or availability claims.

Suggested starting copy (rewrite before release as needed):
- Hero title: **Diskwala Downloader & Player**
- Hero description: “Paste a supported Diskwala or Flezen share link to check available viewing and download options.”
- Primary action: **Continue**
- Gate title: **Join our Telegram channel to continue**
- Gate explanation: “Join the channel, return here, and verify your membership before this link can be processed.”
- Gate buttons: **Join Telegram** · **Verify membership**
- Safe-use note: “Only access or download files you own or have permission to use.”

Avoid “100% safe,” “guaranteed,” “unlimited,” “bypass,” “remove all restrictions,” and “official downloader” unless independently substantiated and reviewed.

## 12. Non-functional requirements

### Performance
- Static landing-page HTML should render without waiting for client JavaScript.
- Target Lighthouse mobile performance score ≥ 90 on a representative production run; treat the score as a test target, not a guarantee across all networks.
- Aim for Core Web Vitals at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 after sufficient real-user data exists.
- Avoid large hero video backgrounds, autoplay media, heavy UI frameworks, unnecessary client hydration, and remote font blocking.

### Accessibility
- Target WCAG 2.2 AA for the public interface.
- Keyboard navigation, visible focus, logical heading order, readable error announcements, modal focus trapping/restoration, and no color-only status cues.
- Respect reduced-motion settings and 200% zoom without horizontal overflow.

### Compatibility
- Current stable Chrome, Edge, Firefox, and Safari; Android and iOS mobile browsers. Validate the browsers used by the target audience.
- Gracefully degrade if clipboard API, fullscreen, a given codec, or a download behavior is unsupported.

### Reliability
- Timeouts and bounded retries for provider APIs.
- Server-side rate limiting for resolver and verification endpoints.
- Clear retry UI without repeating expensive upstream work automatically.

### Privacy and security
- Secrets exist only in server-side environment variables/bindings.
- Validate all input on both client and server.
- Use allowlists and strict outbound request controls to prevent SSRF.
- Do not persist the submitted URL or resolved media URL unless required, time-limited, and documented.

## 13. Success metrics

Record only privacy-safe aggregate measurements where possible.

| Metric | Initial target / observation |
|---|---|
| Mobile form usability | 100% of critical form actions usable at 360 px CSS viewport width |
| Core landing build | Builds cleanly and deploys from the production branch |
| Gate correctness | No resolver action before successful verification when strict mode is enabled |
| Supported URL test pass rate | All documented provider test fixtures pass in pre-release testing; report actual results per provider |
| Error clarity | Every expected failure category maps to a useful, distinct message |
| Performance | Lighthouse mobile target ≥ 90; investigate critical regressions |
| Accessibility | No known critical/serious automated audit findings; keyboard and screen-reader smoke test passed |
| Privacy | No raw URL or Telegram token in analytics, logs, or browser storage during QA |
| Search setup | Domain verified, sitemap submitted, canonical and robots directives validated |

Do not invent a “conversion rate” baseline before real usage has been measured. Set post-launch targets after observing baseline traffic and the gate flow.

## 14. Launch acceptance criteria

Release only when all P0 items are complete or explicitly waived by the product owner.

- [ ] Single-page layout follows the approved design system and works on small mobile, tablet, laptop, and wide desktop.
- [ ] Header/footer links have working destinations.
- [ ] Input rejects malformed URLs and unsafe hostnames.
- [ ] `diskwala.com` and `flezen.com` adapters have documented sample links and tested success/failure paths, or unsupported adapters are disabled.
- [ ] A submitted link opens the Telegram gate before processing.
- [ ] Strict mode proves membership server-side, or the product owner explicitly approves clearly labeled self-attestation instead.
- [ ] No website account, login screen, pricing page, or premium tier exists.
- [ ] Watch/download actions are only shown for capabilities actually returned by the API.
- [ ] Errors, timeouts, expired sessions, deleted files, and rate limits have tested states.
- [ ] No arbitrary URL fetching or SSRF path is possible.
- [ ] No direct API keys/bot tokens are present in client bundles.
- [ ] Policy/contact/reporting content is reviewed and live.
- [ ] Mobile keyboard/modal behavior and accessibility smoke tests pass.
- [ ] SEO metadata, canonical, robots.txt, sitemap.xml, Open Graph, favicon, and Search Console readiness are validated.
- [ ] Production deployment and rollback procedure are documented.

## 15. Risks and open decisions

| Risk / decision | Why it matters | Owner / required action |
|---|---|---|
| Domain spelling | `diskwaladownloader.com` appears to miss the “a” in “downloader”; redirects/canonicals depend on the final decision | Product owner: verify registrar/domain ownership and chosen spelling |
| Provider compatibility | Provider page structure, endpoint behavior, and policy may change; the website's existence does not establish a supported API | Engineering: run a feasibility spike for each provider and document compliant access path |
| Telegram membership proof | Frontend-only clicks are forgeable; Telegram identity must be associated with the browser session | Engineering/product: approve bot workflow and supply channel/bot identifiers |
| Telegram bot permissions | Membership lookup can be inconclusive without the correct channel configuration and permissions | Operations: configure bot/admin permissions and test with a member and non-member account |
| Large file transfer | Serverless response limits and upstream token expiry may impact direct proxying | Engineering: choose redirect or streaming architecture after a prototype; do not buffer full files |
| Legal/content complaints | Third-party media downloading may implicate copyright or provider terms | Product owner/legal reviewer: publish policy, reporting contact, and takedown process |
| SEO single-page limitation | One URL limits separate ranking opportunities for provider-specific guides | Product owner: retain single page for v1; evaluate supporting pages later without keyword stuffing |

## 16. Definition of done

The product is not “done” merely because the landing page matches a screenshot. It is done when the interface, API contracts, Telegram gate, allowed provider flows, error handling, safety constraints, deployment configuration, accessibility, privacy copy, SEO fundamentals, and launch checks operate together as documented.
