import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdBanner from './AdBanner';

function isActive(ad) {
  const today = new Date().toISOString().split('T')[0];
  if (!ad.is_active) return false;
  if (ad.start_date && ad.start_date > today) return false;
  if (ad.end_date && ad.end_date < today) return false;
  return true;
}

function matchesAudience(ad, { hasCampaigns, hasPages }) {
  switch (ad.target_audience) {
    case 'no_campaigns': return !hasCampaigns;
    case 'no_pages':     return !hasPages;
    case 'has_campaigns': return hasCampaigns;
    default:             return true;
  }
}

export default function AdPlacement({ placement, userId, hasCampaigns = false, hasPages = false }) {
  const [ads, setAds] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_ads') || '[]'); } catch { return []; }
  });
  // Track whether data has loaded so we don't show stale empty state
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoaded(false);
    base44.entities.AppAd.filter({ placement })
      .then(data => { setAds(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [placement, userId]);

  function handleDismiss(adId) {
    const next = [...dismissed, adId];
    setDismissed(next);
    localStorage.setItem('dismissed_ads', JSON.stringify(next));
  }

  const visible = ads
    .filter(a => isActive(a) && !dismissed.includes(a.id) && matchesAudience(a, { hasCampaigns, hasPages }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (!loaded || !visible.length) return null;

  return (
    <div className="space-y-3">
      {visible.map(ad => (
        <AdBanner key={ad.id} ad={ad} userId={userId} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}