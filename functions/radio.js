// Cloudflare Pages Function — Croatian Radio Stream Proxy
// Uses 302 redirect so the browser connects directly to the upstream server.
// Piping through a Worker would exceed execution time limits on live audio.

function getStreamUrl(station) {
  switch (station) {
    case 'hrt1': return 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM1.mp3';
    case 'hrt2': return 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM2.mp3';
    case 'hrt3': return 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM3.mp3';
    case 'cmc':  return 'https://radio.cmc.com.hr:8443/cmc_radio';
    default:     return null;
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const station = url.searchParams.get('s') || '';
  const src = getStreamUrl(station);

  if (!src) {
    return new Response('Unknown station', { status: 400 });
  }

  // Redirect the browser directly to the upstream stream URL.
  // Audio elements make no-cors requests so CORS headers are not required.
  return Response.redirect(src, 302);
}
