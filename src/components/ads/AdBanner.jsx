import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BG_STYLES = {
  blue:   'bg-gradient-to-r from-blue-600 to-blue-500 text-white',
  green:  'bg-gradient-to-r from-green-600 to-green-500 text-white',
  purple: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
  amber:  'bg-gradient-to-r from-amber-500 to-yellow-400 text-white',
  red:    'bg-gradient-to-r from-red-600 to-red-500 text-white',
  dark:   'bg-gradient-to-r from-gray-900 to-gray-800 text-white',
};

/**
 * AdBanner — pure display component.
 * Impression tracking is handled by useAds hook.
 * onDismiss and onCtaClick are callbacks from parent.
 */
export default function AdBanner({ ad, onDismiss, onCtaClick }) {
  if (!ad) return null;

  const bg = BG_STYLES[ad.background_color] || BG_STYLES.blue;
  const isExternal = ad.cta_external || ad.cta_url?.startsWith('http');

  return (
    <div className={`relative rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm ${bg}`}>
      {ad.image_url && (
        <img src={ad.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{ad.title}</p>
        {ad.body && <p className="text-xs opacity-85 mt-0.5 leading-relaxed">{ad.body}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {ad.cta_label && ad.cta_url && (
          isExternal ? (
            <a href={ad.cta_url} target="_blank" rel="noopener noreferrer" onClick={() => onCtaClick?.(ad.id)}>
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 font-semibold gap-1 text-xs">
                {ad.cta_label} <ArrowRight className="w-3 h-3" />
              </Button>
            </a>
          ) : (
            <Link to={ad.cta_url} onClick={() => onCtaClick?.(ad.id)}>
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 font-semibold gap-1 text-xs">
                {ad.cta_label} <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )
        )}
        {ad.is_dismissable && (
          <button onClick={() => onDismiss?.(ad.id)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 opacity-80" />
          </button>
        )}
      </div>
    </div>
  );
}