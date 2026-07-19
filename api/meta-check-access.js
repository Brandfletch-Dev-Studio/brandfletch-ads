/**
 * Meta Onboarding — Check Page Access
 *
 * POST /api/meta-check-access
 * Body: { page_id, business_id, onboarding_id }
 * Returns: {
 *   has_access: boolean,
 *   missing_permissions: string[],
 *   brandfletch_business_id: string,
 *   instructions: { business_id_to_copy, meta_settings_url, steps: [] }
 * }
 */
import { createClient } from '@supabase/supabase-js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cxfebvtsuzcbkpzezqom.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REQUIRED_PAGE_TASKS = ['ADVERTISE', 'MANAGE', 'CREATE_CONTENT'];

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
    const { page_id, business_id, onboarding_id } = req.body || {};
    if (!page_id || !onboarding_id)
      return res.status(400).json({ error: 'Missing required fields: page_id, onboarding_id' });

    const brandfletchBusinessId = process.env.META_BUSINESS_ID;
    const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
    if (!brandfletchBusinessId || !systemUserToken)
      return res.status(500).json({ error: 'Meta business credentials not configured' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let hasAccess = false;
    let missingPermissions = [];
    let pageName = null;

    // Check 1: owned_pages
    try {
      const ownedPages = await graphGet(`/${brandfletchBusinessId}/owned_pages`, {
        access_token: systemUserToken, fields: 'id,name,tasks', limit: 500,
      });
      const found = (ownedPages.data || []).find(p => p.id === page_id);
      if (found) {
        pageName = found.name;
        const tasks = found.tasks || [];
        missingPermissions = REQUIRED_PAGE_TASKS.filter(t => !tasks.includes(t));
        hasAccess = missingPermissions.length === 0;
      }
    } catch (e) { console.warn('owned_pages check failed:', e.message); }

    // Check 2: client_pages (shared with the business)
    if (!hasAccess) {
      try {
        const clientPages = await graphGet(`/${brandfletchBusinessId}/client_pages`, {
          access_token: systemUserToken, fields: 'id,name,tasks', limit: 500,
        });
        const found = (clientPages.data || []).find(p => p.id === page_id);
        if (found) {
          pageName = found.name;
          const tasks = found.tasks || [];
          missingPermissions = REQUIRED_PAGE_TASKS.filter(t => !tasks.includes(t));
          hasAccess = missingPermissions.length === 0;
        }
      } catch (e) { console.warn('client_pages check failed:', e.message); }
    }

    // Check 3: Direct page access via system user token
    if (!hasAccess) {
      try {
        const pageInfo = await graphGet(`/${page_id}`, {
          access_token: systemUserToken, fields: 'id,name',
        });
        if (pageInfo?.id === page_id) {
          pageName = pageInfo.name;
          try {
            const tasksData = await graphGet(`/${page_id}/assigned_users`, {
              access_token: systemUserToken, fields: 'tasks',
            });
            const ourEntry = (tasksData.data || []).find(u => u.tasks?.includes('ADVERTISE'));
            if (ourEntry) { hasAccess = true; missingPermissions = []; }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Update onboarding record
    const { data: onboarding } = await supabase
      .from('MetaOnboarding').select('campaign_id').eq('id', onboarding_id).single();

    const updateData = {
      fb_page_id: page_id, fb_page_name: pageName,
      fb_business_id: business_id || null,
      permissions_granted: hasAccess,
      missing_permissions: missingPermissions,
      step: 'verify_access',
      status: hasAccess ? 'access_granted' : 'access_pending',
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Build assets object — extensible for Instagram, Pixel, Catalog, etc.
    if (hasAccess) {
      updateData.assets = {
        page: { id: page_id, name: pageName, connected: true },
        // Future: instagram, pixel, catalog — added without redesigning the flow
      };
    }
    if (!hasAccess && !updateData.polling_started_at) {
      updateData.polling_started_at = new Date().toISOString();
    }

    if (onboarding?.campaign_id) {
      await supabase.from('Campaign').update({
        fb_page_id: page_id, fb_business_id: business_id || null,
        onboarding_step: 'verify_access',
        onboarding_status: hasAccess ? 'access_granted' : 'access_pending',
      }).eq('id', onboarding.campaign_id);
    }

    await supabase.from('MetaOnboarding').update(updateData).eq('id', onboarding_id);

    const response = {
      has_access: hasAccess,
      missing_permissions: missingPermissions,
      brandfletch_business_id: brandfletchBusinessId,
      meta_settings_url: 'https://business.facebook.com/settings/partners',
      page_name: pageName,
    };

    if (!hasAccess) {
      response.instructions = {
        business_id_to_copy: brandfletchBusinessId,
        meta_settings_url: 'https://business.facebook.com/settings/partners',
        steps: [
          'Meta Business Settings will open in a new tab.',
          'Go to the "Partners" section in the left sidebar.',
          'Click "Add" → "Add a partner by Business ID".',
          `Paste this Business ID: ${brandfletchBusinessId}`,
          'Click "Next" and select the Facebook Page you want to share.',
          'Grant Brandfletch the "Advertise" and "Manage" permissions.',
          'Click "Save" and come back here.',
        ],
      };
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('meta-check-access error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
