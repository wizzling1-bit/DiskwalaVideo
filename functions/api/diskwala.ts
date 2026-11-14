import { handleVideoResolution } from './resolve';

interface Env {
  DISKWALA_API_KEY?: string;
  TERABOXDL_API_KEY?: string;
  TERABOXDL_API_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  return handleVideoResolution(context);
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, cf-turnstile-response',
      'Access-Control-Max-Age': '86400'
    }
  });
}

