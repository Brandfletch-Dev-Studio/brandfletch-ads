import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, AlertCircle, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';

const ARTICLE_CSS = `
  .bf-article { color: hsl(var(--foreground)); line-height: 1.8; font-size: 1.05rem; }
  .bf-article h1,.bf-article h2,.bf-article h3,.bf-article h4 {
    font-weight: 700; color: hsl(var(--foreground)); margin: 1.5em 0 0.5em; line-height: 1.3;
  }
  .bf-article h1 { font-size: 2em; }
  .bf-article h2 { font-size: 1.4em; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.3em; }
  .bf-article h3 { font-size: 1.15em; }
  .bf-article p  { margin: 0 0 1em; color: hsl(var(--foreground) / 0.9); }
  .bf-article a  { color: hsl(var(--primary)); text-decoration: underline; }
  .bf-article strong { font-weight: 700; }
  .bf-article em { font-style: italic; }
  .bf-article ul,.bf-article ol { padding-left: 1.5em; margin: 0 0 1em; }
  .bf-article ul { list-style: disc; }
  .bf-article ol { list-style: decimal; }
  .bf-article li { margin-bottom: 0.4em; }
  .bf-article blockquote {
    border-left: 4px solid hsl(var(--primary)); background: hsl(var(--muted));
    padding: 1em 1.25em; margin: 1.5em 0; border-radius: 0 8px 8px 0;
    color: hsl(var(--muted-foreground)); font-style: italic;
  }
  .bf-article code {
    background: hsl(var(--muted)); color: hsl(var(--primary));
    padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em;
  }
  .bf-article pre {
    background: hsl(var(--muted)); border: 1px solid hsl(var(--border));
    border-radius: 8px; padding: 1em; overflow-x: auto; margin: 1.5em 0;
  }
  .bf-article pre code { background: none; padding: 0; color: hsl(var(--foreground)); }
  .bf-article img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; display: block; }
  .bf-article hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 2em 0; }
  .bf-article table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
  .bf-article th,.bf-article td { border: 1px solid hsl(var(--border)); padding: 0.6em 1em; text-align: left; }
  .bf-article th { background: hsl(var(--muted)); font-weight: 600; }
`;

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const viewTracked = useRef(false);
  const readTracked = useRef(false);

  useEffect(() => {
    viewTracked.current = false;
    readTracked.current = false;
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const onScroll = () => {
      if (readTracked.current) return;
      const el = document.getElementById('blog-content');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = (window.innerHeight - rect.top) / rect.height;
      if (scrolled > 0.8) {
        readTracked.current = true;
        try {
          supabase.rpc('increment_blog_counter', { post_id: post.id, col_name: 'read_count' }).then(() => {}).catch(() => {});
        } catch (_) {}
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [post]);

  const fetchPost = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setPost(null);
    try {
      // Use maybeSingle() — returns null instead of throwing PGRST116 on no rows
      const { data, error: err } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (err) {
        console.error('[BlogPost] Query error:', err);
        setError('error');
        return;
      }

      if (!data) {
        setError('not_found');
        return;
      }

      setPost(data);

      // Fire-and-forget view counter — fully isolated from render path
      if (!viewTracked.current) {
        viewTracked.current = true;
        Promise.resolve().then(() => {
          supabase.rpc('increment_blog_counter', { post_id: data.id, col_name: 'view_count' })
            .then(() => {}).catch(() => {});
        });
      }

      // Related posts — isolated, won't affect main post render
      if (data.category) {
        supabase
          .from('BlogPost')
          .select('id,title,slug,excerpt,category,published_at,cover_image,emoji,view_count')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3)
          .then(({ data: rel }) => setRelated(rel || []))
          .catch(() => setRelated([]));
      }
    } catch (err) {
      console.error('[BlogPost] Unexpected error:', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    try {
      const url = window.location.href;
      const title = post?.title || 'Check this out';
      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => {});
      }
      if (post?.id) {
        supabase.rpc('increment_blog_counter', { post_id: post.id, col_name: 'share_count' })
          .then(() => {}).catch(() => {});
      }
    } catch (_) {}
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="space-y-3 mt-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`h-4 bg-muted rounded animate-pulse ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (error === 'not_found') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">This article may have been moved or removed.</p>
        <Link to="/blog">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to blog</Button>
        </Link>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error === 'error' || (!loading && !post)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">Could not load this post. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={fetchPost} variant="outline">Try again</Button>
          <Link to="/blog">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Render post ────────────────────────────────────────────────────────────
  const plainText = (post.content_html || post.content || '').replace(/<[^>]+>/g, '');
  const readTime = Math.max(1, Math.ceil((plainText.trim().split(/\s+/).filter(Boolean).length || 1) / 200));
  const htmlContent = post.content_html || post.content || '<p>No content available.</p>';
  const pubDate = post.published_at || post.created_date;

  return (
    <div className="bg-background">
      <style>{ARTICLE_CSS}</style>

      {/* Header */}
      <div className="bg-[hsl(var(--primary))] text-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to blog
          </Link>
          {post.category && (
            <Badge className="mb-4 bg-white/10 text-white/80 border-white/20">{post.category}</Badge>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-white/70 text-lg mb-5 leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-white/60 text-sm flex-wrap">
            {pubDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />{readTime} min read
            </span>
            {post.author_name && (
              <span className="text-white/50">by {post.author_name}</span>
            )}
            {(post.view_count || 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />{post.view_count.toLocaleString()} views
              </span>
            )}
          </div>
        </div>
      </div>

      {post.cover_image && (
        <div className="max-w-3xl mx-auto px-4 -mt-8">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-2xl shadow-xl object-cover max-h-80"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div
          id="blog-content"
          className="bf-article"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
          <Link to="/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> All posts
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {(post.read_count || 0) > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />{post.read_count.toLocaleString()} reads
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1.5" /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold mb-6">More in {post.category}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map(r => (
              <Link
                key={r.id}
                to={`/blog/${r.slug}`}
                className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
              >
                {r.cover_image ? (
                  <div className="h-36 overflow-hidden bg-muted">
                    <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-3xl">{r.emoji || '📣'}</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {r.published_at && (
                      <span>{new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {(r.view_count || 0) > 0 && (
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{r.view_count}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
