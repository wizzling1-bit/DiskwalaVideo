import { APP_CONFIG } from './config';

export type SupportedProvider = 'diskwala' | 'flezen';

export interface ValidationResult {
  isValid: boolean;
  provider: SupportedProvider | null;
  error?: string;
  cleanUrl?: string;
}

/**
 * Validates a user-submitted URL against the approved host allowlist.
 * Ensures strict security against lookalike domains, non-HTTP(S) schemes, and SSRF attacks.
 */
export function validateSourceUrl(inputUrl: string): ValidationResult {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      provider: null,
      error: 'Please enter or paste a valid link.'
    };
  }

  let parsed: URL;
  try {
    // Add https:// if user omitted protocol for convenience
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(formatted);
  } catch {
    return {
      isValid: false,
      provider: null,
      error: 'Invalid URL format. Please provide a full link starting with http:// or https://'
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      provider: null,
      error: 'Only HTTP and HTTPS links are supported.'
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Exact allowlist match check
  const isDiskwala = hostname === 'diskwala.com' || hostname === 'www.diskwala.com';
  const isFlezen = hostname === 'flezen.com' || hostname === 'www.flezen.com';

  if (!isDiskwala && !isFlezen) {
    return {
      isValid: false,
      provider: null,
      error: 'Unsupported host. Supported links are diskwala.com and flezen.com only.'
    };
  }

  return {
    isValid: true,
    provider: isDiskwala ? 'diskwala' : 'flezen',
    cleanUrl: parsed.toString()
  };
}
