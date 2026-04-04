import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      // injectManifest: single combined SW (Workbox + FCM + VAPID push).
      // Eliminates the two-SW scope conflict that broke offline mode and caused
      // unexpected reloads when firebase-messaging-sw.js competed with sw.js.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        // Precache app shell assets only. JS runtime caching is handled in src/sw.js.
        // Large lazy-loaded data chunks excluded — they are runtime-cached in the SW.
        globPatterns: [
          'index.html',
          '**/*.css',
          '**/*.woff2',
          '**/icon*.png',
          '**/apple-touch*.png',
          'offline.html',
        ],
        globIgnores: [
          '**/chunk-data*.js',
          '**/chunk-vocabulary*.js',
          '**/chunk-grammar*.js',
          '**/chunk-exercises*.js',
          '**/chunk-lessons*.js',
          '**/chunk-scenarios*.js',
          '**/chunk-cultural*.js',
          '**/chunk-geo*.js',
          '**/splash/**',
          '**/screenshots/**',
        ],
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
