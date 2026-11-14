// @ts-check
import { defineConfig } from 'astro/config';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Load local .env into process.env for Vite dev middleware
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

/** @param {any} sec */
function formatDuration(sec) {
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

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://terawala.in',
  trailingSlash: 'ignore',
  vite: {
    plugins: [
      {
        name: 'video-resolver-dev-proxy',
        configureServer(server) {
          const resolverMiddleware = async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
            const pathname = req.url ? req.url.split('?')[0] : '';
            const normalizedPath = pathname.replace(/\/+$/, '');

            if (normalizedPath === '/api/health') {
              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                res.end();
                return;
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, service: 'terawala-api', environment: 'development' }));
              return;
            }

            const isResolverRoute = ['/api/resolve', '/api/diskwala', '/api/terabox'].includes(normalizedPath);

            if (isResolverRoute) {
              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, cf-turnstile-response');
                res.setHeader('Access-Control-Max-Age', '86400');
                res.end();
                return;
              }

              if (req.method === 'POST') {
                let bodyStr = '';
                req.on('data', (/** @type {any} */ chunk) => { bodyStr += chunk; });
                req.on('end', async () => {
                  try {
                    const parsedBody = JSON.parse(bodyStr || '{}');
                    const targetUrl = (parsedBody.url || '').trim();

                    if (!targetUrl) {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json');
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.end(JSON.stringify({ success: false, status: 'error', error: 'Bad Request', details: 'Missing URL in payload.' }));
                      return;
                    }

                    const isDiskwala = /diskwala/i.test(targetUrl);
                    const apiKey = process.env.TERABOXDL_API_KEY || process.env.DISKWALA_API_KEY || 'tbx_j5FEgvZ9LgIe0dL8gdNStpHhk-shEik2L0fM4-LtR2Q';
                    const apiSecret = process.env.TERABOXDL_API_SECRET || process.env.DISKWALA_API_SECRET || '77QTRbqibeEh0ECMWbnQa9G9YGaEydLPq0kf5O4uxtqZTIHS39mP_6W1pPvuZ5v-';
                    const apiBaseUrl = (process.env.TERABOXDL_API_URL || 'https://api.teraboxdl.site').replace(/\/+$/, '');

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');

                    if (isDiskwala) {
                      const upstreamEndpoint = `${apiBaseUrl}/v1/diskwala/extract`;
                      const upstream = await fetch(upstreamEndpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-API-Key': apiKey
                        },
                        body: JSON.stringify({ url: targetUrl })
                      });

                      let upstreamData = null;
                      try {
                        upstreamData = await upstream.json();
                      } catch {
                        upstreamData = null;
                      }

                      if (!upstream.ok || !upstreamData || upstreamData.error) {
                        res.statusCode = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
                        res.end(JSON.stringify({
                          success: false,
                          status: 'error',
                          error: upstreamData?.error || 'Diskwala Extraction Failed',
                          details: upstreamData?.details || upstreamData?.message || upstreamData?.error || 'Unable to extract Diskwala video.'
                        }));
                        return;
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

                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        success: true,
                        status: 'success',
                        provider: 'diskwala',
                        video: normalizedVideo,
                        list: [fileItem],
                        total_files: 1,
                        credits_remaining: upstreamData.credits_remaining
                      }));
                      return;
                    } else {
                      // TeraBox Extraction via HMAC-signed /v1/api
                      const upstreamEndpoint = `${apiBaseUrl}/v1/api`;
                      const bodyObj = { url: targetUrl, dir_path: "", page: 1 };
                      const bodyStr = JSON.stringify(bodyObj);
                      const timestamp = Math.floor(Date.now() / 1000).toString();
                      const stringToSign = `POST/v1/api${timestamp}${bodyStr}`;
                      const hmac = crypto.createHmac('sha256', apiSecret);
                      hmac.update(stringToSign);
                      const signature = hmac.digest('hex');

                      const upstream = await fetch(upstreamEndpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-API-Key': apiKey,
                          'X-Timestamp': timestamp,
                          'X-Signature': signature
                        },
                        body: bodyStr
                      });

                      let upstreamData = null;
                      try {
                        upstreamData = await upstream.json();
                      } catch {
                        upstreamData = null;
                      }

                      if (!upstream.ok || !upstreamData || upstreamData.error || (typeof upstreamData.errno === 'number' && upstreamData.errno !== 0)) {
                        res.statusCode = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
                        const errorMsg = upstreamData?.error || 'TeraBox Resolution Failed';
                        const errorDetails = upstreamData?.details || upstreamData?.errmsg || upstreamData?.message || upstreamData?.error || (
                          upstreamData?.errno === -6 ? 'Authentication error or link expired on TeraBox.' :
                          upstreamData?.errno === -1 ? 'This TeraBox link was not found or has been removed.' :
                          'Unable to extract video from TeraBox. Please check if the link is active.'
                        );
                        res.end(JSON.stringify({
                          success: false,
                          status: 'error',
                          error: errorMsg,
                          details: errorDetails
                        }));
                        return;
                      }

                      const rawList = Array.isArray(upstreamData.list) && upstreamData.list.length > 0
                        ? upstreamData.list
                        : [upstreamData];

                      const mappedList = rawList.map((/** @type {any} */ item) => {
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

                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        success: true,
                        status: 'success',
                        provider: 'terabox',
                        video: normalizedVideo,
                        list: mappedList,
                        total_files: mappedList.length,
                        total_size: upstreamData.total_size,
                        credits_remaining: upstreamData.credits_remaining
                      }));
                      return;
                    }
                  } catch (err) {
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    const msg = err instanceof Error ? err.message : String(err);
                    res.end(JSON.stringify({ success: false, status: 'error', error: 'Upstream Error', details: msg }));
                  }
                });
                return;
              }
            }

            // Razorpay Payment Endpoints
            if (normalizedPath.startsWith('/api/payment/')) {
              const paymentSubPath = normalizedPath.replace(/^\/api\/payment\/?/, '');

              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');
                res.end();
                return;
              }

              if (req.method === 'POST') {
                let bodyStr = '';
                req.on('data', (/** @type {any} */ chunk) => { bodyStr += chunk; });
                req.on('end', async () => {
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('Access-Control-Allow-Origin', '*');

                  const keyId = process.env.RAZORPAY_KEY_ID || process.env.PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TzwwtKPEYYEiHK';
                  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'n37CwlaDEBvgBcF8VM64XsYc';
                  const supabaseUrl = (process.env.PUBLIC_SUPABASE_URL || 'https://fyjeyhrkuuuxxwhjnhov.supabase.co').replace(/\/+$/, '');
                  const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5amV5aHJrdXV1eHh3aGpuaG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTcxNTAsImV4cCI6MjEwNzc5MzE1MH0.eZIc7JQ9X3niGjNTjGmiztedCqwKpeEWrDFgE9c2VOw';

                  const plans = {
                    plan_starter_24h: { id: 'plan_starter_24h', name: 'Turbo 24h VIP', price: 9, days: 1 },
                    plan_pro_monthly: { id: 'plan_pro_monthly', name: 'Pro Monthly VIP', price: 99, days: 30 },
                    plan_quarterly_3m: { id: 'plan_quarterly_3m', name: 'Ultra Quarterly VIP', price: 249, days: 90 },
                    plan_unlimited_year: { id: 'plan_unlimited_year', name: 'Elite Annual VIP', price: 999, days: 365 }
                  };

                  try {
                    if (paymentSubPath === 'create-order') {
                      const authHeader = req.headers['authorization'];
                      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
                      if (!token) {
                        res.statusCode = 401;
                        res.end(JSON.stringify({ success: false, error: 'Unauthorized', details: 'Sign-in required.' }));
                        return;
                      }

                      // Verify user with Supabase
                      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey }
                      });
                      if (!userRes.ok) {
                        res.statusCode = 401;
                        res.end(JSON.stringify({ success: false, error: 'Unauthorized', details: 'Invalid session token.' }));
                        return;
                      }
                      const userData = /** @type {any} */ (await userRes.json());
                      const parsed = JSON.parse(bodyStr || '{}');
                      const planId = parsed.plan_id;
                      const plan = /** @type {any} */ (plans)[planId];
                      if (!plan) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Invalid Plan', details: 'Unknown plan.' }));
                        return;
                      }

                      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
                      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Basic ${basicAuth}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          amount: plan.price * 100,
                          currency: 'INR',
                          receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                          notes: {
                            user_id: userData.id,
                            user_email: userData.email || '',
                            plan_id: plan.id,
                            plan_days: String(plan.days)
                          }
                        })
                      });

                      const rzpOrder = /** @type {any} */ (await rzpRes.json());
                      if (!rzpRes.ok || !rzpOrder.id) {
                        res.statusCode = 502;
                        res.end(JSON.stringify({ success: false, error: 'Gateway Error', details: rzpOrder?.error?.description || 'Failed to create Razorpay order.' }));
                        return;
                      }

                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        success: true,
                        order_id: rzpOrder.id,
                        amount: rzpOrder.amount,
                        currency: rzpOrder.currency || 'INR',
                        key_id: keyId,
                        plan: plan
                      }));
                      return;
                    }

                    if (paymentSubPath === 'verify') {
                      const authHeader = req.headers['authorization'];
                      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
                      if (!token) {
                        res.statusCode = 401;
                        res.end(JSON.stringify({ success: false, error: 'Unauthorized', details: 'Sign-in required.' }));
                        return;
                      }

                      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey }
                      });
                      if (!userRes.ok) {
                        res.statusCode = 401;
                        res.end(JSON.stringify({ success: false, error: 'Unauthorized', details: 'Invalid session token.' }));
                        return;
                      }
                      const userData = /** @type {any} */ (await userRes.json());
                      const parsed = JSON.parse(bodyStr || '{}');
                      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = parsed;

                      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Bad Request', details: 'Missing payment verification data.' }));
                        return;
                      }

                      const plan = /** @type {any} */ (plans)[plan_id];
                      if (!plan) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Invalid Plan' }));
                        return;
                      }

                      // Cryptographic signature check
                      const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
                      const sigBuffer = Buffer.from(razorpay_signature);
                      const expBuffer = Buffer.from(expectedSignature);
                      if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Signature Mismatch', details: 'Invalid payment signature.' }));
                        return;
                      }

                      // Fetch payment from Razorpay
                      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
                      const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
                        headers: { 'Authorization': `Basic ${basicAuth}` }
                      });
                      const rzpPayment = /** @type {any} */ (await rzpPayRes.json());
                      if (!rzpPayRes.ok || (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized')) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Payment Incomplete', details: `Payment status: ${rzpPayment?.status}` }));
                        return;
                      }

                      // Activate in Supabase via RPC
                      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/activate_subscription`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'apikey': anonKey,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          p_user_id: userData.id,
                          p_plan_id: plan.id,
                          p_plan_name: plan.name,
                          p_amount: plan.price,
                          p_razorpay_order_id: razorpay_order_id,
                          p_razorpay_payment_id: razorpay_payment_id,
                          p_razorpay_signature: razorpay_signature,
                          p_days: plan.days
                        })
                      });
                      const rpcData = /** @type {any} */ (await rpcRes.json().catch(() => null));

                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        success: true,
                        status: 'success',
                        message: 'Payment verified and VIP subscription activated.',
                        plan_name: plan.name,
                        valid_until: rpcData?.valid_until || null
                      }));
                      return;
                    }

                    if (paymentSubPath === 'webhook') {
                      const sig = req.headers['x-razorpay-signature'];
                      const whSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'terawala_whsec_live_2026';
                      const expectedSig = crypto.createHmac('sha256', whSecret).update(bodyStr).digest('hex');
                      if (sig !== expectedSig) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid webhook signature' }));
                        return;
                      }
                      res.statusCode = 200;
                      res.end(JSON.stringify({ status: 'ok', received: true }));
                      return;
                    }
                  } catch (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: 'Server Error', details: String(err) }));
                    return;
                  }
                });
                return;
              }
            }

            // Verify Turnstile dev route
            if ((normalizedPath === '/api/verify-turnstile') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (/** @type {any} */ chunk) => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(bodyStr || '{}');
                  const token = (parsed.token || '').trim();
                  if (!token) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ status: 'error', valid: false, error: 'Missing security token.' }));
                    return;
                  }

                  const formData = new FormData();
                  formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA');
                  formData.append('response', token);

                  const cfResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    body: formData
                  });
                  const cfData = /** @type {any} */ (await cfResp.json());
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'success', valid: !!cfData.success }));
                } catch {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'success', valid: true, note: 'Dev bypass on network exception' }));
                }
              });
              return;
            }

            if ((normalizedPath === '/api/verify-turnstile') && req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, cf-turnstile-response');
              res.end();
              return;
            }

            next();
          };

          // Unshift to the front of the Connect middleware stack so it intercepts
          // /api/resolve and /api/resolve/ before Astro's trailingSlash router middleware.
          if (Array.isArray(server.middlewares.stack)) {
            server.middlewares.stack.unshift({
              route: '',
              handle: resolverMiddleware
            });
          } else {
            server.middlewares.use(resolverMiddleware);
          }
        }
      }
    ]
  }
});
