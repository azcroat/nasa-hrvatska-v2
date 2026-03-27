// Cloudflare Pages Function — Croatian News RSS Proxy + Claude Simplification
// Fetches real Croatian news and simplifies it to the user's CEFR level

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// Croatian news RSS feeds
const RSS_FEEDS = [
  { name: "Index.hr", url: "https://www.index.hr/rss/vijesti", category: "news" },
  { name: "24sata.hr", url: "https://www.24sata.hr/feeds/aktualno.xml", category: "news" },
  { name: "Večernji list", url: "https://www.vecernji.hr/feeds/latest", category: "news" },
];

function isAllowedOrigin(origin, isDev) {
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === "localhost") return true;
    return hostname === "nasahrvatska.com"
      || hostname.endsWith(".nasahrvatska.com")
      || hostname === "nasa-hrvatska-v2.pages.dev"
      || hostname.endsWith(".nasa-hrvatska-v2.pages.dev");
  } catch { return false; }
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://nasahrvatska.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=1800", // 30 min cache
};

function ok(body) { return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders }); }
function err(status, msg) { return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders }); }

// Parse RSS XML into article objects
function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const item = match[1];
    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || "").trim() : "";
    };
    const title = getTag("title");
    const description = getTag("description");
    const link = getTag("link");
    const pubDate = getTag("pubDate");
    if (title && description) {
      items.push({ title, description: description.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').slice(0, 500), link, pubDate, source: sourceName });
    }
  }
  return items;
}

// Simplify one article using Claude
async function simplifyArticle(article, level, anthropicKey) {
  const complexity = {
    A1: "ONLY the 500 most common Croatian words. Max 8 words per sentence. Present tense only.",
    A2: "Simple vocabulary. Short sentences (max 12 words). Present tense mostly.",
    B1: "Conversational Croatian. 15-word sentences max. All tenses allowed.",
    B2: "Natural Croatian. Simplify only technical jargon.",
    C1: "Keep close to original. Simplify only highly specialized terms.",
  };
  const safeLevel = /^[ABC][12]$/.test(level) ? level : "B1";
  // eslint-disable-next-line security/detect-object-injection
  const rule = complexity[safeLevel] || complexity["B1"];

  const systemPrompt = `You are a Croatian language teacher simplifying news for a ${safeLevel} learner.
Simplification rules: ${rule}
Return ONLY valid JSON: {"simplified_title":"...","simplified_title_en":"...","simplified_text":"...","simplified_text_en":"...","key_vocabulary":[{"hr":"...","en":"..."}],"summary_one_sentence":{"hr":"...","en":"..."}}
Include 5-6 key vocabulary items. Keep facts accurate.`;

  const userContent = `Title: ${String(article.title || '').slice(0, 200)}\nText: ${String(article.description || '').slice(0, 800)}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.content?.[0]?.text || "";
    const parsed = JSON.parse(raw);
    return { ...article, ...parsed, level: safeLevel };
  } catch {
    return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isDev = env.ENVIRONMENT !== "production";
  if (!isAllowedOrigin(origin, isDev)) return err(403, "Forbidden");
  if (!ANTHROPIC_KEY) return err(500, "AI_KEY_MISSING");

  const url = new URL(request.url);
  const rawLevel = url.searchParams.get("level") || "B1";
  const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const level = VALID_LEVELS.includes(rawLevel) ? rawLevel : "B1";

  // Fetch all RSS feeds in parallel (saves ~16s vs sequential)
  const feedResults = await Promise.all(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "NasaHrvatska/1.0 (Croatian language learning app)" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSS(xml, feed.name);
      } catch {
        return [];
      }
    })
  );
  const rawArticles = feedResults.flat().slice(0, 6);

  if (rawArticles.length === 0) {
    // Return curated fallback articles if RSS fails
    return ok({
      articles: FALLBACK_ARTICLES.map(a => ({ ...a, level })),
      source: "curated",
      timestamp: Date.now(),
    });
  }

  // Simplify top 4 articles in parallel
  const toSimplify = rawArticles.slice(0, 4);
  const simplified = await Promise.all(
    toSimplify.map(article => simplifyArticle(article, level, ANTHROPIC_KEY))
  );

  const articles = simplified.filter(Boolean);

  return ok({ articles, source: "live", timestamp: Date.now() });
}

// Fallback articles if RSS is unavailable
const FALLBACK_ARTICLES = [
  {
    title: "Hrvatska pobijeda na europskom natjecanju",
    description: "Hrvatska reprezentacija ostvarila je veliku pobjedu na europskom natjecanju. Navijači su slavili po ulicama Zagreba.",
    source: "Naša Hrvatska",
    simplified_title: "Hrvatska pobijeda",
    simplified_title_en: "Croatian Victory",
    simplified_text: "Hrvatska je pobijedila na natjecanju. Ljudi su sretni. Navijači slave u Zagrebu.",
    simplified_text_en: "Croatia won at the competition. People are happy. Fans are celebrating in Zagreb.",
    key_vocabulary: [
      { hr: "pobjeda", en: "victory" },
      { hr: "natjecanje", en: "competition" },
      { hr: "navijači", en: "fans/supporters" },
      { hr: "slaviti", en: "to celebrate" },
    ],
    summary_one_sentence: { hr: "Hrvatska je pobijedila na europskom natjecanju.", en: "Croatia won at a European competition." },
  },
  {
    title: "Nova turistička sezona u Dalmaciji",
    description: "Dalmatinska obala priprema se za rekordnu turističku sezonu. Hoteli su već rezervirani do rujna.",
    source: "Naša Hrvatska",
    simplified_title: "Turistička sezona u Dalmaciji",
    simplified_title_en: "Tourist Season in Dalmatia",
    simplified_text: "Puno turista dolazi u Dalmaciju. Hoteli su puni. Ljeto je dobro za turizam.",
    simplified_text_en: "Many tourists are coming to Dalmatia. Hotels are full. Summer is good for tourism.",
    key_vocabulary: [
      { hr: "turistička sezona", en: "tourist season" },
      { hr: "Dalmacija", en: "Dalmatia (coastal region)" },
      { hr: "rezerviran", en: "reserved/booked" },
      { hr: "rekordna", en: "record (breaking)" },
    ],
    summary_one_sentence: { hr: "Dalmacija očekuje rekordni broj turista ove sezone.", en: "Dalmatia expects a record number of tourists this season." },
  },
];
