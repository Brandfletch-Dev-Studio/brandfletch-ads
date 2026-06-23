import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/base44Client';

function PostCard({ post }) {
  const readTime = Math.ceil((post.content?.replace(/<[^>]+>/g, '').split(' ').length || 200) / 200);
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
    >
      {post.cover_image ? (
        <div className="h-48 overflow-hidden bg-muted">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
          <span className="text-5xl">{post.emoji || '📣'}</span>
        </div>
      )}
      <div className="p-5">
        {post.category && (
          <Badge variant="outline" className="mb-2 text-xs">{post.category}</Badge>
        )}
        <h3 className="font-bold text-foreground text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.published_at || post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime} min read
            </span>
          </div>
          <span className="text-primary font-medium text-xs">Read →</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (err) throw err;
      setPosts(data || []);
    } catch (err) {
      console.error('BlogIndex fetchPosts:', err);
      setError('Could not load posts. Please try again.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))];
  const filtered = posts.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Insights & tips</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">The Brandfletch Blog</h1>
          <p className="text-white/70 text-lg">Advertising tips, success stories, and growth strategies for African businesses.</p>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/70'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive mb-8">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={fetchPosts} className="ml-auto">Retry</Button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border">
                  <div className="h-48 bg-muted animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-5 bg-muted rounded animate-pulse w-4/5" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-3">✍️</p>
              <p className="font-medium">{search || category !== 'All' ? 'No articles match your filters.' : 'No articles yet. Check back soon!'}</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
