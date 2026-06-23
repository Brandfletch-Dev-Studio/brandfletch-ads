import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => { fetchPost(); }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (err) throw err;
      setPost(data);

      if (data?.category) {
        const { data: rel } = await supabase
          .from('BlogPost')
          .select('id,title,slug,excerpt,category,published_at,cover_image,emoji')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3);
        setRelated(rel || []);
      }
    } catch (err) {
      console.error('BlogPost fetchPost:', err);
      setError(err.code === 'PGRST116' ? 'not_found' : 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
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

  if (error === 'not_found' || !post) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h1 className="text-2xl font-bold mb-2">Post not found</h1>
      <p className="text-muted-foreground mb-6">This article may have been moved or removed.</p>
      <Link to="/blog">
        <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to blog</Button>
      </Link>
    </div>
  );

  if (error === 'error') return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">Could not load this post. Please try again.</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={fetchPost} variant="outline">Try again</Button>
        <Link to="/blog"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to blog</Button></Link>
      </div>
    </div>
  );

  // Strip HTML tags for read time calculation
  const plainText = post.content?.replace(/<[^>]+>/g, '') || '';
  const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).length / 200));

  // The content field contains Quill HTML — render it directly
  const htmlContent = post.content_html || post.content || '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // small feedback — could use toast but keeping deps light
        alert('Link copied to clipboard!');
      }
    } catch (_) {}
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-[hsl(var(--primary))] text-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to blog
          </Link>
          {post.category && (
            <Badge className="mb-4 bg-white/10 text-white/80 border-white/20">{post.category}</Badge>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-white/70 text-lg mb-5 leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at || post.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readTime} min read
            </span>
            {post.author_name && (
              <span className="text-white/50">by {post.author_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="max-w-3xl mx-auto px-4 -mt-8">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-2xl shadow-xl object-cover max-h-80"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="
            prose prose-lg max-w-none
            text-foreground
            prose-headings:text-foreground prose-headings:font-bold
            prose-p:text-foreground/90 prose-p:leading-relaxed
            prose-a:text-primary prose-a:underline
            prose-strong:text-foreground
            prose-blockquote:border-primary prose-blockquote:text-muted-foreground
            prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded
            prose-pre:bg-muted prose-pre:border prose-pre:border-border
            prose-img:rounded-xl
            prose-li:text-foreground/90
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Share / nav */}
        <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
          <Link to="/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> All posts
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
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
                  {r.published_at && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
