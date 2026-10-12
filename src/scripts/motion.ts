/**
 * motion-web Runtime Choreography Engine
 * Based on feitangyuan/motion-web principles:
 * - Exponential follow smoothing (1 - exp(-k * dt))
 * - Real physics: underdamped spring landing & elastic return
 * - 3D Perspective Card Tilt & cursor spotlight (Handfeel §5)
 * - Magnetic Hover (Pattern Recipe #2)
 * - Scroll-driven progress indicator (Pattern Recipe #16)
 * - IntersectionObserver staggered reveal cascade
 * - prefers-reduced-motion compliance
 */

export function initMotionWeb() {
  // Check reduced motion preference first
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Immediately reveal all elements without transitions
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  // 1. Top Viewport Scroll Progress Bar
  initScrollProgressBar();

  // 2. Scroll Reveal & Intersection Observer Choreography
  initScrollReveals();

  // 3. Smooth Text Reveal
  initTextLineReveals();

  // 4. Interactive 3D Perspective Tilt & Spotlight on Cards (Desktop fine pointer only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    initCard3DTiltAndSpotlight();
    initMagneticButtons();
  }

  // 5. Enhanced Accordion Animation
  initSmoothAccordionMotion();
}

/**
 * 1. Luminous Top Scroll Progress Bar with RAF smoothing
 */
function initScrollProgressBar() {
  let progressBar = document.getElementById('motion-scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'motion-scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);
  }

  let currentProgress = 0;
  let targetProgress = 0;
  let lastTime = performance.now();

  function updateTarget() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      targetProgress = 0;
    } else {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / totalHeight));
    }
  }

  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('resize', updateTarget, { passive: true });
  updateTarget();

  function tick(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Frame-rate independent exponential follow: 1 - exp(-k * dt)
    const k = 14; // response coefficient
    currentProgress += (targetProgress - currentProgress) * (1 - Math.exp(-k * dt));

    if (progressBar) {
      progressBar.style.width = `${(currentProgress * 100).toFixed(2)}%`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/**
 * 2. Scroll-triggered reveal system with automatic grid stagger
 */
function initScrollReveals() {
  // Auto-mark key structural cards for reveal if not already explicitly marked
  const targetSelectors = [
    '.bento-card',
    '.step-card',
    '.provider-card',
    '.benefit-card',
    '.compare-card',
    '.editorial-subcard',
    '.editorial-callout',
    '.feature-card',
    '.faq-item'
  ];

  targetSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      if (!el.hasAttribute('data-reveal')) {
        el.setAttribute('data-reveal', '');
        // Apply stagger delay mod 6
        const delayStep = (index % 4) + 1;
        el.setAttribute('data-reveal-delay', String(delayStep));
      }
    });
  });

  const revealElements = document.querySelectorAll('[data-reveal]');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/**
 * 3. Text Line & Mask Reveals
 */
function initTextLineReveals() {
  const titles = document.querySelectorAll<HTMLElement>('.hero-title-prefix, .hero-title-accent, .section-title');

  titles.forEach((title) => {
    // Only apply if not already wrapped
    if (title.querySelector('.reveal-text-inner')) return;

    const originalText = title.innerHTML;
    title.innerHTML = `<span class="reveal-text-line"><span class="reveal-text-inner is-revealed">${originalText}</span></span>`;
  });
}

/**
 * 4. Interactive 3D Perspective Tilt & Cursor Spotlight (Handfeel §5)
 */
function initCard3DTiltAndSpotlight() {
  const cards = document.querySelectorAll<HTMLElement>(
    '.bento-card, .provider-card, .feature-card, .step-card, .compare-card, .editorial-subcard, .bezel-inner'
  );

  cards.forEach((card) => {
    card.classList.add('card-interactive-spotlight');

    let isHovered = false;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let rafId: number | null = null;
    let lastTime = performance.now();

    function renderTilt(now: number) {
      if (!isHovered && Math.abs(currentTiltX) < 0.05 && Math.abs(currentTiltY) < 0.05) {
        card.style.transform = '';
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Exponential spring follow
      const k = 16;
      currentTiltX += (targetTiltX - currentTiltX) * (1 - Math.exp(-k * dt));
      currentTiltY += (targetTiltY - currentTiltY) * (1 - Math.exp(-k * dt));

      card.style.transform = `perspective(1000px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) translateY(-3px)`;

      rafId = requestAnimationFrame(renderTilt);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update cursor spotlight variables
      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      // Normalize coordinate: -1 to 1 from card center
      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      const maxTilt = 4.5; // degrees max tilt
      targetTiltX = -normY * maxTilt;
      targetTiltY = normX * maxTilt;

      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(renderTilt);
      }
    });

    card.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      targetTiltX = 0;
      targetTiltY = 0;
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
}

/**
 * 5. Magnetic Hover on Primary Buttons (Pattern Recipe #2)
 */
function initMagneticButtons() {
  const magneticElements = document.querySelectorAll<HTMLElement>(
    '[data-magnetic], .btn-primary, .ready-telegram-btn, .badge-pill'
  );

  magneticElements.forEach((el) => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let isHovered = false;

    function renderMagnet(now: number) {
      if (!isHovered && Math.abs(currentX) < 0.1 && Math.abs(currentY) < 0.1) {
        el.style.transform = '';
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const k = 18;
      currentX += (targetX - currentX) * (1 - Math.exp(-k * dt));
      currentY += (targetY - currentY) * (1 - Math.exp(-k * dt));

      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

      rafId = requestAnimationFrame(renderMagnet);
    }

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const strength = 0.28;
      targetX = (e.clientX - cx) * strength;
      targetY = (e.clientY - cy) * strength;

      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(renderMagnet);
      }
    });

    el.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    el.addEventListener('mouseleave', () => {
      isHovered = false;
      targetX = 0;
      targetY = 0;
    });
  });
}

/**
 * 6. Smooth Accordion Animation with Physical Spring Feedback
 */
function initSmoothAccordionMotion() {
  const triggers = document.querySelectorAll<HTMLButtonElement>('.faq-trigger');

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const chevron = btn.querySelector<HTMLElement>('.faq-chevron');
      if (chevron) {
        chevron.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
    });
  });
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotionWeb);
  } else {
    initMotionWeb();
  }
}
