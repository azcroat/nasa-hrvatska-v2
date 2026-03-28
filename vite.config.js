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
        screenshots: [
          {
            src: 'screenshots/home-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Home screen on desktop'
          },
          {
            src: 'screenshots/home-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Home screen on mobile'
          }
        ]
      },
      workbox: {
        navigationPreload: true,
        skipWaiting: true,
        clientsClaim: true,
        cacheId: 'nasa-hrvatska-v9',
        // Precache only critical app-shell assets: CSS, fonts, favicon/manifest icons.
        // JS chunks (100+ files, ~5MB) and images are handled by runtimeCaching below.
        globPatterns: ['**/*.css', '**/*.woff2', '**/*.ico', '**/icon*.png', '**/apple-touch*.png'],
        globIgnores: ['**/chunk-data*.js', '**/splash/**', '**/screenshots/**'],
        runtimeCaching: [
          {
            // Data chunk (706KB vocabulary data) — serve stale, revalidate in background
            urlPattern: /\/assets\/chunk-data[^/]*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-chunk-cache',
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // All JS chunks — stale-while-revalidate so app loads fast on repeat visits
            urlPattern: /\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // SVG/PNG/WebP/JPG images — long-lived CacheFirst (icons, flags, illustrations)
            urlPattern: /\.(svg|png|webp|jpg|jpeg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // HTML navigation: always fetch fresh from network (3s timeout), fall back to cache offline
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
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
        experimentalMinChunkSize: 10000, // Merge chunks < 10 KB to avoid HTTP/2 overhead
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/posthog-js')) return 'vendor-posthog';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
          // data.jsx (~700 KB) contains all vocabulary/lesson data — isolate it so other chunks
          // stay small. App.jsx now imports only the ~20 symbols it actually uses directly;
          // the remaining ~80 data exports are pulled in only by lazy-loaded screen components.
          // Next optimization step: move heavy data arrays to src/lib/appData.js and use
          // dynamic import() in App.jsx so chunk-data is no longer a static startup dep.
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
