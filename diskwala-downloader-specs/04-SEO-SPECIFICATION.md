# 04 — SEO Specification

## 1. SEO objective

Make the single-page Diskwala Downloader & Player site discoverable for relevant user needs while ensuring page titles, copy, structured data, and claims accurately describe what the tool actually supports. SEO work must improve clarity and usefulness; it must not rely on copying the reference site's text, keyword stuffing, fake reviews, fabricated performance claims, or doorway pages.

The site is intentionally a single-page website for v1. This means its homepage can target the core tool intent and supporting sections can answer essential questions, but all in-page anchors still share one canonical URL. If search demand later justifies provider-specific informational pages, that should be a separately approved content expansion—not a reason to stuff many unrelated terms into the homepage.

## 2. Domain and canonical decisions

Requested domain: `https://diskwaladownloader.com/`.

**Pre-launch hold:** the supplied spelling appears to omit the “a” in “downloader.” This specification uses the exact user-supplied hostname to avoid silently changing the requirement, but the owner must confirm the registered domain before deploying canonical URLs, redirects, sitemap URLs, Open Graph URLs, and Search Console properties.

Once confirmed:
- Choose one canonical host: apex or `www`.
- Redirect the alternate host to the chosen host with a permanent redirect.
- Redirect HTTP to HTTPS.
- Use the same canonical URL in the HTML `<link rel="canonical">`, sitemap, Open Graph `og:url`, and Search Console.
- Avoid multiple canonical hostnames or inconsistent trailing-slash policies.
- If the typo is corrected before launch, update every environment variable and metadata source before indexing begins.

## 3. Search intent and keyword themes

These are hypotheses for page copy and measurement, not claims about measured search volume. Validate actual query demand with Google Search Console and a keyword research source after the domain is live.

### Primary intent

People want to open, preview, or download a supported Diskwala share link through a browser.

### Primary keyword themes

- Diskwala downloader
- Diskwala video downloader
- Diskwala player
- Diskwala online video player
- Diskwala link opener

### Secondary and question themes

- download a Diskwala video link
- watch a Diskwala video online
- open a Diskwala link in browser
- Flezen video download / Flezen file link (only if implemented and tested)
- watch supported share links on mobile
- why a supported link is not working
- do I need Telegram membership to use the tool
- supported video types and browser compatibility

### Keyword safeguards

- Do not target terms that imply support for unimplemented providers or formats.
- Do not claim a query has “100k volume” or another search volume without a current, dated data source.
- Do not create hundreds of typo-variation pages. Mention a spelling variant only where it helps users understand a known query, and keep the main copy natural.
- Do not place keywords in every heading or repeat the same phrase unnaturally.
- Do not claim official affiliation with Diskwala or Flezen unless an actual agreement exists.

## 4. Homepage metadata

Final metadata depends on confirmed domain and enabled providers. Proposed draft:

### `<title>`

`Diskwala Downloader & Player — Watch or Download Supported Links`

Keep the title concise and descriptive. Revisit it after Search Console data accumulates; do not append repeated keyword strings.

### Meta description

`Open a supported Diskwala or Flezen share link to check browser playback and download options. Free to use, with Telegram channel verification required before processing.`

Update the sentence if the Telegram flow is self-attested rather than verified. Never describe verification as strict unless the server really checks it.

### Canonical

```html
<link rel="canonical" href="https://CONFIRMED-CANONICAL-HOST/" />
```

Do not publish the placeholder. It must be replaced by the confirmed production URL.

### Robots

```html
<meta name="robots" content="index,follow,max-image-preview:large" />
```

Only set this on the production page if it should be indexed. Preview deployments should be prevented from indexing through the deployment's access/configuration or a reliable `noindex` rule that does not leak into production.

