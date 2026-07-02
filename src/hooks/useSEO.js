/**
 * useSEO — sets <title> and meta tags dynamically for React pages.
 * Uses document.querySelector for simplicity (no extra library needed).
 * This handles in-browser tab titles and meta; bots are handled by the Edge middleware.
 */
export function useSEO({ title, description, image, url, type = 'website', author, publishedAt, jsonLd } = {}) {
  const SITE = 'https://brandfletch.com';
  const DEFAULTS = {
    title:       'Brandfletch Media — Digital Advertising for African Businesses',
    description: 'We build and run advertising systems for African businesses — Meta Ads, UGC, design, and social media.',
    image:       `${SITE}/og-default.jpg`,
  };

  const t   = title       || DEFAULTS.title;
  const d   = description || DEFAULTS.description;
  const img = image       || DEFAULTS.image;
  const u   = url         || (typeof window !== 'undefined' ? window.location.href : SITE);

  if (typeof document === 'undefined') return;

  // Title
  document.title = t;

  const setMeta = (sel, val) => {
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      const [attr, attrVal] = sel.replace(/\[|\]/g, ' ').trim().split(/\s+/);
      const [k, v] = attrVal.split('=').map(s => s.replace(/['"]/g, ''));
      el.setAttribute(k, v);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  const setLink = (rel, val) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
    el.setAttribute('href', val);
  };

  // Description
  setMeta('meta[name="description"]', d);

  // Canonical
  setLink('canonical', u);

  // OG
  setMeta('meta[property="og:title"]',       t);
  setMeta('meta[property="og:description"]', d);
  setMeta('meta[property="og:image"]',       img);
  setMeta('meta[property="og:url"]',         u);
  setMeta('meta[property="og:type"]',        type);

  if (type === 'article') {
    if (author)      setMeta('meta[property="article:author"]',         author);
    if (publishedAt) setMeta('meta[property="article:published_time"]', publishedAt);
  }

  // Twitter
  setMeta('meta[name="twitter:title"]',       t);
  setMeta('meta[name="twitter:description"]', d);
  setMeta('meta[name="twitter:image"]',       img);

  // JSON-LD structured data (e.g. BlogPosting) — replaces any previous one this hook added
  const existingLd = document.getElementById('bf-jsonld');
  if (existingLd) existingLd.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.id = 'bf-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
