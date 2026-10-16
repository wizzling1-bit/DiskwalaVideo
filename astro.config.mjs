// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://terawala.com',
  trailingSlash: 'always',
  vite: {
    server: {
      proxy: {
        '/api/terabox': {
          target: 'https://xapiverse.com',
          changeOrigin: true,
          headers: {
            'xAPIverse-Key': 'xapi_e8ad5454c8b1d7f8935b5482fa6aa52d'
          }
        }
      }
    }
  }
});
