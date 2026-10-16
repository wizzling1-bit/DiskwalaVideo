interface Env {
  XAPIVERSE_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, xAPIverse-Key',
    'Content-Type': 'application/json'
  };

  try {
    const body = await context.request.json().catch(() => null) as { url?: string } | null;
    
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
      'Access-Control-Allow-Headers': 'Content-Type, xAPIverse-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}
