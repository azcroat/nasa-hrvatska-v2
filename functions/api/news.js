// Cloudflare Pages Function — Croatian News RSS Proxy + Claude Simplification
// Fetches real Croatian news and simplifies it to the user's CEFR level

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { checkAIQuota } from './_aiQuota.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// Croatian news RSS feeds
const RSS_FEEDS = [
  { name: 'Index.hr', url: 'https://www.index.hr/rss/vijesti', category: 'news' },
  { name: '24sata.hr', url: 'https://www.24sata.hr/feeds/aktualno.xml', category: 'news' },
  { name: 'Večernji list', url: 'https://www.vecernji.hr/feeds/latest', category: 'news' },
];

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=1800', // 30 min cache
  };
}

function ok(body, origin) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) });
}

// Parse RSS XML into article objects
function parseRSS(rawXml, sourceName) {
  const xml = rawXml.slice(0, 50000); // cap input to prevent ReDoS on very large feeds
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const item = match[1];
    const getTag = (tag) => {
      // Two separate bounded regexes — avoids catastrophic backtracking from alternation.
      // CDATA: content bounded to 2000 chars. Plain: [^<]* stops at any tag boundary.
      const safeTag = tag.replace(/[^a-zA-Z]/g, '');

      const cdataM = item.match(
        new RegExp(`<${safeTag}[^>]{0,200}><!\\[CDATA\\[(.{0,2000}?)\\]\\]><\\/${safeTag}>`, 'i'),
      );
      if (cdataM) return cdataM[1].trim();

      const plainM = item.match(
        new RegExp(`<${safeTag}[^>]{0,200}>([^<]{0,2000})<\\/${safeTag}>`, 'i'),
      );
      return plainM ? plainM[1].trim() : '';
    };
    const title = getTag('title');
    const description = getTag('description');
    const link = getTag('link');
    const pubDate = getTag('pubDate');
    if (title && description) {
      items.push({
        title,
        description: description
          .replace(/<[^>]{0,200}>/g, '')
          .replace(/&[a-z]+;/gi, ' ')
          .slice(0, 500),
        link,
        pubDate,
        source: sourceName,
      });
    }
  }
  return items;
}

// Simplify one article using Claude
async function simplifyArticle(article, level, anthropicKey) {
  const complexity = {
    A1: 'ONLY the 500 most common Croatian words. Max 8 words per sentence. Present tense only.',
    A2: 'Simple vocabulary. Short sentences (max 12 words). Present tense mostly.',
    B1: 'Conversational Croatian. 15-word sentences max. All tenses allowed.',
    B2: 'Natural Croatian. Simplify only technical jargon.',
    C1: 'Keep close to original. Simplify only highly specialized terms.',
  };
  const safeLevel = /^[ABC][12]$/.test(level) ? level : 'B1';

  const rule = complexity[safeLevel] || complexity['B1'];

  const systemPrompt = `You are a Croatian language teacher simplifying news for a ${safeLevel} learner.
Simplification rules: ${rule}
Return ONLY valid JSON: {"simplified_title":"...","simplified_title_en":"...","simplified_text":"...","simplified_text_en":"...","key_vocabulary":[{"hr":"...","en":"..."}],"summary_one_sentence":{"hr":"...","en":"..."}}
Include 5-6 key vocabulary items. Keep facts accurate.`;

  const userContent = `Title: ${String(article.title || '').slice(0, 200)}\nText: ${String(article.description || '').slice(0, 800)}`;

  // Block 1: fetch
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
  } catch (fetchErr) {
    console.error('news.js: simplifyArticle network error:', fetchErr.message);
    return null;
  }

  // Block 2: read body
  let rawBody;
  try {
    rawBody = await res.text();
  } catch (bodyErr) {
    console.error(
      'news.js: simplifyArticle failed to read Anthropic response body:',
      bodyErr.message,
    );
    return null;
  }

  // Block 3: check ok
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.error?.message;
    } catch {
      /* not JSON */
    }
    console.error('news.js: simplifyArticle Anthropic API error', res.status, errMsg);
    return null;
  }

  // Block 4: parse JSON
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('news.js: simplifyArticle JSON parse failed:', rawBody.slice(0, 200));
    return null;
  }

  const raw = data.content?.[0]?.text || '';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('news.js: simplifyArticle inner JSON parse failed:', raw.slice(0, 200));
    return null;
  }
  return { ...article, ...parsed, level: safeLevel };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';
  if (!isAllowedOrigin(origin, isDev)) return err(403, 'Forbidden', origin);

  const allowed = await checkRateLimit(request, 10, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  if (!ANTHROPIC_KEY) return err(500, 'AI_KEY_MISSING', origin);

  const url = new URL(request.url);
  const rawLevel = url.searchParams.get('level') || 'B1';
  const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const level = VALID_LEVELS.includes(rawLevel) ? rawLevel : 'B1';

  // Fetch all RSS feeds in parallel (saves ~16s vs sequential)
  const feedResults = await Promise.all(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'NasaHrvatska/1.0 (Croatian language learning app)' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const rawXml = await res.text();
        return parseRSS(rawXml, feed.name);
      } catch {
        return [];
      }
    }),
  );
  const rawArticles = feedResults.flat().slice(0, 6);

  if (rawArticles.length === 0) {
    // Return curated fallback articles if RSS fails
    return ok(
      {
        articles: FALLBACK_ARTICLES.map((a) => ({ ...a, level })),
        source: 'curated',
        timestamp: Date.now(),
      },
      origin,
    );
  }

  // Quota check before calling Claude 4× (one per article)
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  const quota = await checkAIQuota(request, env, uid, 4);
  if (!quota.allowed) {
    // Serve curated fallback when daily limit reached — better than an error
    return ok(
      {
        articles: FALLBACK_ARTICLES.map((a) => ({ ...a, level })),
        source: 'curated',
        timestamp: Date.now(),
      },
      origin,
    );
  }

  // Simplify top 4 articles in parallel
  const toSimplify = rawArticles.slice(0, 4);
  const simplified = await Promise.all(
    toSimplify.map((article) => simplifyArticle(article, level, ANTHROPIC_KEY)),
  );

  const articles = simplified.filter(Boolean);

  return ok({ articles, source: 'live', timestamp: Date.now() }, origin);
}

