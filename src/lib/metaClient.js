/**
 * Meta Onboarding API Client
 *
 * Thin helper for calling the Vercel serverless functions that handle
 * Meta Graph API operations. All Meta API calls go through these
 * server-side endpoints — no Meta tokens are ever exposed to the browser.
 */

const API_BASE = import.meta.env.VITE_API_BASE || ''; // same origin on Vercel

async function callApi(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
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
};
