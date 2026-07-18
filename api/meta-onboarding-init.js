/**
 * Meta Onboarding — Initiate Facebook Login for Business
 *
 * POST /api/meta-onboarding-init
 * Body: { campaign_id, user_id, redirect_uri }
 * Returns: { oauth_url, onboarding_id }
 *
 * Creates a MetaOnboarding record in Supabase and returns the Facebook
 * OAuth URL with the scopes needed for ad creation.
 */
import { createClient } from '@supabase/supabase-js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cxfebvtsuzcbkpzezqom.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Scopes needed for Meta Ads management via Business Login
const FB_SCOPES = [
  'pages_manage_ads',
  'pages_read_engagement',
  'pages_show_list',
  'business_management',
  'ads_management',
  'pages_manage_metadata',
  'pages_read_user_content',
].join(',');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, user_id, redirect_uri } = req.body || {};
    if (!campaign_id || !user_id || !redirect_uri)
      return res.status(400).json({ error: 'Missing required fields: campaign_id, user_id, redirect_uri' });

    const appId = process.env.META_APP_ID;
    if (!appId) return res.status(500).json({ error: 'META_APP_ID is not configured' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create onboarding record
    const { data: onboarding, error: dbErr } = await supabase
      .from('MetaOnboarding')
      .insert({ campaign_id, user_id, step: 'connect_facebook', status: 'pending', permissions_granted: false })
      .select().single();

    if (dbErr) {
      console.error('Failed to create onboarding record:', dbErr);
      return res.status(500).json({ error: 'Failed to create onboarding record' });
    }

    // Build Facebook OAuth URL — state = onboarding_id for callback lookup
    const state = onboarding.id;
    const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', appId);
    oauthUrl.searchParams.set('redirect_uri', redirect_uri);
    oauthUrl.searchParams.set('scope', FB_SCOPES);
    oauthUrl.searchParams.set('state', state);
    oauthUrl.searchParams.set('response_type', 'code');

    // Login for Business — pre-select Brandfletch's Business
    const businessId = process.env.META_BUSINESS_ID;
    if (businessId) {
      oauthUrl.searchParams.set('extras', JSON.stringify({ setup: { business: businessId } }));
    }

    return res.status(200).json({ oauth_url: oauthUrl.toString(), onboarding_id: onboarding.id });
  } catch (err) {
    console.error('meta-onboarding-init error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
