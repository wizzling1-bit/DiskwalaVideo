# 03 — UI/UX Design System

## 1. Design objective

Create an original, polished single-page interface that borrows the *visual principles* of the supplied PlayDiskWala screenshot: near-black page canvas, centered content column, high-contrast typography, a concise hero and utility form, softly bordered cards, small colored category labels, long-form instructional panels, FAQ accordion, and a deep green-black footer. Preserve the clean, premium, minimal feel without copying exact logo artwork, copy, or proprietary graphical assets.

The main interaction is a utility, not a marketing funnel. The URL input must be the visual anchor of the first viewport. Avoid login controls, pricing/premium CTAs, feature overload, large stock photos, busy gradients, and full-screen decorative video.

## 2. Experience principles

1. **Action before explanation:** input and primary action are visible immediately.
2. **One dominant action:** one bright green CTA; secondary actions are quieter.
3. **Calm contrast:** near-black surfaces and off-white text; colored accents indicate categories or state, not decoration everywhere.
4. **Clear progress:** every asynchronous state has status text and a recovery action.
5. **Mobile-first:** the form, modal buttons, cards, FAQ, and footer work as a one-column stack.
6. **No deceptive controls:** do not show functional-looking buttons for a provider/action that is not implemented.
7. **Accessible by design:** keyboard focus, semantic HTML, modal behavior, contrast, and target sizes are designed from the start.

## 3. Brand and visual language

### Working brand

- Product name: **Diskwala Downloader & Player**
- Wordmark: text-led wordmark with a simple, original rounded play mark; do not trace the reference logo.
- Personality: practical, fast-feeling, clear, low-friction, trustworthy.
- Visual motif: small play glyph, green action color, fine borders, tight eyebrow labels, softly tinted card surfaces.

### Avoid

- Reusing PlayDiskWala's logo or source images.
- Using “official” alongside third-party providers unless authorized.
- Purple/orange/blue accents on every component; keep green dominant and use accents selectively.
- Continuous glow/shadow effects that make the page look noisy or reduce text readability.
- Overly tiny body text to mimic a screenshot's dense desktop rendering. Readability wins.

## 4. Design tokens

These are starting values. Validate contrast with the chosen font weight and final rendered states before release.

### Color palette

| Token | Value | Purpose |
|---|---|---|
| `--color-bg` | `#050606` | Page background, very near black |
| `--color-surface-1` | `#0B0E0F` | Main cards and header shell |
| `--color-surface-2` | `#101516` | Hover, nested panels, result surface |
| `--color-surface-3` | `#151B1C` | Inputs and high-emphasis nested surfaces |
| `--color-border` | `#222A2B` | Standard border |
| `--color-border-strong` | `#344041` | Focus-adjacent and selected borders |
| `--color-text` | `#F3F7F6` | Primary text |
| `--color-text-secondary` | `#AEB9B7` | Body secondary text |
| `--color-text-muted` | `#7B8986` | Helper text and quiet labels; never for essential text at small size without contrast check |
| `--color-primary` | `#15C99A` | Primary action/brand accent |
| `--color-primary-hover` | `#27D8A8` | Hover/active action |
| `--color-primary-pressed` | `#0EA77E` | Pressed action |
| `--color-primary-soft` | `rgba(21, 201, 154, 0.12)` | Subtle tint/chips |
| `--color-info` | `#4FA8FF` | Informational status only |
| `--color-warning` | `#F5B942` | Caution/waiting status only |
| `--color-error` | `#FF6B79` | Error/danger status only |
| `--color-success` | `#34D399` | Success status; keep distinct from primary where needed |
| `--color-overlay` | `rgba(0, 0, 0, 0.72)` | Modal backdrop |

Use gradients only as low-opacity accents inside a panel (for example, a very subtle green-to-black radial tint). Avoid using a gradient as the main text background. The primary green must carry the strongest action affordance.

### Typography

Use a modern sans-serif such as **Inter** or a system fallback stack. If loading a web font, self-host WOFF2 and only the required weights/subsets. Suggested stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system,
             BlinkMacSystemFont, "Segoe UI", sans-serif;
