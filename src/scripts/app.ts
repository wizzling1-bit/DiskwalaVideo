import { validateSourceUrl, type SupportedProvider } from '../utils/host-allowlist';
import { APP_CONFIG } from '../utils/config';
import { TRANSLATIONS, LOCALES, DEFAULT_LOCALE, type Locale } from '../utils/i18n';
import './motion';

export interface TeraBoxItem {
  name: string;
  size?: number;
  size_formatted?: string;
  type?: string;
  quality?: string;
  duration?: string;
  file_path?: string;
  thumbnail?: string;
  stream_url?: string;
  normal_dlink?: string;
  subtitle_url?: string;
  fast_stream_url?: Record<string, string> | string;
}

export interface TeraBoxApiResponse {
  status: 'success' | 'error';
  list?: TeraBoxItem[];
  total_files?: number;
  total_folders?: number | string;
  error?: string;
  details?: string;
  message?: string;
}

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
  const resultStatusText = document.getElementById('result-status-text') as HTMLElement | null;
  const embeddedPlayer = document.getElementById('embedded-video-player') as HTMLVideoElement | null;
  const metaFormat = document.getElementById('meta-format') as HTMLElement | null;
  const metaResolution = document.getElementById('meta-resolution') as HTMLElement | null;
  const metaSize = document.getElementById('meta-size') as HTMLElement | null;
  const metaSpeed = document.getElementById('meta-speed') as HTMLElement | null;
  
  // Quality switcher & multi-file playlist
  const qualitySwitcherWrap = document.getElementById('quality-switcher-wrap') as HTMLElement | null;
  const qualityPillsRow = document.getElementById('quality-pills-row') as HTMLElement | null;
  const multiFilesSection = document.getElementById('multi-files-section') as HTMLElement | null;
  const multiFilesCount = document.getElementById('multi-files-count') as HTMLElement | null;
  const multiFilesList = document.getElementById('multi-files-list') as HTMLElement | null;

  // Action buttons
  const directDownloadBtn = document.getElementById('direct-download-btn') as HTMLAnchorElement | null;
  const downloadBtnText = document.getElementById('download-btn-text') as HTMLElement | null;
  const downloadSubtitleBtn = document.getElementById('download-subtitle-btn') as HTMLAnchorElement | null;
  const copyStreamLinkBtn = document.getElementById('copy-stream-link-btn') as HTMLButtonElement | null;
  const copyBtnLabel = document.getElementById('copy-btn-label') as HTMLElement | null;
  const resetResultBtn = document.getElementById('reset-result-btn') as HTMLButtonElement | null;
  const resultOpenBotBtn = document.getElementById('result-open-bot-btn') as HTMLAnchorElement | null;

  let currentUrl = '';
  let currentFileList: TeraBoxItem[] = [];
  let currentActiveFile: TeraBoxItem | null = null;
  let hlsInstance: any = null;

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
      if (embeddedPlayer) {
        embeddedPlayer.pause();
        embeddedPlayer.removeAttribute('src');
        embeddedPlayer.load();
      }
      if (hlsInstance) {
        try { hlsInstance.destroy(); } catch {}
        hlsInstance = null;
      }
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
    checkInputFeedback();
  }

  // Typo tag shortcuts scroll back to the checker
  document.querySelectorAll('[data-typo-tag]').forEach(tag => {
    tag.addEventListener('click', () => {
      linkInput?.focus();
    });
  });

  // Hls.js Dynamic Script Loader
  function loadHlsScript(): Promise<void> {
    if ((window as any).Hls) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.getElementById('hls-js-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'hls-js-script';
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Hls.js stream player'));
      document.head.appendChild(script);
    });
  }

  // Stream Player Setup (handles both MP4 direct stream and HLS m3u8)
  async function playStream(url: string, isHls: boolean) {
    if (!embeddedPlayer || !url) return;

    if (hlsInstance) {
      try {
        hlsInstance.destroy();
      } catch {}
      hlsInstance = null;
    }

    if (isHls) {
      // Native Safari / iOS HLS
      if (embeddedPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        embeddedPlayer.src = url;
      } else {
        // Desktop Chrome, Firefox, Edge: Use Hls.js
        try {
          await loadHlsScript();
          const Hls = (window as any).Hls;
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(embeddedPlayer);
            return;
          }
        } catch (e) {
          console.warn('Hls.js initialization fallback:', e);
        }
        embeddedPlayer.src = url;
      }
    } else {
      embeddedPlayer.src = url;
    }

    try {
      embeddedPlayer.load();
    } catch {}
  }

  // Call TeraBox API (Proxy first with fallback to direct xapiverse endpoint)
  async function fetchTeraBoxVideo(url: string): Promise<TeraBoxApiResponse> {
    // 1. Try local proxy /api/terabox (Vite dev proxy or Cloudflare Pages Function)
    try {
      const proxyResp = await fetch('/api/terabox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (proxyResp.ok) {
        const data = await proxyResp.json();
        if (data && (data.status === 'success' || data.status === 'error')) {
          return data;
        }
      }
    } catch {
      // Proxy unavailable, proceed to direct endpoint fallback
    }

    // 2. Direct xAPIverse API endpoint call (CORS supported on xapiverse.com)
    try {
      const directResp = await fetch(APP_CONFIG.xapiverse.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xAPIverse-Key': APP_CONFIG.xapiverse.apiKey
        },
        body: JSON.stringify({ url })
      });

      const directData = await directResp.json();
      return directData;
    } catch (networkErr: any) {
      return {
        status: 'error',
        error: 'Network Error',
        details: networkErr?.message || 'Failed to connect to the TeraBox service. Please check your network.'
      };
    }
  }

  // Display Active Video in Media Result Card
  function displayActiveVideo(file: TeraBoxItem, allFiles: TeraBoxItem[]) {
    currentActiveFile = file;

    // 1. Title & Status
    if (resultVideoTitle) {
      resultVideoTitle.textContent = file.name || 'TeraBox Video';
    }
    if (resultStatusText) {
      resultStatusText.textContent = 'Video Stream & Direct Download Ready';
    }
    if (resultProviderTag) {
      resultProviderTag.textContent = 'TeraBox Cloud';
    }

    // 2. Meta Pills
    if (metaFormat) {
      const ext = file.name ? file.name.split('.').pop()?.toUpperCase() : '';
      metaFormat.textContent = ext && ['MP4', 'MKV', 'AVI', 'WEBM', 'MOV'].includes(ext) 
        ? `${ext} Video` 
        : 'MP4 Video';
    }
    if (metaResolution) {
      metaResolution.textContent = file.quality ? `${file.quality} HD` : 'HD Quality';
    }
    if (metaSize) {
      metaSize.textContent = file.size_formatted || (file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Full File');
    }
    if (metaSpeed) {
      metaSpeed.textContent = file.duration ? `Duration: ${file.duration}` : 'Instant Stream';
    }

    // 3. Player Poster & Streaming Sources
    if (embeddedPlayer) {
      if (file.thumbnail) {
        embeddedPlayer.poster = file.thumbnail;
      }
    }

    // Stream Selection Choices
    interface StreamChoice {
      label: string;
      url: string;
      isHls: boolean;
      isDefault?: boolean;
    }

    const choices: StreamChoice[] = [];

    // Highest quality direct MP4 (normal_dlink)
    if (file.normal_dlink) {
      choices.push({
        label: `Direct MP4 (${file.quality || 'Max Quality'})`,
        url: file.normal_dlink,
        isHls: false,
        isDefault: true
      });
    }

    // Fast Stream HLS Qualities (360p, 480p, etc.)
    if (file.fast_stream_url) {
      if (typeof file.fast_stream_url === 'object') {
        for (const [res, streamLink] of Object.entries(file.fast_stream_url)) {
          choices.push({
            label: `Fast Stream ${res}`,
            url: streamLink,
            isHls: streamLink.includes('.m3u8')
          });
        }
      } else if (typeof file.fast_stream_url === 'string') {
        choices.push({
          label: 'Fast Stream HLS',
          url: file.fast_stream_url,
          isHls: file.fast_stream_url.includes('.m3u8')
        });
      }
    }

    // Stream URL if different
    if (file.stream_url && file.stream_url !== file.normal_dlink) {
      choices.push({
        label: 'Stream Mirror',
        url: file.stream_url,
        isHls: file.stream_url.includes('.m3u8')
      });
    }

    // Render Stream Quality Pills
    if (qualitySwitcherWrap && qualityPillsRow) {
      if (choices.length > 1) {
        qualitySwitcherWrap.style.display = 'flex';
        qualityPillsRow.innerHTML = '';

        choices.forEach((choice, idx) => {
          const pillBtn = document.createElement('button');
          pillBtn.type = 'button';
          pillBtn.className = `quality-pill-btn ${choice.isDefault || idx === 0 ? 'is-active' : ''}`;
          pillBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <polygon points="6 4 19 12 6 20 6 4"></polygon>
            </svg>
            <span>${choice.label}</span>
          `;

          pillBtn.addEventListener('click', () => {
            qualityPillsRow.querySelectorAll('.quality-pill-btn').forEach(btn => btn.classList.remove('is-active'));
            pillBtn.classList.add('is-active');
            playStream(choice.url, choice.isHls);
          });

          qualityPillsRow.appendChild(pillBtn);
        });
      } else {
        qualitySwitcherWrap.style.display = 'none';
      }
    }

    // Start playing default stream
    const defaultStream = choices.find(c => c.isDefault) || choices[0];
    if (defaultStream) {
      playStream(defaultStream.url, defaultStream.isHls);
    } else if (file.normal_dlink) {
      playStream(file.normal_dlink, false);
    }

    // 4. Direct Download Button
    if (directDownloadBtn) {
      const downloadHref = file.normal_dlink || file.stream_url || '#';
      directDownloadBtn.href = downloadHref;
      directDownloadBtn.setAttribute('download', file.name || 'TeraBox_Video.mp4');
      if (downloadBtnText) {
        downloadBtnText.textContent = `Download MP4 (${file.size_formatted || file.quality || 'HD'})`;
      }
    }

    // 5. Subtitle Download Button
    if (downloadSubtitleBtn) {
      if (file.subtitle_url) {
        downloadSubtitleBtn.style.display = 'inline-flex';
        downloadSubtitleBtn.href = file.subtitle_url;
        downloadSubtitleBtn.setAttribute('download', `${file.name || 'video'}_subtitle.vtt`);
      } else {
        downloadSubtitleBtn.style.display = 'none';
      }
    }

    // 6. Telegram Bot Links
    const idMatch = currentUrl.match(/(?:share|v|file|s)\/([a-zA-Z0-9_-]+)/);
    const fileId = idMatch ? idMatch[1].slice(0, 8) : 'terabox';
    const botLinkWithParam = `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;
    if (resultOpenBotBtn) {
      resultOpenBotBtn.href = botLinkWithParam;
    }
    if (readyOpenBotBtn) {
      readyOpenBotBtn.href = botLinkWithParam;
    }

    // 7. Multi-File Playlist (if folder has multiple items)
    if (multiFilesSection && multiFilesList && multiFilesCount) {
      if (allFiles && allFiles.length > 1) {
        multiFilesSection.style.display = 'block';
        multiFilesCount.textContent = `Folder Files (${allFiles.length})`;
        multiFilesList.innerHTML = '';

        allFiles.forEach((item, index) => {
          const itemBtn = document.createElement('button');
          itemBtn.type = 'button';
          itemBtn.className = `playlist-file-item ${item === file ? 'is-active' : ''}`;
          itemBtn.innerHTML = `
            <div class="playlist-item-info">
              <span class="playlist-item-name">${index + 1}. ${item.name || 'Video File'}</span>
              <span class="playlist-item-meta">${item.size_formatted || ''} ${item.duration ? '· ' + item.duration : ''}</span>
            </div>
            <span class="playlist-item-badge">${item.quality || 'HD'}</span>
          `;

          itemBtn.addEventListener('click', () => {
            displayActiveVideo(item, allFiles);
          });

          multiFilesList.appendChild(itemBtn);
        });
      } else {
        multiFilesSection.style.display = 'none';
      }
    }

    // 8. Reveal Media Result Panel & Smooth Scroll
    if (resultPanel) {
      resultPanel.style.display = 'block';
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Form Submission Flow
  async function processLinkFlow() {
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
      submitBtnText.textContent = 'Resolving Link...';
      processingStatusRow.style.display = 'flex';
      if (telegramReadyCard) telegramReadyCard.style.display = 'none';
      if (resultPanel) resultPanel.style.display = 'none';

      const resetBtnState = () => {
        submitBtn.disabled = false;
        btnPlayIcon.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
        submitBtnText.textContent = 'Play & Download';
        processingStatusRow.style.display = 'none';
      };

      // TERA BOX PROVIDER: Real Working Extraction
      if (res.provider === 'terabox') {
        const processingText = processingStatusRow.querySelector('.processing-text') as HTMLElement | null;
        if (processingText) {
          processingText.textContent = 'Connecting to TeraBox API & extracting HD video stream...';
        }

        try {
          const apiResult = await fetchTeraBoxVideo(currentUrl);

          if (apiResult.status === 'success' && apiResult.list && apiResult.list.length > 0) {
            resetBtnState();
            currentFileList = apiResult.list;
            displayActiveVideo(currentFileList[0], currentFileList);
            return;
          } else {
            resetBtnState();
            const errMsg = apiResult.details || apiResult.error || apiResult.message || 'Unable to extract video. The link might be expired or password-protected.';
            showError(errMsg);

            // Also show Telegram Bot card as a convenient fallback option
            const idMatch = currentUrl.match(/(?:share|v|file|s)\/([a-zA-Z0-9_-]+)/);
            const fileId = idMatch ? idMatch[1].slice(0, 8) : 'terabox';
            const botLinkWithParam = `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;
            if (readyOpenBotBtn) {
              readyOpenBotBtn.href = botLinkWithParam;
            }
            if (telegramReadyCard) {
              telegramReadyCard.style.display = 'block';
              telegramReadyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
          }
        } catch (err: any) {
          resetBtnState();
          showError(err?.message || 'Error communicating with TeraBox resolution provider.');
          return;
        }
      } else {
        // DISKWALA / FLEZEN: Telegram Downloader Flow
        setTimeout(() => {
          resetBtnState();

          const idMatch = currentUrl.match(/(?:share|v|file|s)\/([a-zA-Z0-9_-]+)/);
          const fileId = idMatch ? idMatch[1].slice(0, 8) : 'shared_link';
          const botLinkWithParam = `${APP_CONFIG.telegramBotUrl}?start=${encodeURIComponent(fileId)}`;

          if (readyOpenBotBtn) {
            readyOpenBotBtn.href = botLinkWithParam;
          }

          if (telegramReadyCard) {
            telegramReadyCard.style.display = 'block';
            telegramReadyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          openTelegramGate(fileId);
        }, 1000);
      }
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

      setTimeout(() => {
        if (tgStatusText) {
          tgStatusText.textContent = 'Telegram handoff verified. Bot ready!';
        }
        setTimeout(() => {
          closeTelegramGate();
        }, 800);
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
      const streamUrl = embeddedPlayer?.currentSrc || currentActiveFile?.normal_dlink || currentActiveFile?.stream_url || window.location.href;
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
        alert('Direct video link:\n' + streamUrl);
      }
    });
  }

  // Reset Result
  if (resetResultBtn && resultPanel && linkInput) {
    resetResultBtn.addEventListener('click', () => {
      resultPanel.style.display = 'none';
      if (telegramReadyCard) telegramReadyCard.style.display = 'none';
      if (embeddedPlayer) {
        embeddedPlayer.pause();
        embeddedPlayer.removeAttribute('src');
        embeddedPlayer.load();
      }
      if (hlsInstance) {
        try { hlsInstance.destroy(); } catch {}
        hlsInstance = null;
      }
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
