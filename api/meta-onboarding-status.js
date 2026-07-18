/**
 * Meta Onboarding — Get Status (for resumability & polling)
 *
 * GET /api/meta-onboarding-status?onboarding_id=X
 *    or ?campaign_id=X
 * Returns: { step, status, fb_page_id, fb_page_name, fb_business_id, ... }
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cxfebvtsuzcbkpzezqom.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { onboarding_id, campaign_id } = req.query;
    if (!onboarding_id && !campaign_id)
      return res.status(400).json({ error: 'Missing onboarding_id or campaign_id' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let query = supabase.from('MetaOnboarding').select('*');
    if (onboarding_id) query = query.eq('id', onboarding_id);
    else query = query.eq('campaign_id', campaign_id).order('created_at', { ascending: false }).limit(1);

    const { data, error } = await query.single();
    if (error || !data) return res.status(404).json({ error: 'Onboarding record not found' });

    // If polling, also do a live access check
    if (data.status === 'access_pending' && data.polling_started_at) {
      const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
      const brandfletchBusinessId = process.env.META_BUSINESS_ID;
      if (systemUserToken && data.fb_page_id) {
        try {
          const checkRes = await fetch(`https://graph.facebook.com/v21.0/${brandfletchBusinessId}/client_pages?access_token=${systemUserToken}&fields=id,name,tasks&limit=500`);
          const checkData = await checkRes.json();
          const found = (checkData.data || []).find(p => p.id === data.fb_page_id);
          if (found && (found.tasks || []).includes('ADVERTISE')) {
            // Access granted! Update the record
            await supabase.from('MetaOnboarding').update({
              permissions_granted: true,
              missing_permissions: [],
              status: 'access_granted',
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('id', data.id);
            data.permissions_granted = true;
            data.status = 'access_granted';
            data.missing_permissions = [];
          }
        } catch (_) {}
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('meta-onboarding-status error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