### Open Graph and social metadata

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Diskwala Downloader & Player" />
<meta property="og:title" content="Diskwala Downloader & Player" />
<meta property="og:description" content="Open a supported share link to check browser playback and download options." />
<meta property="og:url" content="https://CONFIRMED-CANONICAL-HOST/" />
<meta property="og:image" content="https://CONFIRMED-CANONICAL-HOST/og-cover.png" />
<meta name="twitter:card" content="summary_large_image" />
```

Create an original OG image with readable brand name, subtle play motif, dark background, and green accent. Avoid copying PlayDiskWala's mark or screenshot. Ensure the image URL returns `200`, has the correct dimensions, and is not blocked from crawlers.

## 5. Content and semantic structure

Use one descriptive H1; section headings use logical nesting. Proposed semantic outline:

- `H1`: Diskwala Downloader & Player
- `H2`: Supported share links
- `H2`: How it works
  - `H3`: Paste a supported link
  - `H3`: Join and verify on Telegram
  - `H3`: Watch or download when available
- `H2`: Watch online
- `H2`: Download a supported file
- `H2`: Use the tool on mobile and desktop
- `H2`: Privacy and safe use
- `H2`: Frequently asked questions
  - individual questions as `H3` or accessible accordion headings

Section titles should be written for people. A heading may contain a relevant keyword, but it should not exist only for the search engine. Put the essential tool description, supported domains, gate requirement, and limitations in normal page HTML rather than rendering all meaningful copy only after client-side interaction.

## 6. Recommended on-page content

### Above the fold

- Product name and core capability.
- A single sentence explaining that only supported share links are accepted.
- The link input and primary Continue action.
- Clear information that Telegram verification is required before processing.
- Provider names only for adapters that are actually enabled.

### Provider support section

For each enabled provider, include:
- exact domain(s) accepted;
- examples of valid share URL format (with non-working/redacted example tokens if necessary);
- whether watch, download, or both are supported;
- known limitations (expired share link, unsupported encoding, access restriction, codec limitations).

Don't expose private test URLs or users' real file names in public copy. If a provider adapter is disabled, don't leave its tile labeled “supported.”

### How it works

Explain the actual sequence including the Telegram gate. Don't imply users can skip the gate or that the tool will resolve every source link.

### Privacy and permitted use

Clearly explain what happens to pasted links, whether the request is sent to the source provider, session expiration, operational logs, and a way to report abuse/copyright concerns. Only state that source links are not stored if implementation/log review confirms that statement.

### FAQ topics

Use answers to resolve genuine user questions:
1. Which domains are supported?
2. Why do I need to join the Telegram channel?
3. How do I verify membership?
4. What should I do if verification fails?
5. Can every link be watched or downloaded?
6. Why is my link expired or unsupported?
7. Does playback work on mobile?
8. What should I do if playback fails?
9. Are files stored by this website?
10. What content am I allowed to download?

Answers must match live behavior. Don't claim “yes” for features that have not passed testing.

## 7. Structured data

Use valid, truthful structured data that reflects visible content. Validate it before launch and after any copy/domain changes.

### Recommended: `WebSite`

- `@context`: `https://schema.org`
- `@type`: `WebSite`
- `name`: `Diskwala Downloader & Player`
- `url`: confirmed canonical URL
- `description`: concise, truthful description of supported link utility

### Optional: `Organization`

Add only if the publisher/operator has an actual name and public contact details. Do not invent an organization name, postal address, or social profiles. Add `sameAs` only for official social profiles actually controlled by the operator.

### Optional: `SoftwareApplication` / `WebApplication`

Use only if the implementation and current Google requirements make it an appropriate, eligible representation of this web tool. Fill factual fields only. Do not invent ratings, review counts, download counts, offers, or an app-store listing. Google Search Central documents software-app structured data here: https://developers.google.com/search/docs/appearance/structured-data/software-app.

### FAQ structured data

FAQ markup may be used when the visible page genuinely contains the corresponding questions and answers, but do not promise or expect FAQ rich-result expansion for a normal commercial/tool website. Google has limited FAQ rich results largely to authoritative government and health sites; see https://developers.google.com/search/blog/2023/08/howto-faq-changes. Structured data is not a replacement for clear visible content.

### Validation

- Validate JSON-LD syntax.
- Validate eligible markup with Google's Rich Results Test where relevant.
- Use URL Inspection after production deployment.
- Remove unsupported or fabricated properties.

## 8. Technical SEO implementation

### HTML and indexing
- Unique `<title>` and meta description.
- Canonical URL set once.
- One H1 and meaningful section IDs.
- Descriptive anchor text; no “click here” for important links.
- Ensure key text renders in initial HTML.
- Ensure production page returns HTTP 200.
- Ensure preview deployments are not unintentionally indexable.
- Do not block CSS or necessary JavaScript resources in `robots.txt` if crawlers need them to understand the page.

### `robots.txt`

Example after host confirmation:

```text
User-agent: *
Allow: /
Sitemap: https://CONFIRMED-CANONICAL-HOST/sitemap.xml
```

Do not include a placeholder in production. `robots.txt` is for crawling directives and is not a substitute for access control or `noindex`.

### `sitemap.xml`

For the v1 single-page site, the sitemap may contain only the canonical homepage URL. Do not add fragment URLs such as `/#faq` as separate sitemap entries; fragments are not separate documents.

