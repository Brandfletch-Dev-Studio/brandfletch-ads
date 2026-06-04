import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const SESSION_KEY = 'bf_dismissed_ads';

function getDismissed() {
  try { return new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveDismissed(set) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set])); } catch {}
}

function isAdActive(ad) {
  const today = new Date().toISOString().split('T')[0];
  if (!ad.is_active) return false;
  if (ad.start_date && ad.start_date > today) return false;
  if (ad.end_date && ad.end_date < today) return false;
  return true;
}

function matchesAudience(ad, { hasCampaigns, hasPages }) {
  switch (ad.target_audience) {
    case 'no_campaigns':  return !hasCampaigns;
    case 'no_pages':      return !hasPages;
    case 'has_campaigns': return hasCampaigns;
    default:              return true;
  }
}

/**
 * useAds(placement, userId, { hasCampaigns, hasPages })
 * Returns { ads, dismissAd, trackClick }
 *
 * - ads: visible ads for this placement/audience, sorted by sort_order
 * - dismissAd(adId): records dismiss event + hides ad for session
 * - trackClick(adId): records click event
 */
export function useAds(placement, userId, { hasCampaigns = false, hasPages = false } = {}) {
  const [allAds, setAllAds] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);
  const [loaded, setLoaded] = useState(false);
  const impressionsTracked = useRef(new Set());

  useEffect(() => {
    if (!placement || !userId) return;
    base44.entities.AppAd.filter({ placement })
      .then(data => { setAllAds(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [placement, userId]);

  const ads = allAds
    .filter(a => isAdActive(a) && !dismissed.has(a.id) && matchesAudience(a, { hasCampaigns, hasPages }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Track impressions for newly visible ads
  useEffect(() => {
    if (!userId || !loaded) return;
    ads.forEach(ad => {
      if (!impressionsTracked.current.has(ad.id)) {
        impressionsTracked.current.add(ad.id);
        base44.entities.AdEvent.create({ ad_id: ad.id, user_id: String(userId), event_type: 'impression' }).catch(() => {});
      }
    });
  }, [ads, userId, loaded]);

  function dismissAd(adId) {
    const next = new Set(dismissed);
    next.add(adId);
    setDismissed(next);
    saveDismissed(next);
    if (userId) {
      base44.entities.AdEvent.create({ ad_id: adId, user_id: String(userId), event_type: 'dismiss' }).catch(() => {});
    }
  }

  function trackClick(adId) {
    if (userId) {
      base44.entities.AdEvent.create({ ad_id: adId, user_id: String(userId), event_type: 'click' }).catch(() => {});
    }
  }

  return { ads, dismissAd, trackClick, loaded };
}