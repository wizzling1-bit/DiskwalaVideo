# TeraWala 🚀

High-performance, modern web application and landing page to check, stream, and download TeraBox & Diskwala video links online. Built with **Astro 5**, **TypeScript**, and modern CSS.

- **Production Domain:** [terawala.com](https://terawala.com/)
- **Brand:** TeraWala

---

## ✨ Features

- ⚡ **Instant Link Validation:** Validates TeraBox (teraboxapp, 1024tera, etc.), Diskwala & Flezen share URLs in real time.
- 🎬 **In-Browser Video Preview:** Built-in interactive HTML5 video player with full playback controls and zero third-party ads.
- 🤖 **Telegram Bot Integration:** Direct handoff to official high-speed Telegram bot for uncapped MP4 downloads.
- 📱 **Mobile-First Responsive Design:** Tuned for all viewports (mobile, tablet, desktop) with dark emerald cyber aesthetics.
- 🛡️ **Edge-Ready Security:** Pre-configured security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`).
- 🔍 **Complete SEO Suite:** OpenGraph tags, Twitter cards, XML sitemaps, robots.txt, and Schema.org JSON-LD structured data (WebSite, WebApplication, BreadcrumbList, HowTo, FAQPage, Organization).
- 🤖 **AI-SEO / LLM Optimization:** Dedicated `llms.txt` and `llms-full.txt` knowledge files for Perplexity, ChatGPT, Claude, and Gemini citation.

---

## 🛠️ Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (Static Output)
- **Language:** TypeScript
- **Styling:** Vanilla CSS with Design System Tokens
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 🚀 Getting Started Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

---

## ☁️ Deploy to Cloudflare Pages

### Option 1: Git Integration (Recommended)
1. In Cloudflare Dashboard, navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository: `wizzling1-bit/DiskwalaVideo`.
3. Set build configuration:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment Variable:** `NODE_VERSION: 20` (or `22`)
4. Set custom domain: `terawala.com`.
5. Click **Save and Deploy**.

### Option 2: Wrangler CLI
```bash
npm run deploy
```