// Fallback articles if RSS is unavailable
const FALLBACK_ARTICLES = [
  {
    title: 'Hrvatska pobijeda na europskom natjecanju',
    description:
      'Hrvatska reprezentacija ostvarila je veliku pobjedu na europskom natjecanju. Navijači su slavili po ulicama Zagreba.',
    source: 'Naša Hrvatska',
    simplified_title: 'Hrvatska pobijeda',
    simplified_title_en: 'Croatian Victory',
    simplified_text:
      'Hrvatska je pobijedila na natjecanju. Ljudi su sretni. Navijači slave u Zagrebu.',
    simplified_text_en:
      'Croatia won at the competition. People are happy. Fans are celebrating in Zagreb.',
    key_vocabulary: [
      { hr: 'pobjeda', en: 'victory' },
      { hr: 'natjecanje', en: 'competition' },
      { hr: 'navijači', en: 'fans/supporters' },
      { hr: 'slaviti', en: 'to celebrate' },
    ],
    summary_one_sentence: {
      hr: 'Hrvatska je pobijedila na europskom natjecanju.',
      en: 'Croatia won at a European competition.',
    },
  },
  {
    title: 'Nova turistička sezona u Dalmaciji',
    description:
      'Dalmatinska obala priprema se za rekordnu turističku sezonu. Hoteli su već rezervirani do rujna.',
    source: 'Naša Hrvatska',
    simplified_title: 'Turistička sezona u Dalmaciji',
    simplified_title_en: 'Tourist Season in Dalmatia',
    simplified_text: 'Puno turista dolazi u Dalmaciju. Hoteli su puni. Ljeto je dobro za turizam.',
    simplified_text_en:
      'Many tourists are coming to Dalmatia. Hotels are full. Summer is good for tourism.',
    key_vocabulary: [
      { hr: 'turistička sezona', en: 'tourist season' },
      { hr: 'Dalmacija', en: 'Dalmatia (coastal region)' },
      { hr: 'rezerviran', en: 'reserved/booked' },
      { hr: 'rekordna', en: 'record (breaking)' },
    ],
    summary_one_sentence: {
      hr: 'Dalmacija očekuje rekordni broj turista ove sezone.',
      en: 'Dalmatia expects a record number of tourists this season.',
    },
  },
];
