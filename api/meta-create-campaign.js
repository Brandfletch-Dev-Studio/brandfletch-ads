/**
 * Meta Onboarding — Create Ad Campaign via Marketing API
 *
 * POST /api/meta-create-campaign
 * Body: { campaign_id, onboarding_id, page_id, page_name, ... }
 * Returns: { ad_campaign_id, ad_set_id, ad_id, status }
 *
 * Creates a Meta Ads campaign using the Brandfletch ad account and
 * the client's connected Facebook Page.
 */
import { createClient } from '@supabase/supabase-js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cxfebvtsuzcbkpzezqom.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function graphPost(path, params) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
  const res = await fetch(url.toString(), { method: 'POST', body });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function graphGet(path, params) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// Map Brandfletch campaign goals to Meta campaign objectives
function mapObjective(goal) {
  const map = {
    messages:        'OUTCOME_ENGAGEMENT',
    website_traffic: 'OUTCOME_TRAFFIC',
    phone_calls:     'OUTCOME_TRAFFIC',
    brand_awareness: 'OUTCOME_AWARENESS',
    page_followers:  'OUTCOME_AWARENESS',
    boost_post:      'OUTCOME_ENGAGEMENT',
  };
  return map[goal] || 'OUTCOME_ENGAGEMENT';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, onboarding_id, page_id } = req.body || {};
    if (!campaign_id || !onboarding_id || !page_id)
      return res.status(400).json({ error: 'Missing required fields' });

    const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    if (!systemUserToken || !adAccountId)
      return res.status(500).json({ error: 'Meta ad credentials not configured' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch the Brandfletch campaign details
    const { data: campaign } = await supabase
      .from('Campaign').select('*').eq('id', campaign_id).single();

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const objective = mapObjective(campaign.goal);
    const campaignName = campaign.campaign_name || campaign.page_name || 'Brandfletch Campaign';
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // 1. Create the Campaign
    const adCampaign = await graphPost(`/${actId}/campaigns`, {
      access_token: systemUserToken,
      name: campaignName,
      objective,
      status: 'PAUSED',
      special_ad_categories: '[]',
      promoted_object: JSON.stringify({ page_id }),
    });

    const adCampaignId = adCampaign.id;

    // 2. Create an Ad Set (budget + targeting placeholder)
    const dailyBudget = Math.round((campaign.total_cost || 10) * 100); // cents
    const adSet = await graphPost(`/${actId}/adsets`, {
      access_token: systemUserToken,
      campaign_id: adCampaignId,
      name: `${campaignName} — Ad Set`,
      optimization_goal: objective === 'OUTCOME_AWARENESS' ? 'REACH' : objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 'ENGAGED_USERS_APP_INSTALL',
      billing_event: 'IMPRESSIONS',
      daily_budget: dailyBudget,
      campaign_spec: JSON.stringify({}), // Will be populated with audience targeting
      promoted_object: JSON.stringify({ page_id }),
      status: 'PAUSED',
    });

    const adSetId = adSet.id;

    // 3. Create an Ad (placeholder — creative comes later)
    let adId = null;
    try {
      const ad = await graphPost(`/${actId}/ads`, {
        access_token: systemUserToken,
        name: `${campaignName} — Ad`,
        adset_id: adSetId,
        status: 'PAUSED',
        creative: JSON.stringify({
          object_story_spec: {
            page_id,
            link_data: {
              message: campaign.description || 'Check out our business!',
              link: campaign.website_url || `https://facebook.com/${page_id}`,
            },
          },
        }),
      });
      adId = ad.id;
    } catch (e) { console.warn('Ad creation failed (non-fatal):', e.message); }

    // 4. Update records
    await supabase.from('MetaOnboarding').update({
      ad_campaign_id: adCampaignId,
      ad_campaign_status: 'created',
      step: 'campaign_creation',
      status: 'campaign_created',
      updated_at: new Date().toISOString(),
    }).eq('id', onboarding_id);

    await supabase.from('Campaign').update({
      onboarding_step: 'campaign_creation',
      onboarding_status: 'campaign_created',
      status: 'approved',
    }).eq('id', campaign_id);

    return res.status(200).json({
      ad_campaign_id: adCampaignId,
      ad_set_id: adSetId,
      ad_id: adId,
      status: 'created',
    });
  } catch (err) {
    console.error('meta-create-campaign error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
