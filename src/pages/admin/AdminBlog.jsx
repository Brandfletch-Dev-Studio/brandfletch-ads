import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Globe, FileText, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['Strategy','Tips','Case Study','News','Product Update','Guide'];
const EMPTY_POST = {
  title: '', slug: '', excerpt: '', content: '', content_html: '',
  category: '', emoji: '📣', status: 'draft',
  author_name: 'Brandfletch Team', cover_image: '',
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
      toast.error('Failed to load posts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => setEditing({ ...EMPTY_POST });
  const openEdit = (p) => setEditing({ ...p });

  const handleSave = async () => {
    if (!editing.title?.trim()) { toast.error('Title is required'); return; }
    if (!editing.slug?.trim())  { toast.error('Slug is required'); return; }
    if (!editing.content?.trim()) { toast.error('Content cannot be empty'); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        title:        editing.title.trim(),
        slug:         editing.slug.trim(),
        excerpt:      editing.excerpt?.trim() || '',
        content:      editing.content,         // Quill HTML
        content_html: editing.content,         // keep in sync — same value
        category:     editing.category || null,
        emoji:        editing.emoji || '📣',
        status:       editing.status,
        author_name:  editing.author_name || 'Brandfletch Team',
        cover_image:  editing.cover_image?.trim() || null,
        updated_date: now,
        published_at:
          editing.status === 'published' && !editing.published_at
            ? now
            : editing.published_at || null,
      };

      if (editing.id) {
        // UPDATE
        const { error: err } = await supabase
          .from('BlogPost')
          .update(payload)
          .eq('id', editing.id);
        if (err) throw err;
        toast.success('Post updated ✓');
      } else {
        // INSERT — no id in payload
        const { error: err } = await supabase
          .from('BlogPost')
          .insert({ ...payload, created_date: now });
        if (err) throw err;
        toast.success('Post created ✓');
      }

      setEditing(null);
      fetchPosts();
    } catch (err) {
      console.error('AdminBlog handleSave:', err);
      // Surface meaningful Supabase errors
      if (err.code === '23505') {
        toast.error('A post with this slug already exists — change the slug and try again.');
      } else if (err.code === '42501') {
        toast.error('Permission denied — make sure you are logged in as an admin.');
      } else {
        toast.error(err.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { error: err } = await supabase.from('BlogPost').delete().eq('id', id);
      if (err) throw err;
      toast.success('Post deleted');
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
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
      toast.success(newStatus === 'published' ? 'Post published ✓' : 'Post unpublished');
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const filtered = posts.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => {
    if (s === 'published') return <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>;
    if (s === 'draft')     return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage posts for the public blog.</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total posts', val: posts.length,                               icon: FileText },
          { label: 'Published',   val: posts.filter(p=>p.status==='published').length, icon: Globe   },
          { label: 'Drafts',      val: posts.filter(p=>p.status==='draft').length,    icon: Edit2   },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={fetchPosts} className="ml-auto">Retry</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading posts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-muted-foreground">{search ? 'No posts match your search.' : 'No posts yet — create your first one!'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Published</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="font-medium text-foreground line-clamp-1">{p.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8 line-clamp-1">/blog/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.category ? <Badge variant="outline" className="text-xs">{p.category}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {p.status === 'published' && (
                        <Button size="icon" variant="ghost" title="View live" asChild>
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title={p.status==='published'?'Unpublish':'Publish'} onClick={() => toggleStatus(p)}>
                        {p.status==='published'
                          ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                          : <Eye className="w-4 h-4 text-primary" />
                        }
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm(p)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create dialog */}
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
                      // Auto-slug only on new posts
                      slug: p.id ? p.slug : slugify(e.target.value),
                    }))}
                    placeholder="Post title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editing.emoji}
                    onChange={e => setEditing(p => ({ ...p, emoji: e.target.value }))}
                    className="mt-1 text-center text-xl"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <Label>Slug <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">— URL: /blog/<strong>{editing.slug || 'your-slug'}</strong></span></Label>
                <Input
                  value={editing.slug}
                  onChange={e => setEditing(p => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="url-friendly-slug"
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category} onValueChange={v => setEditing(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={v => setEditing(p => ({ ...p, status: v }))}>
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
                <Textarea
                  value={editing.excerpt}
                  onChange={e => setEditing(p => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Brief description of this post…"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Cover Image URL <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={editing.cover_image || ''}
                  onChange={e => setEditing(p => ({ ...p, cover_image: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1"
                />
                {editing.cover_image && (
                  <img src={editing.cover_image} alt="Cover preview" className="mt-2 rounded-lg h-28 object-cover w-full" />
                )}
              </div>

              <div>
                <Label>Author</Label>
                <Input
                  value={editing.author_name}
                  onChange={e => setEditing(p => ({ ...p, author_name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Content <span className="text-destructive">*</span></Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={editing.content}
                    onChange={v => setEditing(p => ({ ...p, content: v, content_html: v }))}
                    placeholder="Write your blog post here…"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : (editing.id ? 'Save Changes' : 'Create Post')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => !deleting && setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete post?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              "<strong>{deleteConfirm.title}</strong>" will be permanently deleted and removed from the public blog.
            </p>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={!!deleting}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={!!deleting}
              >
                {deleting === deleteConfirm.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
