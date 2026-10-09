# Diskwala Downloader & Player — Product Specification Pack

**Document set:** PRD, TRD, UI/UX Design System, SEO Specification, Implementation Plan  
**Product:** Diskwala Downloader & Player  
**Requested production domain:** `https://diskwaladownloader.com/`  
**Reference design:** user-provided PlayDiskWala homepage screenshot and `https://playdiskwala.in/`  
**Target hosting:** Cloudflare Pages  
**Frontend:** Astro static site  
**Status:** Ready for implementation planning; provider-resolution feasibility and Telegram verification settings must be confirmed before promising live download functionality.

## Document index

1. [`01-PRD.md`](./01-PRD.md) — goals, scope, users, journeys, requirements, acceptance criteria.
2. [`02-TRD.md`](./02-TRD.md) — architecture, stack, API contracts, resolver adapters, security, deployment.
3. [`03-UI-UX-DESIGN-SYSTEM.md`](./03-UI-UX-DESIGN-SYSTEM.md) — visual direction, tokens, layout, components, responsive behavior, accessibility.
4. [`04-SEO-SPECIFICATION.md`](./04-SEO-SPECIFICATION.md) — technical SEO, metadata, semantic structure, content plan, measurement.
5. [`05-IMPLEMENTATION-PLAN.md`](./05-IMPLEMENTATION-PLAN.md) — phases, tasks, dependencies, testing, rollout checklist.

## Product decisions captured here

- Build an original Diskwala Downloader & Player brand using the supplied reference's overall visual direction: near-black canvas, premium compact header, centered utility form, restrained colored accents, generous dark cards, guide content, FAQ accordion, and dark footer. Do not copy the reference's logo, exact marketing copy, or proprietary assets.
- Keep the public experience free. No website account, password, premium tier, pricing page, or on-site login.
- When a visitor submits a supported link, show a Telegram-channel gate before they can proceed to watching or downloading.
- Support only explicitly allowlisted links from the provider families confirmed in implementation: `diskwala.com` and `flezen.com`. Provider-specific resolution is a feasibility dependency; do not assume scraping, undocumented endpoints, or bypassing provider controls are permitted or stable.
- The site itself is a single-page experience. Use in-page anchors and modal/panel content for the initial release. Policy destinations can be added as separate URLs later if required.
- Use Astro for static, mostly server-rendered HTML and Cloudflare Pages for deployment. Use Cloudflare Pages Functions (or an equivalent Cloudflare Worker service) only for the API, Telegram verification, and resolver work that cannot be performed securely in a static browser page.
- The supplied hostname is spelled `diskwaladownloader.com` (it appears to omit the “a” in “downloader”). This pack retains the exact hostname provided. Confirm domain ownership and spelling before configuring canonicals, DNS, TLS, and Search Console.

## Important technical truth

A static Astro page can render the landing page and collect input, but it cannot securely prove Telegram channel membership or safely resolve third-party links by itself. A true membership gate requires a trusted Telegram identity-to-browser-session association and server-side verification. Working video previews and downloads additionally require stable, authorized provider integrations. These are explicit backend/API responsibilities despite the public website having no account system.

## Research references

- [PlayDiskWala reference website](https://playdiskwala.in/) — visual and information-architecture reference. Its current page describes the paste-link utility, player/download workflows, Telegram integration, platform guides, privacy statement, and FAQ.
- [Diskwala](https://www.diskwala.com/) — requested supported source family; implementation must confirm the actual share-link patterns and acceptable integration route.
- [Flezen](https://flezen.com/) — requested supported source family; implementation must confirm the actual share-link patterns and acceptable integration route.
- [Astro deployment guide for Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram bot deep links](https://core.telegram.org/api/links)
- [Google Search Central SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central structured data guidance](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)

## Before production approval

- [ ] Confirm the intended domain spelling and DNS ownership.
- [ ] Provide the Telegram channel URL/username, bot username, channel identifier, and bot administration permissions needed for membership checks.
- [ ] Run a provider feasibility spike for current Diskwala and Flezen share URLs; record supported URL patterns, limitations, API/terms constraints, and test fixtures.
- [ ] Decide whether membership must be strictly verified or whether a clearly labeled self-attestation gate is acceptable. Strict verification is recommended.
- [ ] Approve the site's copyright/acceptable-use policy and escalation contact.
