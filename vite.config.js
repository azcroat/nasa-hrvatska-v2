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
        skipWaiting: true,
        clientsClaim: true,
        cacheId: 'nasa-hrvatska-v8',
        // Only precache JS/CSS/images — exclude large data chunk and splash screens
        globPatterns: ['**/*.{js,css,svg,ico,png,webp,woff2}'],
        globIgnores: ['**/chunk-data*.js', '**/splash/**'],
        runtimeCaching: [
          {
            // Data chunk (698KB vocabulary data) — serve stale, revalidate in background
            urlPattern: /\/assets\/chunk-data[^/]*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-chunk-cache',
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 7 },
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
    outDir: 'dist',
    sourcemap: 'hidden',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600, // chunk-data (vocabulary/lesson data) is inherently ~537 KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/posthog-js')) return 'vendor-posthog';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
          // data.jsx is 570 KB of vocabulary/lesson data — isolate it so other chunks stay small
          if (id.includes('src/data')) return 'chunk-data';
          // Context and hooks — break circular deps between croatia/practice/learn chunks
          if (id.includes('src/context')) return 'chunk-context';
          if (id.includes('src/hooks')) return 'chunk-hooks';
          // Split learn into sub-chunks to keep each below 500 KB
          if (id.includes('src/components/learn/GrammarRef')) return 'chunk-learn-grammar';
          if (id.includes('src/components/learn/NewLessons')) return 'chunk-learn-new';
          if (id.includes('src/components/learn/VocabScreens')) return 'chunk-learn-vocab';
          if (id.includes('src/components/learn')) return 'chunk-learn';
          if (id.includes('src/components/practice')) return 'chunk-practice';
          if (id.includes('src/components/croatia')) return 'chunk-croatia';
          if (id.includes('src/components/profile')) return 'chunk-profile';
        }
      }
    }
  }
});
