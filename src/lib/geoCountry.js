// Shared IP-based country detection for pricing — used anywhere we need to
// guess a visitor's country to show the right local currency before they've
// set one on their profile (guests, or logged-in users with no country set).
//
// Priority: explicit profile country → cached IP lookup (24h) → live IP
// lookup (ipapi.co) → 'Malawi' (home market default).
export const PRICING_COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];

const CACHE_KEY = 'bf_ip_country';
const CACHE_TTL_MS = 86_400_000; // 24h

function matchCountry(name) {
  if (!name) return null;
  return PRICING_COUNTRIES.find(c => c.toLowerCase() === name.toLowerCase()) || null;
}

export async function detectCountry(profileCountry) {
  const profileMatch = matchCountry(profileCountry);
  if (profileMatch) return profileMatch;

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached?.country && cached.expires > Date.now()) {
      const cachedMatch = matchCountry(cached.country);
      if (cachedMatch) return cachedMatch;
    }
  } catch { /* ignore corrupt cache */ }

  try {
    const res = await fetch('https://ipapi.co/json/');
    const d = await res.json();
    const name = d?.country_name || '';
    localStorage.setItem(CACHE_KEY, JSON.stringify({ country: name, expires: Date.now() + CACHE_TTL_MS }));
    const ipMatch = matchCountry(name);
    if (ipMatch) return ipMatch;
  } catch { /* ipapi unreachable — fall through to default */ }

  return 'Malawi';
}
