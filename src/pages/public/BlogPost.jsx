import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      setPost(data);
      if (data?.category) {
        const { data: rel } = await supabase
          .from('BlogPost')
          .select('id,title,slug,excerpt,category,published_at,cover_image')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3);
        setRelated(rel || []);
      }
    } catch { setPost(null); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      <div className="space-y-3 mt-8">{[1,2,3,4,5].map(i=><div key={i} className="h-4 bg-muted rounded animate-pulse" />)}</div>
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">😕</p>
      <h1 className="text-2xl font-bold mb-2">Post not found</h1>
      <Link to="/blog"><Button variant="outline" className="mt-4">← Back to blog</Button></Link>
    </div>
  );

  const readTime = Math.ceil((post.content?.split(' ').length || 200) / 200);

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-[hsl(var(--primary))] text-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to blog
          </Link>
          {post.category && <Badge className="mb-4 bg-white/10 text-white/80 border-white/20">{post.category}</Badge>}
          <h1 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.published_at || post.created_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTime} min read</span>
          </div>
        </div>
      </div>

      {post.cover_image && (
        <div className="max-w-3xl mx-auto px-4 -mt-8">
          <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl shadow-xl object-cover max-h-80" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="prose prose-lg max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-a:text-[hsl(var(--accent))] prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content_html || post.content?.replace(/\n/g,'<br/>') || '' }}
        />

        {/* Share */}
        <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
          <Link to="/blog"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" /> All posts</Button></Link>
          <Button variant="outline" size="sm" onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold font-display mb-6">More in {post.category}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map(r => (
              <Link key={r.id} to={`/blog/${r.slug}`} className="block bg-card border border-border rounded-xl p-4 hover:border-[hsl(var(--accent))]/40 hover:shadow transition-all group">
                <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-[hsl(var(--accent))] transition-colors line-clamp-2">{r.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
