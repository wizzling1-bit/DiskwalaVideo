interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory sliding-window rate limit storage per Worker isolate
const ipRateLimitStore = new Map<string, RateLimitEntry>();

// Maximum stored IPs before running cleanup
const MAX_STORE_SIZE = 10000;

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of ipRateLimitStore.entries()) {
    if (now > entry.resetAt) {
      ipRateLimitStore.delete(key);
    }
  }
}

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);

  // Handle CORS preflight OPTIONS requests immediately
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, xAPIverse-Key, cf-turnstile-response',
        'Access-Control-Max-Age': '86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }

  // Only apply API rate limiting to /api/* paths
  if (url.pathname.startsWith('/api/')) {
    const clientIp = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown_client';

    // Route specific limits (per 60-second window)
    const isTeraboxResolver = url.pathname.includes('/terabox');
    const limit = isTeraboxResolver ? 20 : 40;
    const windowMs = 60 * 1000;
    const now = Date.now();

    const rateKey = `${clientIp}:${isTeraboxResolver ? 'resolve' : 'general'}`;
    const current = ipRateLimitStore.get(rateKey);

    if (ipRateLimitStore.size > MAX_STORE_SIZE) {
      cleanupExpiredEntries();
    }

    if (!current || now > current.resetAt) {
      ipRateLimitStore.set(rateKey, {
        count: 1,
        resetAt: now + windowMs
      });
    } else {
      current.count += 1;
      if (current.count > limit) {
        const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Too Many Requests',
          details: `Rate limit exceeded. Please wait ${retryAfterSec} seconds before submitting more requests.`,
          retry_after: retryAfterSec
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(current.resetAt / 1000)),
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN'
          }
        });
      }
    }
  }

  // Proceed with the request
  const response = await next();

  // Create mutable response to attach security headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://checkout.razorpay.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https: http:",
    "connect-src 'self' https://fyjeyhrkuuuxxwhjnhov.supabase.co https://xapiverse.com https://challenges.cloudflare.com https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src 'self' https://challenges.cloudflare.com https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
  newHeaders.set('Content-Security-Policy', csp);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
