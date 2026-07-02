// Vercel Edge Middleware — runs before any request on the CDN edge
// For bots/crawlers: injects per-route SEO Open Graph tags into the HTML shell
// For real browsers: passes through to the SPA as-is

const BOT_UA = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|googlebot|bingbot|duckduckbot|applebot|pinterest|discordbot|embedly|quora|outbrain|rogerbot|showyoubot|vkshare|w3c_validator|redditbot|ia_archiver/i;

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || '';

const SITE_URL = 'https://brandfletch.com';
const DEFAULTS = {
  title:       'Brandfletch Media — Advertising & Marketing for African Businesses',
  description: 'We build and run advertising systems for African businesses — Meta Ads, UGC creatives, social media, and professional design. Everything you need, in one place.',
  image:       `${SITE_URL}/og-default.jpg`,
};

const STATIC_META: Record<string, { title: string; description: string; image?: string }> = {
  '/': {
    title:       'Brandfletch Media — Digital Advertising for African Businesses',
    description: 'Professionally managed Facebook & Instagram ads, UGC creatives, graphic design and social media for businesses across Africa.',
  },
  '/about': {
    title:       'About Brandfletch Media — Built for Africa',
    description: "Learn how Brandfletch Media was born from the African market and why we're obsessed with helping local businesses grow through digital advertising.",
  },
  '/pricing': {
    title:       'Pricing — Brandfletch Media',
    description: 'Flexible ad management packages, UGC creatives, design retainers, and social media plans. Clear pricing in both USD and MWK.',
  },
  '/contact': {
    title:       'Contact Brandfletch Media',
    description: "Get in touch with our team to discuss your advertising goals. We're ready to help your business grow.",
  },
  '/blog': {
    title:       'The Brandfletch Blog — Advertising Tips for African Businesses',
    description: 'Insights, strategies, and success stories to help African businesses win with digital advertising.',
    image:       `${SITE_URL}/og-blog.jpg`,
  },
};

function buildHtml(meta: {
  title: string; description: string; image: string;
  url: string; type: string; author?: string; publishedAt?: string;
  jsonLd?: object;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="${SITE_URL}/favicon.png" />
    <link rel="manifest" href="/manifest.json" />

    <!-- Primary SEO -->
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${meta.url}" />

    <!-- Open Graph -->
    <meta property="og:type"        content="${meta.type}" />
    <meta property="og:url"         content="${meta.url}" />
    <meta property="og:title"       content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image"       content="${meta.image}" />
    <meta property="og:site_name"   content="Brandfletch Media" />
    <meta property="og:locale"      content="en_US" />
    ${meta.type === 'article' && meta.author ? `<meta property="article:author" content="${meta.author}" />` : ''}
    ${meta.type === 'article' && meta.publishedAt ? `<meta property="article:published_time" content="${meta.publishedAt}" />` : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:site"        content="@brandfletchmedia" />
    <meta name="twitter:title"       content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image"       content="${meta.image}" />
    ${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
}

export default async function middleware(req: Request): Promise<Response> {
  const ua = req.headers.get('user-agent') || '';
  const url = new URL(req.url);
  const { pathname } = url;

  // Only intercept bots on non-asset paths
  const isBot  = BOT_UA.test(ua);
  const isPage = !pathname.match(/\.(js|css|png|jpg|svg|ico|woff|woff2|json|map|txt|xml)$/);

  if (!isBot || !isPage) return fetch(req);

  const fullUrl = `${SITE_URL}${pathname}`;

  // ── Blog post ─────────────────────────────────────────────────────────────
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && SUPABASE_URL) {
    const slug = blogMatch[1];
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/BlogPost?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,cover_image,author_name,published_at,category,meta_title,meta_description,tags,updated_date&limit=1`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
      );
      const rows = await res.json() as any[];
      if (rows?.length) {
        const p = rows[0];
        const title = p.meta_title ? `${p.meta_title} — Brandfletch Blog` : `${p.title} — Brandfletch Blog`;
        const description = p.meta_description || p.excerpt || DEFAULTS.description;
        const image = p.cover_image || DEFAULTS.image;
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description,
          image: [image],
          datePublished: p.published_at || undefined,
          dateModified: p.updated_date || p.published_at || undefined,
          author: { '@type': 'Person', name: p.author_name || 'Brandfletch Team' },
          publisher: {
            '@type': 'Organization',
            name: 'Brandfletch Media',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
          ...(p.tags?.length ? { keywords: p.tags.join(', ') } : {}),
          ...(p.category ? { articleSection: p.category } : {}),
        };
        const html = buildHtml({
          title,
          description,
          image,
          url:         fullUrl,
          type:        'article',
          author:      p.author_name || 'Brandfletch Team',
          publishedAt: p.published_at,
          jsonLd,
        });
        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
        });
      }
    } catch (_) { /* fall through to static */ }
  }

  // ── Static routes ─────────────────────────────────────────────────────────
  const staticMeta = STATIC_META[pathname];
  if (staticMeta) {
    const html = buildHtml({
      title:       staticMeta.title,
      description: staticMeta.description,
      image:       staticMeta.image || DEFAULTS.image,
      url:         fullUrl,
      type:        'website',
    });
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  }

  return fetch(req);
}

export const config = {
  matcher: ['/((?!_next|api|static|assets).*)'],
};
