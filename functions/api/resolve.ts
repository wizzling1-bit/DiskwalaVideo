interface Env {
  TERABOXDL_API_KEY?: string;
  TERABOXDL_API_SECRET?: string;
  DISKWALA_API_KEY?: string;
  DISKWALA_API_SECRET?: string;
  TERABOXDL_API_URL?: string;
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
  'teraboxshare.com', 'www.teraboxshare.com',
  'tibabox.com', 'www.tibabox.com',
  'dubox.com', 'www.dubox.com',
  'momerybox.com', 'www.momerybox.com',
  'terafileshare.com', 'www.terafileshare.com',
  'diskwala.com', 'www.diskwala.com',
  'flezen.com', 'www.flezen.com'
];

async function generateHmacSignature(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatDuration(sec: any): string {
  const s = Number(sec);
  if (!s || isNaN(s) || s <= 0) return '';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function handleVideoResolution(context: RequestContext): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, cf-turnstile-response',
    'Content-Type': 'application/json'
  };

  try {
    const body = await context.request.json().catch(() => null) as { url?: string; turnstile_token?: string; provider?: string } | null;
    
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

    // Validate URL protocol & host
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
    const isDiskwala = host.includes('diskwala') || host.includes('diskwalaa');
    const isFlezen = host.includes('flezen');
    const isTerabox = (
      host.includes('terabox') ||
      host.includes('1024tera') ||
      host.includes('dubox') ||
      host.includes('mirrobox') ||
      host.includes('nephobox') ||
      host.includes('4funbox') ||
      host.includes('momerybox') ||
      host.includes('freeterabox') ||
      host.includes('terasharelink') ||
      host.includes('terafileshare') ||
      host.includes('teradrive') ||
      host.includes('tibabox')
    );

    const isAllowed = isDiskwala || isFlezen || isTerabox || ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed));
    if (!isAllowed) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Unsupported Domain',
        details: 'Only Diskwala, TeraBox, and Flezen links are supported.'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Optional Turnstile token verification
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
        // Pass through if turnstile verification service has transient network glitch
      }
    }

    // Secure API key & secret retrieval from server environment
    const apiKey = context.env?.TERABOXDL_API_KEY || context.env?.DISKWALA_API_KEY || 'tbx_j5FEgvZ9LgIe0dL8gdNStpHhk-shEik2L0fM4-LtR2Q';
    const apiSecret = context.env?.TERABOXDL_API_SECRET || context.env?.DISKWALA_API_SECRET || '77QTRbqibeEh0ECMWbnQa9G9YGaEydLPq0kf5O4uxtqZTIHS39mP_6W1pPvuZ5v-';
    const apiBaseUrl = (context.env?.TERABOXDL_API_URL || 'https://api.teraboxdl.site').replace(/\/+$/, '');

    let upstreamData: any = null;
    let upstreamStatus = 200;

    if (isDiskwala) {
      // Diskwala Extraction Endpoint
      const endpoint = `${apiBaseUrl}/v1/diskwala/extract`;
      const upstreamResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ url: targetUrl })
      });

      upstreamStatus = upstreamResponse.status;
      try {
        upstreamData = await upstreamResponse.json();
      } catch {
        upstreamData = null;
      }

      if (!upstreamResponse.ok || !upstreamData || upstreamData.error) {
        const errMsg = upstreamData?.error || 'Diskwala Video Extraction Failed';
        const detailsMsg = upstreamData?.details || upstreamData?.message || upstreamData?.error || 'Unable to extract Diskwala video. Link might be expired or invalid.';
        return new Response(JSON.stringify({
          status: 'error',
          error: errMsg,
          details: detailsMsg
        }), {
          status: upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502,
          headers: corsHeaders
        });
      }

      const fileItem = {
        name: upstreamData.file_name || 'Diskwala Video.mp4',
        title: upstreamData.file_name || 'Diskwala Video.mp4',
        filename: upstreamData.file_name || 'Diskwala Video.mp4',
        size: upstreamData.size,
        size_formatted: upstreamData.size_formatted || '',
        formattedSize: upstreamData.size_formatted || '',
        stream_url: upstreamData.stream_url || upstreamData.download_url || '',
        streamUrl: upstreamData.stream_url || upstreamData.download_url || '',
        normal_dlink: upstreamData.download_url || upstreamData.stream_url || '',
        downloadUrl: upstreamData.download_url || upstreamData.stream_url || '',
        thumbnail: upstreamData.thumbnail || null,
        duration: upstreamData.duration || '',
        quality: upstreamData.quality || 'HD',
        channel_name: upstreamData.channel_name || upstreamData.channel || upstreamData.author || 'Diskwala Cloud',
        type: 'video/mp4'
      };

      const normalizedVideo = {
        title: fileItem.name,
        filename: fileItem.name,
        size: fileItem.size,
        formattedSize: fileItem.size_formatted,
        thumbnail: fileItem.thumbnail,
        streamUrl: fileItem.stream_url,
        downloadUrl: fileItem.normal_dlink,
        duration: fileItem.duration,
        quality: fileItem.quality
      };

      return new Response(JSON.stringify({
        success: true,
        status: 'success',
        provider: 'diskwala',
        video: normalizedVideo,
        list: [fileItem],
        total_files: 1,
        credits_remaining: upstreamData.credits_remaining
      }), {
        status: 200,
        headers: corsHeaders
      });

    } else {
      // TeraBox (and Flezen / Other Supported) Extraction via Signed /v1/api
      const endpoint = `${apiBaseUrl}/v1/api`;
      const bodyObj = { url: targetUrl, dir_path: "", page: 1 };
      const bodyStr = JSON.stringify(bodyObj);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const stringToSign = `POST/v1/api${timestamp}${bodyStr}`;
      const signature = await generateHmacSignature(apiSecret, stringToSign);

      const upstreamResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        },
        body: bodyStr
      });

      upstreamStatus = upstreamResponse.status;
      try {
        upstreamData = await upstreamResponse.json();
      } catch {
        upstreamData = null;
      }

      if (!upstreamResponse.ok || !upstreamData || upstreamData.error || (typeof upstreamData.errno === 'number' && upstreamData.errno !== 0)) {
        const errorMsg = upstreamData?.error || 'TeraBox Resolution Failed';
        const errorDetails = upstreamData?.details || upstreamData?.errmsg || upstreamData?.message || upstreamData?.error || (
          upstreamData?.errno === -6 ? 'Authentication error or link expired on TeraBox.' :
          upstreamData?.errno === -1 ? 'This TeraBox link was not found or has been removed.' :
          upstreamStatus === 404 ? 'The requested video link could not be found.' :
          'Unable to extract video from TeraBox. Please check if the link is active.'
        );

        return new Response(JSON.stringify({
          success: false,
          status: 'error',
          error: errorMsg,
          details: errorDetails
        }), {
          status: upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502,
          headers: corsHeaders
        });
      }

      // Map TeraBox list items to normalized schema
      const rawList = Array.isArray(upstreamData.list) && upstreamData.list.length > 0 
        ? upstreamData.list 
        : [upstreamData];

      const mappedList = rawList.map((item: any) => {
        const fileName = item.server_filename || item.name || item.path?.split('/').pop() || upstreamData.title?.split('/').pop() || 'TeraBox Video.mp4';
        const sizeFormatted = item.formatted_size || (item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '');
        const thumb = item.thumbs?.url3 || item.thumbs?.url2 || item.thumbs?.url1 || item.thumbnail || item.thumbs?.icon || null;
        const dur = formatDuration(item.duration);
        const qualityLabel = item.quality ? `${item.quality}p HD` : 'HD Quality';

        return {
          name: fileName,
          title: fileName,
          filename: fileName,
          size: item.size,
          size_formatted: sizeFormatted,
          formattedSize: sizeFormatted,
          stream_url: item.stream_url || item.direct_link || '',
          streamUrl: item.stream_url || item.direct_link || '',
          normal_dlink: item.direct_link || item.download_url || item.dlink || item.stream_url || '',
          downloadUrl: item.direct_link || item.download_url || item.dlink || item.stream_url || '',
          thumbnail: thumb,
          duration: dur,
          quality: qualityLabel,
          channel_name: 'TeraBox Cloud',
          fast_stream_url: item.stream_url || null,
          type: 'video/mp4'
        };
      });

      const primaryVideo = mappedList[0];
      const normalizedVideo = {
        title: primaryVideo.name,
        filename: primaryVideo.name,
        size: primaryVideo.size,
        formattedSize: primaryVideo.size_formatted,
        thumbnail: primaryVideo.thumbnail || null,
        streamUrl: primaryVideo.stream_url,
        downloadUrl: primaryVideo.normal_dlink,
        duration: primaryVideo.duration,
        quality: primaryVideo.quality
      };

      return new Response(JSON.stringify({
        success: true,
        status: 'success',
        provider: 'terabox',
        video: normalizedVideo,
        list: mappedList,
        total_files: mappedList.length,
        total_size: upstreamData.total_size,
        credits_remaining: upstreamData.credits_remaining
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      error: 'Proxy Error',
      details: error?.message || 'Failed to communicate with video resolution provider.'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
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
