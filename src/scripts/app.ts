import { validateSourceUrl } from '../utils/host-allowlist';
import { APP_CONFIG } from '../utils/config';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('diskwala-form') as HTMLFormElement | null;
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
  const unlockWebPlayerBtn = document.getElementById('unlock-web-player-btn') as HTMLButtonElement | null;

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

    // Toggle button clickable state (Requirement 3)
    if (submitBtn) {
      submitBtn.disabled = !hasValue;
      submitBtn.classList.toggle('is-disabled', !hasValue);
    }

    // Toggle input wrapper filled light-style (Requirement 4 / Screenshot 3 & 4)
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

  function showProvider(provider: 'diskwala' | 'flezen') {
    if (providerPill && providerName) {
      providerName.textContent = provider === 'diskwala' ? 'Diskwala Link Detected' : 'Flezen Link Detected';
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

  // Form Submission Flow: Image 2 -> Image 3 (Loading) -> Image 4 (Ready)
  function processLinkFlow() {
    if (!linkInput) return;
    const raw = linkInput.value.trim();

    if (!raw) {
      showError('Please paste your Diskwala link before continuing.');
      linkInput.focus();
      return;
    }

    const res = validateSourceUrl(raw);
    if (!res.isValid) {
      showError(res.error || 'Invalid link format. Supported: diskwala.com, flezen.com');
      linkInput.focus();
      return;
    }

    hideError();
    currentUrl = res.cleanUrl || raw;

    // Transition to Processing State (Matching Screenshot 3)
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
        const idMatch = currentUrl.match(/(?:share|v|file)\/([a-zA-Z0-9_-]+)/);
        const fileId = idMatch ? idMatch[1].slice(0, 8) : 'shared_link';

        if (readyOpenBotBtn) {
          readyOpenBotBtn.href = APP_CONFIG.telegramBotUrl.includes('?start=')
            ? APP_CONFIG.telegramBotUrl
            : `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;
        }

        // Reveal Video Ready Telegram Hub (Matching Screenshot 4)
        if (telegramReadyCard) {
          telegramReadyCard.style.display = 'block';
          telegramReadyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 1100);
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      processLinkFlow();
    });
  }

  // Unlock in-browser player action (Stream Directly in Browser)
  if (unlockWebPlayerBtn && resultPanel) {
    unlockWebPlayerBtn.addEventListener('click', () => {
      const isFlezen = currentUrl.toLowerCase().includes('flezen.com');
      if (resultProviderTag) {
        resultProviderTag.textContent = isFlezen ? 'Flezen Cloud' : 'Diskwala Cloud';
      }
      if (resultVideoTitle) {
        resultVideoTitle.textContent = 'Demo preview — your file opens via the Telegram bot';
      }

      resultPanel.style.display = 'block';
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
});
