import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
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
        screenshots: [
          {
            src: 'screenshots/home-mobile.svg',
            sizes: '390x844',
            type: 'image/svg+xml',
            form_factor: 'narrow',
            label: 'Home screen — streak, daily lesson, and SRS review',
          },
          {
            src: 'screenshots/home-desktop.svg',
            sizes: '1280x720',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'Desktop — full learning dashboard',
          },
        ],
      },
      workbox: {
        navigationPreload: true,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        cacheId: 'nasa-hrvatska-v16',
        // No navigateFallback — Workbox's NavigationRoute + navigateFallback intercepts ALL
        // navigation requests and serves the cached fallback immediately, even when online.
        // The NetworkFirst handler below already manages navigation with a 10s timeout and
        // proper cache fallback. offline.html is still precached and referenced there.
        // Precache critical app-shell assets: index.html (required by NavigationRoute),
        // CSS, fonts, favicon/manifest icons. JS chunks handled by runtimeCaching below.
        globPatterns: ['index.html', '**/*.css', '**/*.woff2', '**/*.ico', '**/icon*.png', '**/apple-touch*.png', 'offline.html'],
        globIgnores: ['**/chunk-data*.js', '**/chunk-vocabulary*.js', '**/chunk-grammar*.js', '**/chunk-exercises*.js', '**/chunk-lessons*.js', '**/chunk-scenarios*.js', '**/chunk-cultural*.js', '**/chunk-geo*.js', '**/splash/**', '**/screenshots/**'],
        runtimeCaching: [
          {
            // Data chunks (vocab, stories, songs, pitch, daily content) — stale-while-revalidate.
            // cacheWillUpdate plugin: reject any response with Content-Type: text/html
            // (the Cloudflare /* /index.html 200 SPA fallback returns status 200 WITH
            // text/html — so cacheableResponse: {statuses:[200]} alone is not enough).
            urlPattern: /\/assets\/chunk-(data|vocabulary|grammar|exercises|lessons|scenarios|cultural|geo|stories|pitch-data|daily|songs)[^/]*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nasa-hrvatska-v15-data',
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
              cacheName: 'nasa-hrvatska-v15-js',
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
              cacheName: 'nasa-hrvatska-v15-images',
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
              cacheName: 'nasa-hrvatska-v15-html',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nasa-hrvatska-v15-audio',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nasa-hrvatska-v15-fonts',
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
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,            // CSS per chunk (avoids one monolithic stylesheet)
    reportCompressedSize: false,   // Skip gzip-size computation at build time for faster builds
    chunkSizeWarningLimit: 800,    // src/data.jsx (root vocab file) is ~700 KB and cannot be split without a full data-layer refactor
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 0, // Don't merge tiny chunks into startup bundle — prevents chunk-data becoming a static startup dep
        manualChunks(id) {
          // Firebase must stay as ONE chunk — the SDK uses shared internal state and
          // circular dependencies across @firebase/* packages. Splitting it causes
          // module initialization order failures (app crashes with blank screen / NO_FCP).
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/posthog-js')) return 'vendor-posthog';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
          // Large agent-generated data files — each in its own lazy chunk.
          if (id.includes('src/data/gradedStories')) return 'chunk-stories';
          if (id.includes('src/data/pitchAccentContent')) return 'chunk-pitch-data';
          if (id.includes('src/data/daily-content')) return 'chunk-daily';
          if (id.includes('croatia/LyricsSongData')) return 'chunk-songs';
          // Data subdirectory splits — each module into its own lazy chunk to reduce chunk-data.
          // Order matters: more specific paths must appear before the catch-all 'src/data' rule.
          if (id.includes('src/data/vocabulary')) return 'chunk-vocabulary';
          if (id.includes('src/data/grammar')) return 'chunk-grammar';
          if (id.includes('src/data/exercises')) return 'chunk-exercises';
          if (id.includes('src/data/lessons')) return 'chunk-lessons';
          if (id.includes('src/data/scenarios')) return 'chunk-scenarios';
          if (id.includes('src/data/cultural/geography')) return 'chunk-geo';  // 557 kB 365-city file — isolated
          if (id.includes('src/data/cultural')) return 'chunk-cultural';
          // data.jsx (root vocabulary file) + content.jsx stay in chunk-data (~700 KB).
          // src/data.jsx alone is ~700 KB and cannot be split without a major refactor.
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
