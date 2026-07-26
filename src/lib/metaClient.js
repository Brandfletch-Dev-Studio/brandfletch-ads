/**
 * Meta Onboarding API Client
 *
 * Thin helper for calling the Vercel serverless functions that handle
 * Meta Graph API operations. All Meta API calls go through these
 * server-side endpoints — no Meta tokens are ever exposed to the browser.
 */

const API_BASE = import.meta.env.VITE_API_BASE || ''; // same origin on Vercel

async function callApi(path, options = {}) {
  const method = options.method || 'POST';
  const headers = {};
  // Only set Content-Type for requests with a body
  if (options.body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Supabase auth token if available (for user verification on server)
  try {
    const { supabase } = await import('@/api/base44Client');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (_) {
    // Non-fatal — server uses service role key anyway
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: (options.body && method !== 'GET') ? JSON.stringify(options.body) : undefined,
  });

  // Handle non-JSON responses gracefully
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { data = { error: text || `Request failed (${res.status})` }; }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const metaClient = {
  // Step 1: Initiate Facebook Login — returns OAuth URL
  initiate: (campaign_id, user_id, redirect_uri) =>
    callApi('/api/meta-onboarding-init', { body: { campaign_id, user_id, redirect_uri } }),

  // Step 2: Handle OAuth callback — exchanges code for pages + businesses
  callback: (code, state, redirect_uri) =>
    callApi('/api/meta-onboarding-callback', { body: { code, state, redirect_uri } }),

  // Step 3: Check if Brandfletch has ad access to the selected page
  checkAccess: (page_id, business_id, onboarding_id) =>
    callApi('/api/meta-check-access', { body: { page_id, business_id, onboarding_id } }),

  // Step 4: Get onboarding status (for polling + resumability)
  getStatus: (onboarding_id) =>
    callApi(`/api/meta-onboarding-status?onboarding_id=${onboarding_id}`, { method: 'GET' }),

  getStatusByCampaign: (campaign_id) =>
    callApi(`/api/meta-onboarding-status?campaign_id=${campaign_id}`, { method: 'GET' }),

  // Step 5: Create the Meta ad campaign
  createCampaign: (campaign_id, onboarding_id, page_id) =>
    callApi('/api/meta-create-campaign', { body: { campaign_id, onboarding_id, page_id } }),

  // Future: Add additional Meta assets (Instagram, Pixel, Catalog, etc.)
  // addAsset: (onboarding_id, asset_type, asset_data) =>
  //   callApi('/api/meta-add-asset', { body: { onboarding_id, asset_type, ...asset_data } }),
};
