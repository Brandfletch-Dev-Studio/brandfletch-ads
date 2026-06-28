import { useState, useMemo, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSEO } from '@/hooks/useSEO';
import {
  Search, X, ExternalLink, ArrowRight, Play, Images,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { key: 'all',           label: 'All Work' },
  { key: 'graphic_design',label: 'Graphic Design' },
  { key: 'meta_ads',      label: 'Meta Ads' },
  { key: 'ugc_ads',       label: 'UGC Ads' },
  { key: 'social_media',  label: 'Social Media' },
  { key: 'web_design',    label: 'Web Design' },
  { key: 'branding',      label: 'Branding' },
  { key: 'other',         label: 'Other' },
];

const CATEGORY_COLORS = {
  graphic_design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  meta_ads:       'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  ugc_ads:        'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  social_media:   'bg-green-500/10 text-green-600 dark:text-green-400',
  web_design:     'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  branding:       'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  other:          'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

const CATEGORY_LABELS = {
  graphic_design: 'Graphic Design',
  meta_ads:       'Meta Ads',
  ugc_ads:        'UGC Ads',
  social_media:   'Social Media',
  web_design:     'Web Design',
  branding:       'Branding',
  other:          'Other',
};

// Order service keys that map to /order?service=
const SERVICE_KEYS = ['graphic_design','meta_ads','ugc_ads','social_media','web_design','branding'];

function getOrderUrl(item) {
  const svc = item.category;
  if (SERVICE_KEYS.includes(svc)) return `/order?service=${svc}`;
  return '/contact';
}

// ── Video helpers ──────────────────────────────────────────────────────────────
function getEmbedId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube short links
    if (u.hostname === 'youtu.be') {
      return { platform: 'youtube', id: u.pathname.slice(1).split('?')[0] };
    }
    if (u.hostname.includes('youtube.com')) {
      // /shorts/ID
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return { platform: 'youtube', id: shortsMatch[1] };
      // watch?v=ID
      const vid = u.searchParams.get('v');
      if (vid) return { platform: 'youtube', id: vid };
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return { platform: 'vimeo', id };
    }
    if (u.hostname.includes('tiktok.com')) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return { platform: 'tiktok', id: m[1] };
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
      return { platform: 'mp4', id: url };
    }
  } catch {}
  return { platform: 'external', id: url };
}

