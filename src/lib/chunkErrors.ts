// Detects stale-chunk / dynamic-import failures after a deploy. When old HTML
// references a vendor chunk whose hash changed, the browser gets a 404 (or the
// SW returns the SPA fallback index.html), which manifests as one of these
// browser-specific errors. All inputs are expected to be lowercase already.
//
//   Chrome:       "failed to fetch" / "expected a javascript module script … mime type"
//   Safari/WebKit:"importing a module script failed"
//   Firefox:      "error loading dynamically imported module"
//   WebKit iOS:   "importing binding name 'X' is not found" (stale named import)
//   Webpack/Vite: "loading chunk N failed"
export function isChunkLoadError(msg: string): boolean {
  return (
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('dynamically imported module') ||
    msg.includes('expected a javascript module script') ||
    msg.includes('mime type') ||
    msg.includes('loading chunk') ||
    msg.includes('importing binding name')
  );
}
