import { useAds } from '@/hooks/useAds';
import AdBanner from './AdBanner';

/**
 * AdPlacement — drop this anywhere to render ads for a given placement slot.
 * All fetching, tracking, and dismiss logic is handled by useAds.
 */
export default function AdPlacement({ placement, userId, hasCampaigns = false, hasPages = false }) {
  const { ads, dismissAd, trackClick, loaded } = useAds(placement, userId, { hasCampaigns, hasPages });

  if (!loaded || !ads.length) return null;

  return (
    <div className="space-y-3">
      {ads.map(ad => (
        <AdBanner
          key={ad.id}
          ad={ad}
          onDismiss={dismissAd}
          onCtaClick={trackClick}
        />
      ))}
    </div>
  );
}