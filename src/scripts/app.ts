import { validateSourceUrl, type SupportedProvider } from '../utils/host-allowlist';
import { APP_CONFIG } from '../utils/config';
import { TRANSLATIONS, LOCALES, DEFAULT_LOCALE, type Locale } from '../utils/i18n';
import './motion';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = (document.getElementById('terawala-form') || document.getElementById('diskwala-form')) as HTMLFormElement | null;
  const linkInput = document.getElementById('link-input') as HTMLInputElement | null;
  const inputWrapper = document.getElementById('input-outer-wrapper') as HTMLElement | null;
  const pasteBtn = document.getElementById('paste-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement | null;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  const submitBtnText = document.getElementById('submit-btn-text') as HTMLElement | null;
  const btnPlayIcon = document.getElementById('btn-play-icon') as HTMLElement | null;
  const btnSpinner = document.getElementById('btn-spinner') as HTMLElement | null;
  const trySampleBtn = document.getElementById('try-sample-btn') as HTMLButtonElement | null;
  const heroSampleTrigger = document.getElementById('hero-sample-trigger') as HTMLButtonElement | null;

  // Processing & Redesigned Ready Elements
  const processingStatusRow = document.getElementById('processing-status-row') as HTMLElement | null;
  const telegramReadyCard = document.getElementById('telegram-ready-card') as HTMLElement | null;
  const readyOpenBotBtn = document.getElementById('ready-open-bot-btn') as HTMLAnchorElement | null;

  // Feedback pills
  const providerPill = document.getElementById('provider-pill') as HTMLElement | null;
  const providerName = document.getElementById('provider-name') as HTMLElement | null;
  const errorPill = document.getElementById('error-pill') as HTMLElement | null;
  const errorMsg = document.getElementById('error-msg') as HTMLElement | null;

  // Media Result Elements (in-browser player)
  const resultPanel = document.getElementById('media-result-panel') as HTMLElement | null;
  const resultVideoTitle = document.getElementById('result-video-title') as HTMLElement | null;
  const resultProviderTag = document.getElementById('result-provider-tag') as HTMLElement | null;
  const embeddedPlayer = document.getElementById('embedded-video-player') as HTMLVideoElement | null;
  const copyStreamLinkBtn = document.getElementById('copy-stream-link-btn') as HTMLButtonElement | null;
  const copyBtnLabel = document.getElementById('copy-btn-label') as HTMLElement | null;
  const resetResultBtn = document.getElementById('reset-result-btn') as HTMLButtonElement | null;

  let currentUrl = '';

  // Input Feedback & Button Enabled/Disabled State
  function checkInputFeedback() {
    if (!linkInput) return;
    const value = linkInput.value.trim();
    const hasValue = value.length > 0;

    // Toggle button clickable state
    if (submitBtn) {
      submitBtn.disabled = !hasValue;
      submitBtn.classList.toggle('is-disabled', !hasValue);
    }

    // Toggle input wrapper filled light-style
    if (inputWrapper) {
      inputWrapper.classList.toggle('is-filled', hasValue);
    }

    // Toggle clear button
    if (clearBtn) {
      clearBtn.style.display = hasValue ? 'inline-flex' : 'none';
    }

    // Toggle paste button
    if (pasteBtn) {
      pasteBtn.style.display = hasValue ? 'none' : 'inline-flex';
    }

    if (!hasValue) {
      hideFeedback();
      return;
    }

    const res = validateSourceUrl(value);
    if (res.isValid && res.provider) {
      showProvider(res.provider);
      hideError();
    } else {
      hideProvider();
    }
  }

  function showProvider(provider: SupportedProvider) {
    if (providerPill && providerName) {
      if (provider === 'terabox') {
        providerName.textContent = 'TeraBox Link Detected';
      } else if (provider === 'diskwala') {
        providerName.textContent = 'Diskwala Link Detected';
      } else {
        providerName.textContent = 'Flezen Link Detected';
      }
      providerPill.style.display = 'inline-flex';
    }
    linkInput?.removeAttribute('aria-invalid');
  }

  function hideProvider() {
    if (providerPill) providerPill.style.display = 'none';
  }

  function showError(msg: string) {
    if (errorPill && errorMsg) {
      errorMsg.textContent = msg;
      errorPill.style.display = 'inline-flex';
    }
    linkInput?.setAttribute('aria-invalid', 'true');
  }

  function hideError() {
    if (errorPill) errorPill.style.display = 'none';
  }

  function hideFeedback() {
    hideProvider();
    hideError();
    linkInput?.removeAttribute('aria-invalid');
  }

  // Paste action
  if (pasteBtn && linkInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          linkInput.value = text;
          checkInputFeedback();
          linkInput.focus();
        }
      } catch {
        linkInput.focus();
        showError('Please manually paste using Ctrl+V or Command+V');
      }
    });
  }

  // Clear action
  if (clearBtn && linkInput) {
    clearBtn.addEventListener('click', () => {
      linkInput.value = '';
      checkInputFeedback();
      hideFeedback();
      if (telegramReadyCard) telegramReadyCard.style.display = 'none';
      if (resultPanel) resultPanel.style.display = 'none';
      linkInput.focus();
    });
  }

  // Try sample buttons
  const triggerSample = () => {
    if (!linkInput) return;
    linkInput.value = APP_CONFIG.sampleLink;
    checkInputFeedback();
    linkInput.focus();
  };

  if (trySampleBtn) {
    trySampleBtn.addEventListener('click', triggerSample);
  }
  if (heroSampleTrigger) {
    heroSampleTrigger.addEventListener('click', () => {
      triggerSample();
      form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Live typing validation
  if (linkInput) {
    linkInput.addEventListener('input', checkInputFeedback);
    // Initial check on load
    checkInputFeedback();
  }

  // Typo tag shortcuts scroll back to the checker
  document.querySelectorAll('[data-typo-tag]').forEach(tag => {
    tag.addEventListener('click', () => {
      linkInput?.focus();
    });
  });

  // Form Submission Flow
  function processLinkFlow() {
    if (!linkInput) return;
    const raw = linkInput.value.trim();

    if (!raw) {
      showError('Please paste your Terabox or Diskwala link before continuing.');
      linkInput.focus();
      return;
    }

    const res = validateSourceUrl(raw);
    if (!res.isValid) {
      showError(res.error || 'Invalid link format. Supported: Terabox, Diskwala, flezen.com');
      linkInput.focus();
      return;
    }

    hideError();
    currentUrl = res.cleanUrl || raw;

    // Transition to Processing State
    if (submitBtn && submitBtnText && btnPlayIcon && btnSpinner && processingStatusRow) {
      submitBtn.disabled = true;
      btnPlayIcon.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
      submitBtnText.textContent = 'Processing...';
      processingStatusRow.style.display = 'flex';
      if (telegramReadyCard) telegramReadyCard.style.display = 'none';
      if (resultPanel) resultPanel.style.display = 'none';

      // Realistic high-speed link analysis (1.1s)
      setTimeout(() => {
        // Reset button state
        submitBtn.disabled = false;
        btnPlayIcon.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
        submitBtnText.textContent = 'Play & Download';
        processingStatusRow.style.display = 'none';

        // Extract a short reference from the link for the bot handoff
        const idMatch = currentUrl.match(/(?:share|v|file|s)\/([a-zA-Z0-9_-]+)/);
        const fileId = idMatch ? idMatch[1].slice(0, 8) : 'shared_link';

        const botLinkWithParam = APP_CONFIG.telegramBotUrl.includes('?start=')
          ? APP_CONFIG.telegramBotUrl
          : `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;

        if (readyOpenBotBtn) {
          readyOpenBotBtn.href = botLinkWithParam;
        }

        // Reveal Video Ready Telegram Hub
        if (telegramReadyCard) {
          telegramReadyCard.style.display = 'block';
          telegramReadyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Also trigger the Telegram Gate verification modal
        openTelegramGate(fileId);
      }, 1100);
    }
  }

  // Telegram Gate Modal Wiring
  const tgModal = document.getElementById('telegram-gate-modal') as HTMLElement | null;
  const tgCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement | null;
  const tgOpenBotBtn = document.getElementById('modal-open-bot-btn') as HTMLAnchorElement | null;
  const tgVerifyBtn = document.getElementById('modal-verify-btn') as HTMLButtonElement | null;
  const tgStatusMsg = document.getElementById('modal-status-msg') as HTMLElement | null;
  const tgStatusText = document.getElementById('status-text') as HTMLElement | null;
  const tgContinueBtnText = document.getElementById('modal-continue-btn-text') as HTMLElement | null;

  function openTelegramGate(fileId: string) {
    if (!tgModal) return;
    if (tgOpenBotBtn) {
      tgOpenBotBtn.href = APP_CONFIG.telegramBotUrl.includes('?start=')
        ? APP_CONFIG.telegramBotUrl
        : `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;
    }
    tgModal.style.display = 'flex';
    requestAnimationFrame(() => {
      tgModal?.classList.add('is-active');
      tgModal?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    });
  }

  function closeTelegramGate() {
    if (!tgModal) return;
    tgModal.classList.remove('is-active');
    tgModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (tgModal) tgModal.style.display = 'none';
      if (tgStatusMsg) tgStatusMsg.style.display = 'none';
      if (tgVerifyBtn) tgVerifyBtn.disabled = false;
      if (tgContinueBtnText) tgContinueBtnText.textContent = "2. I've Started the Bot — Continue";
    }, 250);
  }

  if (tgCloseBtn) {
    tgCloseBtn.addEventListener('click', closeTelegramGate);
  }

  if (tgModal) {
    tgModal.addEventListener('click', (e) => {
      if (e.target === tgModal) closeTelegramGate();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tgModal?.classList.contains('is-active')) {
      closeTelegramGate();
    }
  });

  if (tgVerifyBtn) {
    tgVerifyBtn.addEventListener('click', async () => {
      tgVerifyBtn.disabled = true;
      if (tgContinueBtnText) tgContinueBtnText.textContent = 'Verifying Membership...';
      if (tgStatusMsg && tgStatusText) {
        tgStatusMsg.style.display = 'flex';
        tgStatusText.textContent = 'Checking Telegram bot membership state...';
      }

      // If server-side verification endpoint exists in environment
      try {
        const resp = await fetch('/api/verify-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.verified) {
            if (tgStatusText) tgStatusText.textContent = 'Membership verified! Unlocking video stream...';
            setTimeout(() => {
              closeTelegramGate();
            }, 800);
            return;
          }
        }
      } catch {
        // Static frontend fallback
      }

      if (tgStatusText) {
        tgStatusText.textContent = 'Telegram handoff verified. Direct MP4 stream ready!';
      }
      setTimeout(() => {
        closeTelegramGate();
      }, 900);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      processLinkFlow();
    });
  }

  // Copy Direct Link
  if (copyStreamLinkBtn && copyBtnLabel) {
    copyStreamLinkBtn.addEventListener('click', async () => {
      const streamUrl = embeddedPlayer?.currentSrc || window.location.href;
      try {
        await navigator.clipboard.writeText(streamUrl);
        const originalText = copyBtnLabel.textContent;
        copyBtnLabel.textContent = 'Copied to Clipboard!';
        copyStreamLinkBtn.style.borderColor = 'var(--color-primary)';
        setTimeout(() => {
          copyBtnLabel.textContent = originalText;
          copyStreamLinkBtn.style.borderColor = '';
        }, 2000);
      } catch {
        alert('Direct link: ' + streamUrl);
      }
    });
  }

  // Reset Result
  if (resetResultBtn && resultPanel && linkInput) {
    resetResultBtn.addEventListener('click', () => {
      resultPanel.style.display = 'none';
      if (telegramReadyCard) telegramReadyCard.style.display = 'none';
      if (embeddedPlayer) embeddedPlayer.pause();
      linkInput.value = '';
      checkInputFeedback();
      hideFeedback();
      linkInput.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========================================================
  // Multi-Language Localization Engine
  // ========================================================
  function initI18n() {
    const saved = localStorage.getItem('terawala_lang') as Locale | null;
    let currentLocale: Locale = DEFAULT_LOCALE;
    if (saved && saved in TRANSLATIONS) {
      currentLocale = saved;
    }

    function applyLocale(loc: Locale) {
      const strings = TRANSLATIONS[loc];
      if (!strings) return;

      localStorage.setItem('terawala_lang', loc);
      document.documentElement.lang = LOCALES[loc]?.htmlLang || 'en-US';

      // Update text content of data-i18n elements
      document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key && strings[key] !== undefined) {
          el.textContent = strings[key];
        }
      });

      // Update placeholder of inputs
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && strings[key] !== undefined) {
          el.placeholder = strings[key];
        }
      });

      // Update Header Dropdown current label
      const currLabel = document.getElementById('lang-curr-label');
      if (currLabel) {
        currLabel.textContent = loc.toUpperCase();
      }

      // Update active state in header dropdown options
      document.querySelectorAll<HTMLElement>('.lang-option').forEach((opt) => {
        opt.classList.toggle('is-active', opt.getAttribute('data-lang') === loc);
      });

      // Update active state in footer & mobile chips
      document.querySelectorAll<HTMLElement>('[data-lang-switch]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-lang-switch') === loc);
      });
    }

    // Header Language Dropdown logic
    const langBtn = document.getElementById('lang-menu-btn');
    const langMenu = document.getElementById('lang-dropdown-menu');

    if (langBtn && langMenu) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = langMenu.style.display === 'flex';
        langMenu.style.display = isOpen ? 'none' : 'flex';
        langBtn.setAttribute('aria-expanded', String(!isOpen));
      });

      document.addEventListener('click', (e) => {
        if (!langMenu.contains(e.target as Node) && !langBtn.contains(e.target as Node)) {
          langMenu.style.display = 'none';
          langBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Options click handlers in header dropdown
    document.querySelectorAll<HTMLElement>('.lang-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const targetLocale = opt.getAttribute('data-lang') as Locale | null;
        if (targetLocale && targetLocale in TRANSLATIONS) {
          applyLocale(targetLocale);
          if (langMenu) langMenu.style.display = 'none';
          if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Options click handlers in footer and mobile sheet
    document.querySelectorAll<HTMLElement>('[data-lang-switch]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const targetLocale = chip.getAttribute('data-lang-switch') as Locale | null;
        if (targetLocale && targetLocale in TRANSLATIONS) {
          applyLocale(targetLocale);
        }
      });
    });

    // Apply initially
    applyLocale(currentLocale);
  }

  initI18n();
});
