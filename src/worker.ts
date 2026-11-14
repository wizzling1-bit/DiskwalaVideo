import { onRequestGet as healthGet, onRequestOptions as healthOptions } from '../functions/api/health';
import { handleVideoResolution, onRequestOptions as resolveOptions } from '../functions/api/resolve';
import { onRequestPost as turnstilePost, onRequestOptions as turnstileOptions } from '../functions/api/verify-turnstile';
import { onRequestPost as createOrderPost, onRequestOptions as createOrderOptions } from '../functions/api/payment/create-order';
import { onRequestPost as verifyPaymentPost, onRequestOptions as verifyPaymentOptions } from '../functions/api/payment/verify';
import { onRequestPost as webhookPost } from '../functions/api/payment/webhook';
import { onRequest as middlewareOnRequest } from '../functions/_middleware';

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  TERABOXDL_API_KEY?: string;
  TERABOXDL_API_SECRET?: string;
  TERABOXDL_API_URL?: string;
  DISKWALA_API_KEY?: string;
  DISKWALA_API_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  PUBLIC_RAZORPAY_KEY_ID?: string;
  PUBLIC_SITE_URL?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Use middleware for CORS, rate limiting, and security headers
    return middlewareOnRequest({
      request,
      next: async () => {
        // Handle OPTIONS preflight for all /api routes
        if (request.method === 'OPTIONS') {
          if (pathname.startsWith('/api/payment/create-order')) return createOrderOptions();
          if (pathname.startsWith('/api/payment/verify')) return verifyPaymentOptions();
          if (pathname.startsWith('/api/health')) return healthOptions();
          if (pathname.startsWith('/api/verify-turnstile')) return turnstileOptions();
          return resolveOptions();
        }

        // Route: GET /api/health
        if (pathname === '/api/health' || pathname === '/api/health/') {
          if (request.method === 'GET') {
            return healthGet();
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'GET, OPTIONS' }
          });
        }

        // Route: POST /api/resolve (and legacy /api/terabox, /api/diskwala)
        if (
          pathname === '/api/resolve' || pathname === '/api/resolve/' ||
          pathname === '/api/terabox' || pathname === '/api/terabox/' ||
          pathname === '/api/diskwala' || pathname === '/api/diskwala/'
        ) {
          if (request.method === 'POST') {
            return handleVideoResolution({ request, env });
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
          });
        }

        // Route: POST /api/verify-turnstile
        if (pathname === '/api/verify-turnstile' || pathname === '/api/verify-turnstile/') {
          if (request.method === 'POST') {
            return turnstilePost({ request, env });
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
          });
        }

        // Route: POST /api/payment/create-order
        if (pathname === '/api/payment/create-order' || pathname === '/api/payment/create-order/') {
          if (request.method === 'POST') {
            return createOrderPost({ request, env });
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
          });
        }

        // Route: POST /api/payment/verify
        if (pathname === '/api/payment/verify' || pathname === '/api/payment/verify/') {
          if (request.method === 'POST') {
            return verifyPaymentPost({ request, env });
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
          });
        }

        // Route: POST /api/payment/webhook
        if (pathname === '/api/payment/webhook' || pathname === '/api/payment/webhook/') {
          if (request.method === 'POST') {
            return webhookPost({ request, env });
          }
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
          });
        }

        // Unmatched /api/* route -> 404 JSON
        if (pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({
            status: 'error',
            error: 'Not Found',
            message: `API endpoint '${pathname}' was not found.`
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Static Asset fallback: serve from ./dist
        if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
          return env.ASSETS.fetch(request);
        }

        return new Response('Asset worker binding missing', { status: 500 });
      }
    });
  }
};