```

| Token | Desktop guide | Mobile guide | Use |
|---|---:|---:|---|
| `--text-xs` | 0.75rem / 12px | 0.75rem / 12px | Eyebrow labels; use sparingly |
| `--text-sm` | 0.875rem / 14px | 0.875rem / 14px | Helper text, chips, metadata |
| `--text-base` | 1rem / 16px | 1rem / 16px | Main body text |
| `--text-lg` | 1.125rem / 18px | 1.0625rem / 17px | Lead paragraphs / card lead |
| `--text-xl` | 1.25rem / 20px | 1.125rem / 18px | Card headings |
| `--text-2xl` | 1.5rem / 24px | 1.375rem / 22px | Main section headings |
| `--text-3xl` | 1.875rem / 30px | 1.625rem / 26px | Large section headings |
| `--text-hero` | clamp(2.5rem, 5vw, 3.75rem) | clamp(2rem, 9vw, 2.75rem) | Hero title |

- Heading weight: 650–750 depending on the font.
- Body weight: 400–450.
- Body line-height: 1.6–1.75.
- Headings line-height: 1.05–1.2.
- Limit very wide body copy to roughly 65–75 characters per line.
- Use color, weight, and size to create hierarchy—not all-caps body copy.

### Spacing scale

Use a 4 px base scale; do not invent arbitrary spacing in every component.

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px`

