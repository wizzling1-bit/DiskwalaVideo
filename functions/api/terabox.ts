interface Env {
  XAPIVERSE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

const ALLOWED_HOSTS = [
  'terabox.com', 'www.terabox.com',
  'teraboxapp.com', 'www.teraboxapp.com',
  'terabox.app',
  '1024tera.com', 'www.1024tera.com',
  '1024terabox.com', 'www.1024terabox.com',
  'terasharelink.com', 'www.terasharelink.com',
  'freeterabox.com', 'www.freeterabox.com',
  'mirrobox.com', 'www.mirrobox.com',
  'nephobox.com', 'www.nephobox.com',
  '4funbox.com', 'www.4funbox.com',
  'terabox.link', 'www.terabox.link',
  'diskwala.com', 'www.diskwala.com',
  'flezen.com', 'www.flezen.com'
];

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, xAPIverse-Key, cf-turnstile-response',
    'Content-Type': 'application/json'
  };

  try {
    const body = await context.request.json().catch(() => null) as { url?: string; turnstile_token?: string } | null;
    
    if (!body || !body.url || typeof body.url !== 'string') {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'Bad Request', 
        details: 'Missing or invalid "url" in request payload.' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const targetUrl = body.url.trim();

    // SSRF & Host validation check
    let parsed: URL;
    try {
      const formatted = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;
      parsed = new URL(formatted);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Invalid URL',
        details: 'Provided URL is malformed or invalid.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const host = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed));
    if (!isAllowed) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Unsupported Domain',
        details: 'Only TeraBox, Diskwala, and Flezen links are supported.'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Optional Turnstile token check if provided in header or body
    const turnstileToken = context.request.headers.get('cf-turnstile-response') || body.turnstile_token;
    if (turnstileToken && context.env?.TURNSTILE_SECRET_KEY) {
      try {
        const formData = new FormData();
        formData.append('secret', context.env.TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);
        const cfCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData
        });
        const cfCheckData = await cfCheck.json() as { success: boolean };
        if (!cfCheckData.success) {
          return new Response(JSON.stringify({
            status: 'error',
            error: 'Security Verification Failed',
            details: 'Cloudflare Turnstile token was rejected.'
          }), {
            status: 403,
            headers: corsHeaders
          });
        }
      } catch {
        // Continue if verification service has transient network glitch
      }
    }

    const apiKey = context.env?.XAPIVERSE_KEY || 'xapi_e8ad5454c8b1d7f8935b5482fa6aa52d';

    const upstreamResponse = await fetch('https://xapiverse.com/api/terabox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xAPIverse-Key': apiKey
      },
      body: JSON.stringify({ url: targetUrl })
    });

    const responseData = await upstreamResponse.text();
    return new Response(responseData, {
      status: upstreamResponse.status,
      headers: corsHeaders
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      error: 'Proxy Error',
      details: error?.message || 'Failed to communicate with TeraBox resolution provider.'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, xAPIverse-Key, cf-turnstile-response',
      'Access-Control-Max-Age': '86400'
    }
  });
}
