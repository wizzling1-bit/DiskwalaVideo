interface Env {
  TURNSTILE_SECRET_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, cf-turnstile-response',
    'Content-Type': 'application/json'
  };

  try {
    const body = await context.request.json().catch(() => null) as { token?: string } | null;
    const token = body?.token?.trim();

    if (!token) {
      return new Response(JSON.stringify({
        status: 'error',
        valid: false,
        error: 'Missing security token.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const secretKey = context.env?.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    const clientIp = context.request.headers.get('cf-connecting-ip') || '';

    // Verify token with Cloudflare Turnstile Siteverify endpoint
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const cfResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const cfResult = await cfResp.json() as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    if (cfResult.success) {
      return new Response(JSON.stringify({
        status: 'success',
        valid: true,
        hostname: cfResult.hostname
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({
        status: 'error',
        valid: false,
        error: 'Cloudflare Turnstile challenge verification failed.',
        error_codes: cfResult['error-codes'] || []
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({
      status: 'error',
      valid: false,
      error: err?.message || 'Failed to verify security challenge.'
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
      'Access-Control-Allow-Headers': 'Content-Type, cf-turnstile-response',
      'Access-Control-Max-Age': '86400'
    }
  });
}
