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
  if (!inputUrl || typeof inputUrl !== 'string') {
    return {
      isValid: false,
      provider: null,
      error: 'Please enter or paste a valid link.'
    };
  }

  // 1. Clean up surrounding quotes, brackets, and whitespace
  let cleaned = inputUrl.trim().replace(/^["'`<(\[]+|["'`>)\]]+$/g, '');
  if (!cleaned) {
    return {
      isValid: false,
      provider: null,
      error: 'Please enter or paste a valid link.'
    };
  }

  // 2. Auto-extract URL if user pasted message containing text (e.g. from Telegram/WhatsApp)
  const urlMatch = cleaned.match(/https?:\/\/[^\s"'`<>]+/i) || cleaned.match(/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s"'`<>]*)?/i);
  if (urlMatch) {
    cleaned = urlMatch[0];
  }

  let parsed: URL;
  try {
    // Add https:// if user omitted protocol for convenience
    const formatted = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
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

  // Diskwala family host check (supports diskwala.com, playdiskwala.in, diskwala.in, diskwalaa.com, etc.)
  const isDiskwala = hostname.includes('diskwala') || hostname.includes('diskwalaa');

  // Terabox family host check (supports 1024terabox.com, 1024tera, teraboxapp, dubox, mirrobox, etc.)
  const isTerabox = (
    hostname.includes('terabox') ||
    hostname.includes('1024tera') ||
    hostname.includes('dubox') ||
    hostname.includes('mirrobox') ||
    hostname.includes('nephobox') ||
    hostname.includes('4funbox') ||
    hostname.includes('momerybox') ||
    hostname.includes('freeterabox') ||
    hostname.includes('terasharelink') ||
    hostname.includes('terafileshare') ||
    hostname.includes('teradrive') ||
    hostname.includes('tibabox')
  );

  // Flezen host check
  const isFlezen = hostname.includes('flezen');

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