Suggested tokens: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`, `--space-12: 48px`, `--space-16: 64px`, `--space-20: 80px`.

### Radius, borders, and shadows

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | Inputs, chips, small controls |
| `--radius-md` | `12px` | Buttons, cards |
| `--radius-lg` | `16px` | Major sections/cards |
| `--radius-xl` | `20px` | Hero form shell or modal |
| `--radius-pill` | `999px` | Small badges only |
| `--shadow-card` | `0 10px 30px rgba(0,0,0,.16)` | Very subtle card elevation |
| `--shadow-modal` | `0 24px 80px rgba(0,0,0,.48)` | Modal elevation |

Border is more important than shadow on the dark theme. Avoid bright outlines around every card.

## 5. Layout grid and breakpoints

### Content width

- Primary reading width: `min(100% - 32px, 1040px)`.
- Main hero utility form: maximum width around `720px`.
- Long-form editorial cards: maximum width around `960px`.
- Avoid the reference screenshot's extreme density on narrow phones; use legible body text and space between sections.

### Breakpoints

| Name | Width | Behavior |
|---|---:|---|
| Small phone | ≤ 359px | One column; compact padding; controls may wrap, never overflow |
| Mobile | 360–639px | Single-column cards, vertically stacked form if needed |
| Tablet | 640–899px | Two-column cards where content fits; form remains prominent |
| Desktop | 900–1199px | Centered max-width container; paired card layouts |
| Wide | ≥ 1200px | Keep the content line length constrained; do not stretch prose to screen edges |

Use content-driven breakpoints where a row no longer fits comfortably. These numbers are implementation starting points, not rules that override content fit.

## 6. Page layout and section design

### 6.1 Header

- Compact rounded shell centered inside the main container; subtle border and dark surface.
- Left: original play-mark + Diskwala Downloader wordmark.
- Center/right desktop: in-page links such as How it works, Supported sites, FAQ.
- Right: single quiet Telegram/community link if needed. No Login, Join Us, Premium, Pricing, or account avatar.
- Mobile: wordmark and a simple menu button if necessary; menu must be keyboard accessible. Keep the input/hero immediately below the header.
- Sticky header is optional. If used, ensure it does not obscure anchor targets (`scroll-margin-top`). Prefer static header for simplicity.

### 6.2 Hero

- Place a small eyebrow label above the title, e.g. “FREE LINK TOOL · DISKWALA + FLEZEN”.
- Hero title: “Diskwala Downloader & Player”, with one word highlighted in the green accent.
- Subtitle: one to two short lines, explaining supported links and outcomes without unverifiable speed/ad-free claims.
- Utility form shell with input and primary button; support paste and clear actions without overcrowding.
- Add one concise helper row below the form: supported provider names and a safe-use note.
- Do not insert a mandatory pop-up on first page load. The Telegram modal appears only after the visitor explicitly submits a link.

### 6.3 Utility/provider cards

- Two compact cards beneath the hero on desktop; stack on mobile.
- Card 1: “Watch online” with a simple play icon and accurate explanation of browser playback limitations.
- Card 2: “Download a file” with a download icon and accurate explanation of supported-file limitations.
- Use slightly differentiated icon tints, while retaining the same card style and typography.
- Keep cards informational until a supported result is ready; do not imply the action already works for every URL.

### 6.4 Guide and benefits sections

Suggested section rhythm:
- One large editorial card with a small label and 2–3 short paragraphs.
- Two-column row for “Supported sites” and “What happens to my link?”
- A tinted “How it works” card with three or four numbered steps.
- Separate watch/download instruction blocks.
- Mobile/desktop usage tips in paired cards.
- Privacy and safe-use panel.

Use original text, real provider icons only if permitted, and no gratuitous decorative imagery. Add visual variation through tiny icon blocks, line borders, section label colors, and surface shades rather than a new gradient palette per card.

### 6.5 FAQ

- Centered section heading and one-sentence explanation.
- Full-width stacked disclosure rows with question text left and chevron right.
- Distinct left border or number/icon is optional; do not use a different loud color for every row.
- Accordion panel has adequate padding and body line-height.
- Keyboard: Enter/Space toggles; arrow-key support optional but not required if buttons follow native behavior.
- Use the actual answer content in page HTML so users and crawlers can read it; do not fabricate structured data for hidden or nonexistent answers.

### 6.6 Footer

- Deep black-green background distinct from page canvas but not excessively saturated.
- Centered original brand mark, short description, utility links, policy/safe-use/contact links, and copyright line.
- No pricing, premium, login, or fabricated social links.
- Keep email/contact details configurable; do not ship placeholder text like `example@example.com` to production.

## 7. Key UI components

### 7.1 URL input group

**Anatomy:** label (visually hidden only if equivalent visible guidance exists), optional leading link icon, input, paste affordance, clear affordance, primary CTA, helper/error text.

**States:**
- default;
- hover;
- focus-visible;
- filled;
- invalid URL;
- unsupported provider;
- submitting;
- disabled while an active request is being processed.

**Behavior:**
- Enter submits when the form is valid.
- Paste button requests clipboard access only from its click handler.
- Clear resets value and validation message.
- Prevent double submit while a gate session is being created.
- Announce validation errors through an `aria-live="polite"` region.
- Never display a pasted raw URL in an error, analytics event, or toast.

### 7.2 Primary and secondary buttons

- Primary: green fill, high contrast, medium-to-semibold weight; minimum height 44 px on desktop and 48 px preferred on mobile.
- Secondary: surface or outlined treatment; never compete with the primary.
- Focus: visible outline distinct from the button edge; do not remove `outline` without replacement.
- Loading: spinner plus text such as “Checking…”; preserve width to reduce layout shift.
- Disabled: visibly disabled and programmatically disabled; don't use opacity alone if contrast becomes unreadable.

### 7.3 Telegram gate modal

**Trigger:** only after explicit form submission / action attempt.

**Layout:**
- Overlay with a centered dialog; max width about 480–520 px; safe viewport margin.
- Small Telegram icon or neutral channel symbol; title and short explanation; clear primary **Join Telegram** and secondary **Verify membership** actions.
- A small progress state: “Waiting for Telegram verification…” only when the backend is actually waiting.
- One quiet line that states the current verification result or reason for retry.
- Close/cancel action. Closing does not process the source link.

**Required states:**
1. Initial gate.
2. Starting verification session.
3. Waiting for user/bot handshake.
4. Checking channel membership.
5. Verified.
6. Not a member.
7. Expired challenge.
8. Telegram unavailable.
9. Session creation failed.

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, accessible name/description.
- Move focus into modal on open; keep Tab/Shift+Tab inside; Escape closes if no critical transition is in progress; restore focus to submit control on close.
- Avoid trapping a screen reader in an endless polling message. Use restrained announcements and a visible manual retry.
- Opening Telegram should not destroy the pending URL in the current tab.

### 7.4 Media result panel

- Render only after API success.
- File/stream title and provider tag; metadata line for MIME/size only when known.
- Optional video thumbnail only when returned through an approved provider response; avoid fetching arbitrary thumbnail URLs.
- Actions are capability-driven: show Watch when `capabilities.watch === true`; show Download when `capabilities.download === true`.
- Use native video controls and `preload="metadata"`; no autoplay with sound.
- Include “Use another link” reset action.
- If no stream or download capability exists, show a clear status instead of an empty card.

### 7.5 FAQ accordion

- Semantic `<button>` inside a heading or row.
- `aria-expanded`, `aria-controls`, unique panel IDs.
- Avoid animated height effects that cause scroll jumps. Respect `prefers-reduced-motion`.
- Keep answer width readable; no extra-long paragraph blocks.

### 7.6 Status messages

Use an icon plus text, never color alone.

| Status | Example | Tone |
|---|---|---|
| Info | “This link looks like a Flezen share URL.” | Neutral |
| Waiting | “Waiting for membership verification…” | Calm, no urgency |
| Success | “Membership verified. Checking this link…” | Brief, non-celebratory |
| Error | “We couldn’t verify your membership. Try again.” | Clear and actionable |
| Unsupported | “This link format is not supported yet.” | Honest, no blame |

## 8. Motion and interaction guidelines

- Prefer 120–200 ms transitions for button and border states.
- Use low-amplitude opacity/transform changes; avoid bounce, neon, parallax, and continuous shimmer.
- Loading spinner can animate, but must have accessible text and honor reduced motion where practical.
- Do not auto-scroll the page unexpectedly after a form submission. If moving focus to an error/result panel, do so intentionally and ensure the context is preserved.
- Use skeleton loading only if the wait is measurable and the placeholder helps; for short API calls, a button spinner/status line is enough.

## 9. Responsive behavior

### Small phones
- Body gutter: 16 px, optionally 20 px when viewport allows.
- Header wordmark can shorten to “Diskwala” visually while retaining the full accessible/product name elsewhere.
- Form stacks vertically if a side-by-side layout makes the input too narrow. Primary button full width.
- Cards become one column and retain 16–20 px padding.
- Modal fills most of the viewport width with safe area padding; buttons stack if necessary.
- Prevent `100vw` plus padding overflow and handle long user URLs with wrapping/ellipsis in UI only.

### Tablet
- Hero remains centered; utility form can become inline when input has sufficient width.
- Provider cards and guide cards may use two columns.

### Desktop
- Set consistent max-width; use a two-column card grid only where each card stays readable.
- Preserve a meaningful visual center rather than stretching sections edge to edge.
- Avoid too-small body text even on a large monitor.

## 10. Accessibility checklist

- [ ] Semantic landmarks: header, nav, main, sections, footer.
- [ ] One descriptive H1; logical H2/H3 hierarchy.
- [ ] Text contrast meets WCAG 2.2 AA targets, including muted text and disabled controls.
- [ ] All controls have accessible names; decorative icons are hidden from assistive tech.
- [ ] Keyboard-only journey works from URL input through gate and back to results.
- [ ] Modal focus containment/restoration works.
- [ ] Errors and async states are announced without excessive chatter.
- [ ] Touch targets are at least 44 × 44 CSS px where practical.
- [ ] Layout remains usable at 200% zoom and does not require horizontal scrolling at 320 CSS px except for genuinely two-dimensional content (none expected).
- [ ] `prefers-reduced-motion` honored.
- [ ] Video captions used when supplied; playback never begins automatically with sound.
- [ ] Focus is clearly visible on dark surfaces.
- [ ] Color is not the sole means of conveying error/success.

## 11. Content style rules

- Use short headings that state the benefit or task.
- Prefer active voice, plain language, and explicit limits.
- Don't promise “instant,” “all links,” “every format,” “unlimited,” or “high speed” unless proven through measurement and support data.
- Avoid repeating “Diskwala downloader” unnaturally in every section.
- Mention provider names only when relevant to support or instructions.
- State Telegram membership requirement at the gate and in a concise FAQ answer; don't hide it in the footer.
- Make non-affiliation and permitted-use wording visible and plain.

## 12. Example CSS token baseline

```css
:root {
  color-scheme: dark;
  --color-bg: #050606;
  --color-surface-1: #0b0e0f;
  --color-surface-2: #101516;
  --color-surface-3: #151b1c;
  --color-border: #222a2b;
  --color-border-strong: #344041;
  --color-text: #f3f7f6;
  --color-text-secondary: #aeb9b7;
  --color-text-muted: #7b8986;
  --color-primary: #15c99a;
  --color-primary-hover: #27d8a8;
  --color-error: #ff6b79;
  --color-warning: #f5b942;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --content-width: 1040px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.65;
}

:focus-visible {
  outline: 2px solid var(--color-primary-hover);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 13. Visual QA acceptance

- [ ] Compare desktop and mobile screenshots against the approved reference *structure*, not pixel-for-pixel copied assets.
- [ ] No premium/login elements remain.
- [ ] Hero form is clearly the main interactive area.
- [ ] Telegram gate only opens following the expected form action.
- [ ] Page does not jump or reflow unexpectedly when fonts load or a status message appears.
- [ ] All card content is readable at 320–390 px widths.
- [ ] Button hierarchy remains clear on lightless dark backgrounds.
- [ ] Modal looks and operates correctly when the mobile keyboard is open.
- [ ] FAQ works with keyboard and touch.
- [ ] No dead icons, placeholder cards, decorative links, or fake media controls.
- [ ] Design tokens are applied consistently instead of per-component hard-coded colors.
