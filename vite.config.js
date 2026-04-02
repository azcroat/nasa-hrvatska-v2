import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Naša Hrvatska — Our Croatia',
        short_name: 'Naša Hrvatska',
        description: 'Interactive Croatian language learning with vocabulary, grammar, games, and cultural immersion',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fffbeb',
        theme_color: '#0e7490',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'lifestyle'],
        iarc_rating_id: '',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ],
        // screenshots: [] — placeholder files not present; remove to prevent 404s in PWA install prompt.
        // Add home-desktop.png (1280x720) and home-mobile.png (390x844) to public/screenshots/ to re-enable.
      },
      workbox: {
        navigationPreload: true,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        cacheId: 'nasa-hrvatska-v13',
        // Precache only critical app-shell assets: CSS, fonts, favicon/manifest icons.
        // JS chunks (100+ files, ~5MB) and images are handled by runtimeCaching below.
        globPatterns: ['**/*.css', '**/*.woff2', '**/*.ico', '**/icon*.png', '**/apple-touch*.png'],
        globIgnores: ['**/chunk-data*.js', '**/splash/**', '**/screenshots/**'],
        runtimeCaching: [
          {
            // Data chunks (vocab, stories, songs, pitch, daily content) — stale-while-revalidate.
            // cacheWillUpdate plugin: reject any response with Content-Type: text/html
            // (the Cloudflare /* /index.html 200 SPA fallback returns status 200 WITH
            // text/html — so cacheableResponse: {statuses:[200]} alone is not enough).
            urlPattern: /\/assets\/chunk-(data|stories|pitch-data|daily|songs)[^/]*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nasa-hrvatska-v13-data',
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    const ct = response && response.headers && response.headers.get('content-type');
                    if (ct && ct.startsWith('text/html')) return null;
                    return response;
                  }
                }
              ]
            }
          },
          {
            // All JS chunks — stale-while-revalidate so app loads fast on repeat visits.
            // IMPORTANT: Two plugins work together to handle stale-chunk crashes after deploy:
            //
            // 1. fetchDidSucceed — runs before the response is returned to the caller.
            //    Throws "Failed to fetch" when Cloudflare returns the SPA fallback index.html
            //    (text/html, status 200) for non-existent old-hash chunk URLs. This converts
            //    a silent MIME-type crash into a proper fetch failure that lazyWithReload catches.
            //
            // 2. cacheWillUpdate — prevents the HTML response from ever entering the cache,
            //    so future requests for the same (stale) hash also go to network.
            urlPattern: /\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nasa-hrvatska-v13-js',
              expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  fetchDidSucceed: async ({ response }) => {
                    const ct = response && response.headers && response.headers.get('content-type');
                    if (ct && ct.startsWith('text/html')) {
                      // Cloudflare SPA fallback returned HTML instead of JS.
                      // Throw so the dynamic import rejects with "Failed to fetch",
                      // which lazyWithReload catches and handles with a page reload.
                      throw new Error('Failed to fetch');
                    }
                    return response;
                  },
                  cacheWillUpdate: async ({ response }) => {
                    const ct = response && response.headers && response.headers.get('content-type');
                    if (ct && ct.startsWith('text/html')) return null;
                    return response;
                  }
                }
              ]
            }
          },
          {
            // SVG/PNG/WebP/JPG images — long-lived CacheFirst (icons, flags, illustrations)
            urlPattern: /\.(svg|png|webp|jpg|jpeg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nasa-hrvatska-v13-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // HTML navigation: always fetch fresh from network (10s timeout), fall back to cache
            // offline. 10s (up from 3s) gives CDN enough time during high-traffic deploys.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nasa-hrvatska-v13-html',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nasa-hrvatska-v13-audio',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nasa-hrvatska-v13-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.firebaseio\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',              // Modern target — native async/await, smaller output
    outDir: 'dist',
    sourcemap: 'hidden',
    minify: 'esbuild',
    cssCodeSplit: true,            // CSS per chunk (avoids one monolithic stylesheet)
    reportCompressedSize: false,   // Skip gzip-size computation at build time for faster builds
    chunkSizeWarningLimit: 600,    // chunk-data (vocabulary/lesson data) is inherently ~537 KB
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 0, // Don't merge tiny chunks into startup bundle — prevents chunk-data becoming a static startup dep
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/posthog-js')) return 'vendor-posthog';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
          // Large agent-generated data files — each in its own lazy chunk so they don't
          // bloat the main chunk-data that screens always pull on first render.
          if (id.includes('src/data/gradedStories')) return 'chunk-stories';
          if (id.includes('src/data/pitchAccentContent')) return 'chunk-pitch-data';
          if (id.includes('src/data/daily-content')) return 'chunk-daily';
          if (id.includes('croatia/LyricsSongData')) return 'chunk-songs';
          // data.jsx (~700 KB) contains all vocabulary/lesson data — isolate it so other chunks
          // stay small. App.jsx now imports only the ~20 symbols it actually uses directly.
          if (id.includes('src/data') || id.includes('src/lib/appData')) return 'chunk-data';
          // Context and hooks — break circular deps between croatia/practice/learn chunks
          if (id.includes('src/context')) return 'chunk-context';
          if (id.includes('src/hooks')) return 'chunk-hooks';
          // Individual screen files (croatia/, practice/, profile/, learn/) are NOT matched here.
          // They fall through to Rollup's default — each lazy-loaded screen becomes its own chunk.
        }
      }
    }
  }
});
