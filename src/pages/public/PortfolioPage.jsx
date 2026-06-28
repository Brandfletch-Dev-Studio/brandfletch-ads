import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSEO } from '@/hooks/useSEO';
import { Search, X, ExternalLink, ArrowRight, Play, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

// ── Video URL helpers ─────────────────────────────────────────────────────────
function getVideoEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);

    // YouTube watch?v= or youtu.be/
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v') || u.pathname.split('/').pop();
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` };
    }

    // YouTube Shorts
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.replace('/shorts/', '');
      return { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` };
    }

    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1` };
    }

    // TikTok
    if (u.hostname.includes('tiktok.com')) {
      const id = u.pathname.split('/video/')[1]?.split('?')[0];
      if (id) return { type: 'iframe', src: `https://www.tiktok.com/embed/v2/${id}` };
    }

    // Direct video file
    if (/\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) {
      return { type: 'video', src: url };
    }

    // Fallback: open external
    return { type: 'external', src: url };
  } catch {
    return null;
  }
}

function hasVideo(item) {
  return !!(item.video_url || item.video_urls?.length > 0);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  useSEO({
    title: 'Portfolio — Brandfletch Media',
    description: 'A showcase of our work across Meta Ads, UGC creatives, graphic design, branding, and more — built for African businesses.',
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch]                 = useState('');
  const [lightbox, setLightbox]             = useState(null); // { item, tab: 'images'|'video', imgIndex }

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
      {/* ── Hero ── */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs font-semibold tracking-widest uppercase">
            Our Work
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Work that speaks for itself.
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            From social creatives to full ad campaigns — a selection of projects we've delivered for businesses across Africa.
          </p>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  activeCategory === c.key
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-8 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
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
              {featured.map(item => (
                <PortfolioCard key={item.id} item={item} featured onOpen={setLightbox} />
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(item => (
              <PortfolioCard key={item.id} item={item} onOpen={setLightbox} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="bg-muted/40 border-t border-border/60 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to build something great?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
          Let's create work that makes your brand stand out. Start with a quick conversation.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/contact">
            <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold">
              Start a project <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline">View pricing</Button>
          </Link>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          item={lightbox.item}
          initTab={lightbox.tab}
          initImgIndex={lightbox.imgIndex ?? 0}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// ── Portfolio card ────────────────────────────────────────────────────────────
function PortfolioCard({ item, featured, onOpen }) {
  const allImages = [item.cover_image, ...(item.images || [])].filter(Boolean);
  const thumb     = allImages[0];
  const hasVid    = hasVideo(item);
  const hasImgs   = allImages.length > 0;

  return (
    <div className={cn(
      'group rounded-xl overflow-hidden border border-border/60 bg-card hover:shadow-lg transition-all duration-300 flex flex-col',
      featured && 'ring-2 ring-[hsl(var(--primary))]/20'
    )}>
      {/* Thumbnail — click opens images tab */}
      <div
        className={cn('relative overflow-hidden bg-muted cursor-pointer', featured ? 'h-64' : 'h-52')}
        onClick={() => onOpen({ item, tab: 'images', imgIndex: 0 })}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : hasVid ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
              <Play className="w-7 h-7 text-[hsl(var(--primary))] fill-current ml-0.5" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
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
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {/* Video badge */}
        {hasVid && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/60 text-white border-0 text-[10px] gap-1">
              <Play className="w-2.5 h-2.5 fill-current" /> Video
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-1">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mb-2">
          {item.client_name
            ? <span className="text-xs text-muted-foreground">{item.client_name}</span>
            : <span />
          }
          {item.results && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{item.results}</span>
          )}
        </div>

        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
            ))}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="mt-auto flex gap-2 pt-1">
          {hasImgs && (
            <button
              onClick={() => onOpen({ item, tab: 'images', imgIndex: 0 })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Images className="w-3.5 h-3.5" />
              View images
              {allImages.length > 1 && (
                <span className="text-[10px] bg-muted rounded px-1">{allImages.length}</span>
              )}
            </button>
          )}
          {hasVid && (
            <button
              onClick={e => { e.stopPropagation(); onOpen({ item, tab: 'video', imgIndex: 0 }); }}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                hasImgs ? 'ml-auto' : '',
                'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80'
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch video
            </button>
          )}
          {!hasImgs && !hasVid && (
            <button
              onClick={() => onOpen({ item, tab: 'images', imgIndex: 0 })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ item, initTab, initImgIndex, onClose }) {
  const allImages  = [item.cover_image, ...(item.images || [])].filter(Boolean);
  const allVideos  = [item.video_url, ...(item.video_urls || [])].filter(Boolean);
  const hasImgs    = allImages.length > 0;
  const hasVid     = allVideos.length > 0;

  // Default tab: prefer video if opened from Watch button; else images if exist; else video
  const defaultTab = initTab === 'video' ? 'video' : (hasImgs ? 'images' : 'video');
  const [tab, setTab]   = useState(defaultTab);
  const [idx, setIdx]   = useState(initImgIndex ?? 0);
  const [vidIdx, setVidIdx] = useState(0);

  const embed = getVideoEmbed(allVideos[vidIdx]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl overflow-hidden max-w-5xl w-full max-h-[95vh] flex flex-col md:flex-row shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Left: media panel ── */}
        <div className="relative flex-1 bg-black flex flex-col min-h-[260px]">

          {/* Tab bar (only shown when both types exist) */}
          {hasImgs && hasVid && (
            <div className="flex bg-black/60 border-b border-white/10">
              <button
                onClick={() => setTab('images')}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'images' ? 'text-white border-b-2 border-white' : 'text-white/50 hover:text-white/80')}
              >
                <Images className="w-3.5 h-3.5" /> Images ({allImages.length})
              </button>
              <button
                onClick={() => setTab('video')}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'video' ? 'text-white border-b-2 border-white' : 'text-white/50 hover:text-white/80')}
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Video{allVideos.length > 1 ? ` (${allVideos.length})` : ''}
              </button>
            </div>
          )}

          {/* Images tab */}
          {(tab === 'images' || !hasVid) && hasImgs && (
            <div className="flex-1 relative flex items-center justify-center min-h-[240px]">
              <img
                src={allImages[idx]}
                alt={`${item.title} ${idx + 1}`}
                className="w-full h-full object-contain max-h-[55vh] md:max-h-[70vh]"
              />
              {/* Prev/Next arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setIdx(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIdx(i => (i + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={cn('w-2 h-2 rounded-full transition-all', i === idx ? 'bg-white scale-125' : 'bg-white/40')}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Video tab */}
          {(tab === 'video' || !hasImgs) && hasVid && (
            <div className="flex-1 flex flex-col">
              {/* Video embed */}
              <div className="flex-1 relative bg-black min-h-[240px]">
                {embed?.type === 'iframe' && (
                  <iframe
                    src={embed.src}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={item.title}
                  />
                )}
                {embed?.type === 'video' && (
                  <video
                    src={embed.src}
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {embed?.type === 'external' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={embed.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" /> Open video
                    </a>
                  </div>
                )}
                {!embed && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    Video unavailable
                  </div>
                )}
              </div>
              {/* Multiple videos: thumbnails */}
              {allVideos.length > 1 && (
                <div className="flex gap-2 p-2 bg-black/60 border-t border-white/10 overflow-x-auto">
                  {allVideos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setVidIdx(i)}
                      className={cn(
                        'flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                        i === vidIdx ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      )}
                    >
                      <Play className="w-3 h-3 fill-current" /> Video {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nothing to show */}
          {!hasImgs && !hasVid && (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">No media</div>
          )}
        </div>

        {/* ── Right: info panel ── */}
        <div className="w-full md:w-80 p-6 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-border/60 bg-card">
          <div className="flex items-start justify-between mb-3">
            <Badge className={cn('text-[10px] font-semibold border-0', CATEGORY_COLORS[item.category])}>
              {CATEGORY_LABELS[item.category]}
            </Badge>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold mb-2">{item.title}</h2>

          {item.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
          )}

          {item.client_name && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Client</p>
              <p className="text-sm">{item.client_name}{item.client_industry && ` · ${item.client_industry}`}</p>
            </div>
          )}

          {item.results && (
            <div className="mb-3 p-3 bg-emerald-500/10 rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Results</p>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{item.results}</p>
            </div>
          )}

          {item.designer_name && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Designer</p>
              <p className="text-sm">{item.designer_name}</p>
            </div>
          )}

          {item.tags?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {item.tags.map(t => (
                  <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA actions ── */}
          <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-2">
            <Link to="/contact" onClick={onClose}>
              <Button className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold text-sm">
                Start a similar project <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
            {hasVid && tab !== 'video' && (
              <button
                onClick={() => setTab('video')}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors py-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Watch video
              </button>
            )}
            {hasImgs && tab !== 'images' && (
              <button
                onClick={() => setTab('images')}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <Images className="w-3.5 h-3.5" /> View images
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
