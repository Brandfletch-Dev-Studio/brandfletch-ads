import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Globe, FileText,
  Loader2, AlertCircle, ExternalLink, BarChart3, TrendingUp,
  BookOpen, Share2, ArrowUpRight, ArrowDownRight, Upload, Image as ImageIcon,
  Hash, X as XIcon, Search as SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const CATEGORIES = ['Strategy','Tips','Case Study','News','Product Update','Guide'];
const EMPTY_POST = {
  title: '', slug: '', excerpt: '', content: '', content_html: '',
  category: '', emoji: '📣', status: 'draft',
  author_name: 'Brandfletch Team', cover_image: '',
  meta_title: '', meta_description: '', tags: [],
};

// Strip HTML tags for content validation
const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').trim();

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ posts }) {
  const published = posts.filter(p => p.status === 'published');

  const totalViews  = published.reduce((s, p) => s + (p.view_count  || 0), 0);
  const totalReads  = published.reduce((s, p) => s + (p.read_count  || 0), 0);
  const totalShares = published.reduce((s, p) => s + (p.share_count || 0), 0);
  const avgReadRate = totalViews > 0 ? Math.round((totalReads / totalViews) * 100) : 0;

  // Top posts by views
  const topByViews = [...published]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 8);

  // Posts per category
  const byCategory = useMemo(() => {
    const map = {};
    published.forEach(p => {
      const cat = p.category || 'Uncategorised';
      if (!map[cat]) map[cat] = { category: cat, views: 0, reads: 0, posts: 0 };
      map[cat].views  += p.view_count  || 0;
      map[cat].reads  += p.read_count  || 0;
      map[cat].posts  += 1;
    });
    return Object.values(map).sort((a, b) => b.views - a.views);
  }, [published]);

  // Monthly publish trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      months.push({ month: key, posts: 0, views: 0 });
    }
    posts.forEach(p => {
      const date = new Date(p.published_at || p.created_date);
      const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const slot = months.find(m => m.month === key);
      if (slot) {
        slot.posts++;
        slot.views += p.view_count || 0;
      }
    });
    return months;
  }, [posts]);

  if (published.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No published posts yet</p>
        <p className="text-sm mt-1">Publish your first post to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Views"    value={totalViews.toLocaleString()}  icon={Eye}       color="bg-violet-500/10 text-violet-500"  sub={`${published.length} published posts`} />
        <StatCard label="Total Reads"    value={totalReads.toLocaleString()}  icon={BookOpen}  color="bg-blue-500/10 text-blue-500"      sub="Scrolled to 80%" />
        <StatCard label="Read Rate"      value={`${avgReadRate}%`}            icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" sub="Reads / Views" />
        <StatCard label="Total Shares"   value={totalShares.toLocaleString()} icon={Share2}    color="bg-amber-500/10 text-amber-500"    sub="Via share button" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top posts by views */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Top Posts by Views</h3>
          {topByViews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No view data yet</p>
          ) : (
            <div className="space-y-3">
              {topByViews.map((p, i) => {
                const maxViews = topByViews[0]?.view_count || 1;
                const pct = Math.round(((p.view_count || 0) / maxViews) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{(p.view_count || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{p.read_count || 0} reads</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Views by Category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No category data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly publish + view trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4">6-Month Trend — Posts Published &amp; Views</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
            />
            <Line yAxisId="left"  type="monotone" dataKey="posts"  stroke="hsl(var(--primary))"   strokeWidth={2} dot={{ r: 4 }} name="Posts" />
            <Line yAxisId="right" type="monotone" dataKey="views"  stroke="hsl(173 58% 45%)"       strokeWidth={2} dot={{ r: 4 }} name="Views" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All posts performance table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">All Posts Performance</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Post</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Views</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Reads</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Read Rate</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Shares</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...published].sort((a,b)=>(b.view_count||0)-(a.view_count||0)).map(p => {
              const readRate = (p.view_count || 0) > 0
                ? Math.round(((p.read_count||0) / p.view_count) * 100)
                : 0;
              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{p.emoji}</span>
                      <div>
                        <p className="font-medium line-clamp-1">{p.title}</p>
                        {p.category && <Badge variant="outline" className="text-[10px] mt-0.5">{p.category}</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{(p.view_count||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{(p.read_count||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={`font-medium ${readRate >= 50 ? 'text-emerald-500' : readRate >= 25 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {readRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">{(p.share_count||0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('BlogPost')
        .select('*')
        .order('created_date', { ascending: false });
      if (err) throw err;
      setPosts(data || []);
    } catch (err) {
      console.error('AdminBlog fetchPosts:', err);
      setError(err.message || 'Failed to load posts');
      toast.error('Failed to load posts — check console for details');
    } finally {
      setLoading(false);
    }
  };

  const openNew  = () => setEditing({ ...EMPTY_POST });
  const openEdit = (p) => setEditing({ ...p });

  const handleSave = async () => {
    if (!editing.title?.trim()) { toast.error('Title is required'); return; }
    if (!editing.slug?.trim())  { toast.error('Slug is required'); return; }

    // Validate content — strip HTML and check for actual text
    const contentText = stripHtml(editing.content || '');
    if (!contentText) { toast.error('Content cannot be empty'); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        title:        editing.title.trim(),
        slug:         editing.slug.trim(),
        excerpt:      editing.excerpt?.trim() || '',
        content:      editing.content,
        content_html: editing.content,       // keep in sync
        category:     editing.category || null,
        emoji:        editing.emoji || '📣',
        status:       editing.status,
        author_name:  editing.author_name?.trim() || 'Brandfletch Team',
        cover_image:  editing.cover_image?.trim() || null,
        updated_date: now,
        published_at:
          editing.status === 'published' && !editing.published_at ? now : editing.published_at || null,
      };

      if (editing.id) {
        const { error: err } = await supabase.from('BlogPost').update(payload).eq('id', editing.id);
        if (err) throw err;
        toast.success('Post updated ✓');
      } else {
        const { error: err } = await supabase.from('BlogPost').insert({ ...payload, created_date: now });
        if (err) throw err;
        toast.success('Post created ✓');
      }

      setEditing(null);
      fetchPosts();
    } catch (err) {
      console.error('AdminBlog handleSave:', err);
      if (err.code === '23505') {
        toast.error('Slug already exists — use a different slug');
      } else if (err.code === '42501' || err.message?.includes('row-level security')) {
        toast.error('Permission denied — you must be logged in as an admin to create posts');
      } else {
        toast.error(err.message || 'Save failed — check console for details');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const { error: err } = await supabase.from('BlogPost').delete().eq('id', deleteConfirm.id);
      if (err) throw err;
      toast.success('Post deleted');
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const { error: err } = await supabase.from('BlogPost').update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : post.published_at,
        updated_date: new Date().toISOString(),
      }).eq('id', post.id);
      if (err) throw err;
      toast.success(newStatus === 'published' ? 'Published ✓' : 'Moved to drafts');
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (s) => {
    if (s === 'published') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Published</Badge>;
    if (s === 'draft')     return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground text-sm">Create, manage, and analyse your public blog posts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/blog" target="_blank" rel="noopener" className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> View blog
            </a>
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={fetchPosts} className="ml-auto">Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="mb-4">
          <TabsTrigger value="posts" className="gap-2"><FileText className="w-4 h-4" /> Posts</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
        </TabsList>

        {/* ── Posts tab ── */}
        <TabsContent value="posts" className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { label: 'Total',     val: posts.length,                                  icon: FileText,  color: 'bg-primary/10 text-primary'      },
              { label: 'Published', val: posts.filter(p=>p.status==='published').length, icon: Globe,     color: 'bg-emerald-500/10 text-emerald-500' },
              { label: 'Drafts',    val: posts.filter(p=>p.status==='draft').length,     icon: Edit2,     color: 'bg-amber-500/10 text-amber-500'   },
              { label: 'Views',     val: posts.reduce((s,p)=>s+(p.view_count||0),0).toLocaleString(), icon: Eye, color: 'bg-violet-500/10 text-violet-500' },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.val}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1">
              {['all','published','draft','archived'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter===s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Post Cards Grid */}
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading posts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-xl">
              <p className="text-4xl mb-3">✍️</p>
              <p className="text-muted-foreground">{search ? 'No posts match your search.' : 'No posts yet — create your first one!'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-md transition-all group">
                  {/* Card top — emoji / cover */}
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative shrink-0">
                    {p.cover_image
                      ? <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                      : <span className="text-5xl select-none">{p.emoji || '📝'}</span>
                    }
                    {/* Status pill */}
                    <div className="absolute top-2 left-2">
                      {statusBadge(p.status)}
                    </div>
                    {/* Quick actions — appear on hover */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.status === 'published' && (
                        <Button size="icon" variant="secondary" className="w-7 h-7" title="View live" asChild>
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button size="icon" variant="secondary" className="w-7 h-7" title={p.status==='published'?'Unpublish':'Publish'} onClick={() => toggleStatus(p)}>
                        {p.status==='published'
                          ? <EyeOff className="w-3.5 h-3.5" />
                          : <Eye    className="w-3.5 h-3.5 text-primary" />
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {p.category && (
                      <Badge variant="outline" className="self-start text-[10px] uppercase tracking-wide">{p.category}</Badge>
                    )}
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">{p.title}</h3>
                    {p.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.excerpt}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-auto pt-1">/blog/{p.slug}</p>
                  </div>

                  {/* Card footer */}
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {(p.view_count||0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {(p.read_count||0).toLocaleString()}
                      </span>
                      {p.published_at && (
                        <span className="hidden sm:inline">{new Date(p.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(p)}>
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setDeleteConfirm(p)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Analytics tab ── */}
        <TabsContent value="analytics">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics…
            </div>
          ) : (
            <AnalyticsTab posts={posts} />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit dialog ── */}
      {editing !== null && (
        <Dialog open onOpenChange={() => !saving && setEditing(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing.id ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input
                    value={editing.title}
                    onChange={e => setEditing(p => ({
                      ...p,
                      title: e.target.value,
                      slug: p.id ? p.slug : slugify(e.target.value),
                    }))}
                    placeholder="Post title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input value={editing.emoji} onChange={e => setEditing(p => ({...p, emoji: e.target.value}))} className="mt-1 text-center text-xl" maxLength={4} />
                </div>
              </div>

              <div>
                <Label>Slug <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">— URL: /blog/<strong>{editing.slug || 'your-slug'}</strong></span></Label>
                <Input value={editing.slug} onChange={e => setEditing(p => ({...p, slug: slugify(e.target.value)}))} placeholder="url-friendly-slug" className="mt-1 font-mono text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category || ''} onValueChange={v => setEditing(p => ({...p, category: v}))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={v => setEditing(p => ({...p, status: v}))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Excerpt <span className="text-xs text-muted-foreground font-normal">(shown in post cards)</span></Label>
                <Textarea value={editing.excerpt || ''} onChange={e => setEditing(p => ({...p, excerpt: e.target.value}))} placeholder="Brief description…" rows={2} className="mt-1" />
              </div>

              <div>
                <Label>Cover Image URL <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={editing.cover_image || ''} onChange={e => setEditing(p => ({...p, cover_image: e.target.value}))} placeholder="https://..." className="mt-1" />
                {editing.cover_image && (
                  <img src={editing.cover_image} alt="Cover preview" className="mt-2 rounded-lg h-28 object-cover w-full" />
                )}
              </div>

              <div>
                <Label>Author</Label>
                <Input value={editing.author_name || ''} onChange={e => setEditing(p => ({...p, author_name: e.target.value}))} className="mt-1" />
              </div>

              <div>
                <Label>Content <span className="text-destructive">*</span></Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={editing.content || ''}
                    onChange={v => setEditing(p => ({...p, content: v, content_html: v}))}
                    placeholder="Write your blog post here…"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</>
                  : editing.id ? 'Save Changes' : 'Create Post'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => !deleting && setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete post?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              "<strong>{deleteConfirm.title}</strong>" will be permanently deleted.
            </p>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