function hasVideo(item) {
  return !!(item.video_url || item.video_urls?.length > 0);
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  useSEO({
    title: 'Portfolio — Brandfletch Media',
    description: 'A showcase of our work across Meta Ads, UGC creatives, graphic design, branding, and more — built for African businesses.',
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch]                 = useState('');
  const [lightbox, setLightbox]             = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['portfolioPublic'],
    queryFn: () => base44.entities.PortfolioItem.filter({ status: 'published' }, { sort: 'display_order' }),
  });

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== 'all') list = list.filter(i => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.client_name?.toLowerCase().includes(q) ||
        i.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, activeCategory, search]);

  const featured = filtered.filter(i => i.featured);
  const rest     = filtered.filter(i => !i.featured);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs font-semibold tracking-widest uppercase">Our Work</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Work that speaks for itself.</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            From social creatives to full ad campaigns — a selection of projects we've delivered for businesses across Africa.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setActiveCategory(c.key)}
                className={cn('px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  activeCategory === c.key ? 'bg-[hsl(var(--primary))] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-8 h-8 text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl bg-muted animate-pulse h-72" />)}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm mt-1">Try a different category or search term.</p>
          </div>
        )}
        {featured.length > 0 && (
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Featured</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featured.map(item => <PortfolioCard key={item.id} item={item} featured onOpen={setLightbox} />)}
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(item => <PortfolioCard key={item.id} item={item} onOpen={setLightbox} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-muted/40 border-t border-border/60 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to build something great?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
          Let's create work that makes your brand stand out.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/order">
            <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold">
              Start a project <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/pricing"><Button variant="outline">View pricing</Button></Link>
        </div>
      </section>

      {lightbox && (
        <Lightbox item={lightbox.item} initTab={lightbox.tab} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────────
function PortfolioCard({ item, featured, onOpen }) {
  const allImages = [item.cover_image, ...(item.images || [])].filter(Boolean);
  const thumb     = allImages[0];
  const hasVid    = hasVideo(item);
  const hasImgs   = allImages.length > 0;

  const openTab = hasImgs ? 'images' : 'video';

  return (
    <div className={cn(
      'group rounded-xl overflow-hidden border border-border/60 bg-card hover:shadow-lg transition-all duration-300 flex flex-col',
      featured && 'ring-2 ring-[hsl(var(--primary))]/20'
    )}>
      <div
        className={cn('relative overflow-hidden bg-muted cursor-pointer', featured ? 'h-64' : 'h-52')}
        onClick={() => onOpen({ item, tab: openTab })}
      >
        {thumb ? (
          <img src={thumb} alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : hasVid ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--primary))]/15 flex items-center justify-center border border-[hsl(var(--primary))]/20">
              <Play className="w-6 h-6 text-[hsl(var(--primary))] fill-current ml-0.5" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm opacity-40">
            No preview
          </div>
        )}
        {item.featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-[hsl(var(--primary))] text-white text-[10px] font-bold px-2">Featured</Badge>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-[10px] font-semibold border-0', CATEGORY_COLORS[item.category])}>
            {CATEGORY_LABELS[item.category] || item.category}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {hasVid && thumb && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/55 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
              <Play className="w-2.5 h-2.5 fill-current" /> Video
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-1">{item.title}</h3>
        {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>}
        <div className="flex items-center justify-between mb-2">
          {item.client_name ? <span className="text-xs text-muted-foreground">{item.client_name}</span> : <span />}
          {item.results && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{item.results}</span>}
        </div>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
        {/* Action links */}
        <div className="mt-auto flex gap-3 pt-1">
          {hasImgs && (
            <button onClick={() => onOpen({ item, tab: 'images' })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Images className="w-3.5 h-3.5" />
              View{allImages.length > 1 ? ` (${allImages.length})` : ''}
            </button>
          )}
          {hasVid && (
            <button onClick={e => { e.stopPropagation(); onOpen({ item, tab: 'video' }); }}
              className={cn('flex items-center gap-1.5 text-xs font-semibold transition-colors text-[hsl(var(--primary))] hover:opacity-75', hasImgs && 'ml-auto')}>
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch
            </button>
          )}
          {!hasImgs && !hasVid && (
            <button onClick={() => onOpen({ item, tab: 'images' })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ────────────────────────────────────────────────────────────────────
function Lightbox({ item, initTab, onClose }) {
  const navigate = useNavigate();
  const allImages = [item.cover_image, ...(item.images || [])].filter(Boolean);
  const allVideos = [item.video_url, ...(item.video_urls || [])].filter(Boolean);
  const hasImgs   = allImages.length > 0;
  const hasVid    = allVideos.length > 0;

  const defaultTab = initTab === 'video' ? 'video' : (hasImgs ? 'images' : hasVid ? 'video' : 'images');
  const [tab, setTab]     = useState(defaultTab);
  const [idx, setIdx]     = useState(0);
  const [vidIdx, setVidIdx] = useState(0);

  const effectiveTab = (tab === 'images' && !hasImgs && hasVid) ? 'video' : tab;

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleStartProject() {
    onClose();
    navigate(getOrderUrl(item));
  }

  const currentVideoUrl = allVideos[vidIdx] || '';
  const embedInfo = getEmbedId(currentVideoUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-5xl max-h-screen sm:max-h-[92vh] flex flex-col md:flex-row sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── LEFT: Media ── */}
        <div className="relative flex-1 bg-black flex flex-col min-h-[50vw] sm:min-h-0">

          {/* Tab switcher — only when both exist */}
          {hasImgs && hasVid && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-0.5 bg-black/60 backdrop-blur-md rounded-full p-0.5 border border-white/10">
              <button onClick={() => setTab('images')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  effectiveTab === 'images' ? 'bg-white text-black' : 'text-white/60 hover:text-white')}>
                <Images className="w-3 h-3" /> Images
              </button>
              <button onClick={() => setTab('video')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  effectiveTab === 'video' ? 'bg-white text-black' : 'text-white/60 hover:text-white')}>
                <Play className="w-3 h-3 fill-current" /> Video
              </button>
            </div>
          )}

          {/* Close button (mobile) */}
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors md:hidden">
            <X className="w-4 h-4" />
          </button>

          {/* IMAGES */}
          {effectiveTab === 'images' && hasImgs && (
            <div className="flex-1 relative flex items-center justify-center bg-black min-h-[240px]">
              <img src={allImages[idx]} alt={item.title}
                className="w-full h-full object-contain max-h-[55vh] md:max-h-full" />
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setIdx(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIdx(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setIdx(i)}
                        className={cn('w-1.5 h-1.5 rounded-full transition-all', i === idx ? 'bg-white scale-125' : 'bg-white/35 hover:bg-white/60')} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIDEO — native-feel player */}
          {effectiveTab === 'video' && hasVid && (
            <div className="flex-1 flex flex-col bg-black min-h-[240px]">
              <NativeVideoPlayer embedInfo={embedInfo} title={item.title} />

              {/* Multiple video selector */}
              {allVideos.length > 1 && (
                <div className="flex gap-2 px-3 py-2 bg-black/80 border-t border-white/10 overflow-x-auto">
                  {allVideos.map((_, i) => (
                    <button key={i} onClick={() => setVidIdx(i)}
                      className={cn('shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                        i === vidIdx ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
                      <Play className="w-2.5 h-2.5 fill-current" /> {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasImgs && !hasVid && (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">No media</div>
          )}
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="w-full md:w-[300px] flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-border/40 bg-card">
          {/* Header */}
          <div className="p-5 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <Badge className={cn('text-[10px] font-semibold border-0', CATEGORY_COLORS[item.category])}>
                {CATEGORY_LABELS[item.category]}
              </Badge>
              <button onClick={onClose} className="hidden md:flex text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-lg font-bold leading-snug">{item.title}</h2>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
            {item.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            )}
            {item.client_name && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Client</p>
                <p className="text-sm">{item.client_name}{item.client_industry && ` · ${item.client_industry}`}</p>
              </div>
            )}
            {item.results && (
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Results</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{item.results}</p>
              </div>
            )}
            {item.designer_name && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Designer</p>
                <p className="text-sm">{item.designer_name}</p>
              </div>
            )}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                ))}
              </div>
            )}

            {/* Media toggle links */}
            {hasImgs && hasVid && (
              <div className="flex gap-3 pt-1">
                {effectiveTab !== 'images' && (
                  <button onClick={() => setTab('images')}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Images className="w-3.5 h-3.5" /> View images
                  </button>
                )}
                {effectiveTab !== 'video' && (
                  <button onClick={() => setTab('video')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] hover:opacity-75 transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" /> Watch video
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CTA footer */}
          <div className="p-5 pt-4 border-t border-border/40">
            <Button
              className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold"
              onClick={handleStartProject}
            >
              Get this for my brand <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {SERVICE_KEYS.includes(item.category)
                ? `${CATEGORY_LABELS[item.category]} — choose a plan that fits`
                : 'Get in touch to discuss your brief'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Native Video Player ──────────────────────────────────────────────────────────
// Renders the embed full-bleed with no visible iframe chrome.
// For mp4: uses <video> with native controls hidden, custom overlay.
// For YouTube/Vimeo/TikTok: full-bleed iframe, no border/padding/background.
function NativeVideoPlayer({ embedInfo, title }) {
  const videoRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(false);
  const [started, setStarted]   = useState(false);

  if (!embedInfo) return (
    <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Video unavailable</div>
  );

  // ── mp4: native <video> with custom overlay play button ──
  if (embedInfo.platform === 'mp4') {
    return (
      <div className="flex-1 relative bg-black group">
        <video
          ref={videoRef}
          src={embedInfo.id}
          className="w-full h-full object-contain"
          playsInline
          onClick={() => {
            if (videoRef.current?.paused) { videoRef.current.play(); setPlaying(true); setStarted(true); }
            else { videoRef.current.pause(); setPlaying(false); }
          }}
          onEnded={() => setPlaying(false)}
        />
        {/* Big play overlay — disappears once started */}
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-9 h-9 text-white fill-current ml-1" />
            </div>
          </div>
        )}
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-3
          bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => {
            if (!videoRef.current) return;
            if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); setStarted(true); }
            else { videoRef.current.pause(); setPlaying(false); }
          }} className="text-white">
            {playing ? <span className="text-xs font-bold">⏸</span> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button onClick={() => { if (videoRef.current) { videoRef.current.muted = !muted; setMuted(!muted); } }} className="text-white">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={() => videoRef.current?.requestFullscreen?.()} className="text-white ml-auto">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── external link fallback ──
  if (embedInfo.platform === 'external') {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/90">
        <a href={embedInfo.id} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          <Play className="w-4 h-4 fill-current" /> Watch video
        </a>
      </div>
    );
  }

  // ── YouTube / Vimeo / TikTok — full-bleed iframe, zero chrome ──
  let src = '';
  if (embedInfo.platform === 'youtube') {
    src = `https://www.youtube-nocookie.com/embed/${embedInfo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white&iv_load_policy=3&controls=1&fs=1`;
  } else if (embedInfo.platform === 'vimeo') {
    src = `https://player.vimeo.com/video/${embedInfo.id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&color=ffffff`;
  } else if (embedInfo.platform === 'tiktok') {
    src = `https://www.tiktok.com/embed/v2/${embedInfo.id}?autoplay=1`;
  }

  return (
    <div className="flex-1 relative bg-black" style={{ aspectRatio: '9/16', maxHeight: '70vh' }}>
      <iframe
        key={src}
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
