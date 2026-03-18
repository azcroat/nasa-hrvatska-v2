// Cloudflare Pages Function — Croatian Radio Stream Proxy

const STREAMS = {
  hrt1: 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM1.mp3',
  hrt2: 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM2.mp3',
  hrt3: 'https://playerservices.streamtheworld.com/api/livestream-redirect/PROGRAM3.mp3',
  cmc:  'http://radio-stream.cmc.com.hr:8001/stream',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const station = url.searchParams.get('s');
  const src = STREAMS[station];

  if (!src) {
    return new Response('Unknown station', { status: 400 });
  }

  try {
    const upstream = await fetch(src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NasaHrvatska/1.0)',
        'Icy-MetaData': '1',
      },
    });

    if (!upstream.ok && upstream.status !== 200) {
      return new Response('Stream unavailable', { status: 503 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
        'Access-Control-Allow-Origin': 'https://nasahrvatska.com',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  } catch (e) {
    return new Response('Stream unavailable', { status: 503 });
  }
}