- Use the exact canonical host.
- Include only indexable canonical URLs.
- Do not use a sitemap to imply unimplemented provider pages.
- If page last-modified metadata is supplied, make it truthful; don't change it on every build without content change.

### Favicon and icons
- Original SVG favicon based on the brand's play mark.
- Include touch icon/manifest only if needed.
- Use simple, legible geometry at small sizes.

### Images
- Minimize decorative images; keep essential images lightweight.
- Use descriptive alt text for meaningful imagery; empty alt for purely decorative images.
- Provide explicit width/height or aspect ratio to prevent layout shifts.
- Use modern formats if images are needed and compress the original artwork.

### Internal links
- Header anchors point to valid section IDs.
- Footer policy/reporting links work.
- Avoid dead anchors, repeated links with meaningless labels, and empty `href="#"` placeholders.

## 9. Performance and Core Web Vitals

Targets:
- LCP ≤ 2.5 s at the 75th percentile once sufficient field data exists.
- INP ≤ 200 ms at the 75th percentile.
- CLS ≤ 0.1 at the 75th percentile.
- Lighthouse performance score ≥ 90 on a representative mobile test as an engineering target.

Implementation guidance:
- Astro static rendering for the content shell.
- Minimal client-side JavaScript; don't hydrate all sections unnecessarily.
- No autoplay hero video/background.
- Local or system font stack; avoid blocking third-party font calls.
- Set image dimensions; lazy-load below-fold images only.
- Reserve space for the result panel and status messages where possible.
- Load the player only after a user asks to watch.
- Avoid analytics SDKs in v1 unless product decisions require them.

## 10. Trust and quality signals

- Accurate provider support claims.
- Real contact/reporting channel.
- Clearly visible non-affiliation statement where appropriate.
- Transparent Telegram gate explanation.
- Useful troubleshooting information.
- Consistent product/brand naming.
- Policy text that matches data retention and provider behavior.
- No fabricated testimonials, ratings, “users served” claims, or security guarantees.

A safe wording pattern is: “Diskwala Downloader & Player is an independent utility and is not affiliated with Diskwala or Flezen unless otherwise explicitly stated.” Use it only if independent/non-affiliated status is actually true.

## 11. Internationalization

Launch in one language only unless the owner specifies otherwise. Use simple, fluent English consistently across title, page copy, errors, FAQ, and policy notes. Do not mix translated headings with English error messages. If additional languages are added later, define locale URLs and hreflang only when real, translated pages exist; do not generate thin machine-translated variants solely for SEO.

## 12. Measurement plan

### Setup
- Google Search Console: verify the final domain property and submit sitemap.
- Analytics: optional and privacy-reviewed. Search Console can provide search-query/page data without adding a third-party analytics SDK.
- Uptime monitoring: verify homepage and key APIs without collecting source URLs.

### Monitor monthly
- Impressions, clicks, CTR, average position by query/page.
- Indexing/canonical issues.
- Core Web Vitals field data when available.
- Top support terms and searches that lead to the site.
- Landing-to-submit event aggregates only if tracked privacy-safely.
- Error categories for unsupported links and verification issues.

### SEO iteration cycle
1. Collect 4–8 weeks of baseline data after the site can be crawled.
2. Identify queries with relevant impressions, not simply the highest impressions.
3. Improve the page only where it better answers those user needs.
4. Check whether the product actually supports the promise made by the query.
5. Revalidate metadata, page copy, schema, and canonical after changes.
6. Record change date and outcome; don't assume every change improves rankings.

## 13. Pre-launch SEO checklist

- [ ] Confirm domain spelling/ownership and canonical host.
- [ ] HTTP → HTTPS and alternate host redirects are tested.
- [ ] Production homepage responds with 200.
- [ ] Title, description, canonical, robots metadata, and Open Graph tags are complete.
- [ ] Preview deploys do not compete with production in search.
- [ ] `robots.txt` and `sitemap.xml` are reachable and use the final host.
- [ ] Only real, enabled provider claims appear in content.
- [ ] One clear H1 and coherent section hierarchy.
- [ ] Page copy is original and useful, not copied from PlayDiskWala.
- [ ] JSON-LD is truthful and validates.
- [ ] No fabricated reviews, aggregate ratings, prices, or counts.
- [ ] Favicon and OG image are original and tested in link previews.
- [ ] No raw submitted URLs or tokens appear in page source metadata, analytics, or logs.
- [ ] Mobile rendering, performance, and accessibility checks pass.
- [ ] Search Console verification and sitemap submission are complete.
