import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

// Auto-generated on every build/dev-server start — never bump manually.
// Becomes CACHE_VER in sw.js and the value in /version.json.
// Every deploy gets a unique ID → old SW caches are purged automatically.
const BUILD_ID = Date.now().toString();
fs.writeFileSync('./public/version.json', JSON.stringify({ v: BUILD_ID }) + '\n');

// CSP guard: Vite inlines small public/ scripts into the built index.html,
// which violates script-src 'self' (no 'unsafe-inline'). This plugin runs
// after all other HTML transforms and replaces any inlined <script> blocks
// whose content matches native-init.js or sw-update.js with the original
// external <script src="..."> tags — same behaviour, CSP-compliant.
function keepPublicScriptsExternal() {
  // Read the canonical source text for each file once at plugin init time.
  const externalScripts = [
    { src: '/native-init.js', file: 'public/native-init.js' },
    { src: '/sw-update.js',   file: 'public/sw-update.js'   },
  ].map(({ src, file }) => ({
    src,
    // Strip JS comments and normalise whitespace so we match against the
    // content Vite embeds (it strips comments during its HTML processing).
    raw: fs.readFileSync(file, 'utf8'),
  }));

  return {
    name: 'keep-public-scripts-external',
    enforce: 'post',
    transformIndexHtml(html) {
      let result = html;
      for (const { src, raw } of externalScripts) {
        // Build a regex that matches an inline <script> whose body is a
        // substring of (or identical to) the source file content.
        // Vite strips leading // comments and trims, so we use the first
        // non-comment code line as the unique fingerprint.
        const firstCodeLine = raw
          .split('\n')
          .find(l => l.trim() && !l.trim().startsWith('//'));
        if (!firstCodeLine) continue;
        // Escape special regex chars in the fingerprint.
        const escaped = firstCodeLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
        const inlinePattern = new RegExp(
          `<script>\\s*[\\s\\S]*?${escaped}[\\s\\S]*?<\\/script>`,
          'g'
        );
        result = result.replace(inlinePattern, `<script src="${src}"></script>`);
      }
      return result;
    },
  };
}

export default defineConfig({
  // Inject BUILD_ID so sw.js can use it as CACHE_VER without any manual bumping.
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    keepPublicScriptsExternal(),
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
          if (id.includes('src/data/pitchAccentContent')) return 'chunk-pitch-data';
          if (id.includes('src/data/daily-content')) return 'chunk-daily';
          if (id.includes('croatia/LyricsSongData')) return 'chunk-songs';
          // Data subdirectory splits — each module into its own lazy chunk to reduce chunk-data.
          // Order matters: more specific paths must appear before the catch-all 'src/data' rule.
          if (id.includes('src/data/vocabulary')) return 'chunk-vocabulary';
          if (id.includes('src/data/grammar')) return 'chunk-grammar';
          if (id.includes('src/data/exercises')) return 'chunk-exercises';
          if (id.includes('src/data/scenarios')) return 'chunk-scenarios';
          if (id.includes('src/data/cultural/geography')) return 'chunk-geo';  // 557 kB 365-city file — isolated
          if (id.includes('src/data/cultural')) return 'chunk-cultural';
          // data.jsx (root vocabulary file) + content.jsx stay in chunk-data (~700 KB).
          // src/data.jsx alone is ~700 KB and cannot be split without a major refactor.
          if (id.includes('src/data') || id.includes('src/lib/appData')) return 'chunk-data';
          // Context — break circular deps between croatia/practice/learn chunks
          if (id.includes('src/context')) return 'chunk-context';
          // NOTE: src/hooks intentionally has NO manual chunk — previous chunk-hooks caused
          // a chunk-data ↔ chunk-hooks circular dependency (TDZ crash at runtime). Hooks are
          // now pulled into their respective lazy screen chunks by Rollup's default behavior.
          // Individual screen files (croatia/, practice/, profile/, learn/) are NOT matched here.
          // They fall through to Rollup's default — each lazy-loaded screen becomes its own chunk.
        }
      }
    }
  }
});
