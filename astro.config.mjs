// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://terawala.com',
  trailingSlash: 'always',
  vite: {
    plugins: [
      {
        name: 'xapiverse-dev-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const pathname = req.url ? req.url.split('?')[0] : '';
            if ((pathname === '/api/terabox' || pathname === '/api/terabox/') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const upstream = await fetch('https://xapiverse.com/api/terabox', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'xAPIverse-Key': 'xapi_e8ad5454c8b1d7f8935b5482fa6aa52d'
                    },
                    body: bodyStr
                  });
                  const jsonText = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.end(jsonText);
                } catch (err) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  const msg = err instanceof Error ? err.message : String(err);
                  res.end(JSON.stringify({ status: 'error', error: 'Upstream Error', details: msg }));
                }
              });
              return;
            }
            if ((pathname === '/api/terabox' || pathname === '/api/terabox/') && req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, xAPIverse-Key, Authorization');
              res.end();
              return;
            }
            if ((pathname === '/api/verify-turnstile' || pathname === '/api/verify-turnstile/') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
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

                  // Verify with Cloudflare siteverify endpoint or accept test tokens
                  const formData = new FormData();
                  formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA');
                  formData.append('response', token);

                  const cfResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    body: formData
                  });
                  const cfData = await cfResp.json();
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'success', valid: !!cfData.success }));
                } catch (e) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'success', valid: true, note: 'Dev bypass on network exception' }));
                }
              });
              return;
            }
            if ((pathname === '/api/verify-turnstile' || pathname === '/api/verify-turnstile/') && req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, cf-turnstile-response');
              res.end();
              return;
            }
            next();
          });
        }
      }
    ]
  }
});
