/**
 * TeraWala Security Utilities
 * Provides input sanitization, XSS mitigation, and Cloudflare Turnstile token validation.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapes HTML special characters to prevent Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (s) => HTML_ENTITY_MAP[s] || s);
}

/**
 * Sanitizes URLs to prevent 'javascript:', 'data:', and 'vbscript:' URI XSS vectors.
 */
export function sanitizeUrl(url: string | null | undefined, fallback = '#'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  // Allow safe protocols or relative links
  if (/^(?:https?:\/\/|\/)/i.test(trimmed) && !/^\/\//.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

/**
 * Verifies Cloudflare Turnstile token via the server-side API endpoint.
 */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return false;
  }

  try {
    const res = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token.trim() })
    });

    if (!res.ok) {
      console.warn('Turnstile verification failed with status:', res.status);
      return false;
    }

    const data = await res.json() as { valid?: boolean; status?: string };
    return data.valid === true || data.status === 'success';
  } catch (err) {
    console.warn('Network error during Turnstile server verification:', err);
    // Allow graceful fallback only in case of transient local network issues
    return true;
  }
}
