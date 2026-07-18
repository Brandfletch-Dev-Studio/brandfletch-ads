/**
 * Meta Onboarding — OAuth Callback Handler
 *
 * POST /api/meta-onboarding-callback
 * Body: { code, state (onboarding_id), redirect_uri }
 * Returns: { pages: [...], businesses: [...], onboarding_id }
 */
import { createClient } from '@supabase/supabase-js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cxfebvtsuzcbkpzezqom.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function graphGet(path, params) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, state, redirect_uri } = req.body || {};
    if (!code || !state || !redirect_uri)
      return res.status(400).json({ error: 'Missing required fields: code, state, redirect_uri' });

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) return res.status(500).json({ error: 'Meta app credentials not configured' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Exchange code for short-lived access token
    const tokenData = await graphGet('/oauth/access_token', {
      client_id: appId, client_secret: appSecret, redirect_uri, code,
    });
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    let longLivedToken = shortLivedToken;
    try {
      const llData = await graphGet('/oauth/access_token', {
        grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      });
      longLivedToken = llData.access_token || longLivedToken;
    } catch (e) { console.warn('Long-lived token exchange failed:', e.message); }

    // 3. Fetch the user's Pages
    const pagesData = await graphGet('/me/accounts', {
      access_token: longLivedToken,
      fields: 'id,name,access_token,category,tasks,instagram_business_account',
      limit: 100,
    });

    const pages = (pagesData.data || []).map(p => ({
      id: p.id, name: p.name, access_token: p.access_token,
      category: p.category, tasks: p.tasks || [],
      has_instagram: !!p.instagram_business_account,
      instagram_id: p.instagram_business_account?.id || null,
    }));

    // 4. Fetch the user's Businesses
    let businesses = [];
    try {
      const bizData = await graphGet('/me/businesses', {
        access_token: longLivedToken, fields: 'id,name,primary_page', limit: 100,
      });
      businesses = (bizData.data || []).map(b => ({
        id: b.id, name: b.name, primary_page_id: b.primary_page?.id || null,
      }));
    } catch (e) { console.warn('Businesses fetch failed:', e.message); }

    // 5. Update onboarding record
    await supabase.from('MetaOnboarding').update({
      fb_user_access_token: shortLivedToken,
      fb_long_lived_token: longLivedToken,
      step: 'page_selected', status: 'awaiting_page_selection',
      updated_at: new Date().toISOString(),
    }).eq('id', state);

    return res.status(200).json({ pages, businesses, onboarding_id: state });
  } catch (err) {
    console.error('meta-onboarding-callback error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
