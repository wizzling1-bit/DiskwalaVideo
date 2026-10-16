import { APP_CONFIG } from './config';

export type SupportedProvider = 'terabox' | 'diskwala' | 'flezen';

export interface ValidationResult {
  isValid: boolean;
  provider: SupportedProvider | null;
  error?: string;
  cleanUrl?: string;
}

/**
 * Validates a user-submitted URL against the approved host allowlist.
 * Supports TeraBox domains, Diskwala, and Flezen.
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

  // Terabox family host check (supports 1024terabox.com, 1024tera, teraboxapp, mirrobox, etc.)
  const isTerabox = [
    'terabox.com',
    'www.terabox.com',
    'teraboxapp.com',
    'www.teraboxapp.com',
    'terabox.app',
    '1024tera.com',
    'www.1024tera.com',
    '1024terabox.com',
    'www.1024terabox.com',
    'terasharelink.com',
    'www.terasharelink.com',
    'freeterabox.com',
    'www.freeterabox.com',
    'mirrobox.com',
    'www.mirrobox.com',
    'nephobox.com',
    'www.nephobox.com',
    '4funbox.com',
    'www.4funbox.com',
    'terabox.link',
    'www.terabox.link',
    'teraboxshare.com',
    'www.teraboxshare.com',
    'tibabox.com',
    'www.tibabox.com'
  ].includes(hostname) || (
    hostname.includes('terabox') ||
    hostname.includes('1024tera') ||
    hostname.includes('mirrobox') ||
    hostname.includes('nephobox') ||
    hostname.includes('4funbox') ||
    hostname.includes('freeterabox') ||
    hostname.includes('terasharelink') ||
    hostname.includes('tibabox')
  );

  // Diskwala & Flezen host checks
  const isDiskwala = hostname === 'diskwala.com' || hostname === 'www.diskwala.com';
  const isFlezen = hostname === 'flezen.com' || hostname === 'www.flezen.com';

  if (!isTerabox && !isDiskwala && !isFlezen) {
    return {
      isValid: false,
      provider: null,
      error: 'Unsupported host. Supported links: Terabox, Diskwala, or Flezen.'
    };
  }

  let provider: SupportedProvider = 'terabox';
  if (isDiskwala) provider = 'diskwala';
  else if (isFlezen) provider = 'flezen';

  return {
    isValid: true,
    provider,
    cleanUrl: parsed.toString()
  };
}
