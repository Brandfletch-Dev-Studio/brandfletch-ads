import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
const EMPTY_POST = { title:'', slug:'', excerpt:'', content:'', category:'', emoji:'📣', status:'draft', author_name:'Brandfletch Team', cover_image:'' };

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);  // null = closed, {} = new, post = edit
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from('BlogPost').select('*').order('created_date', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const openNew = () => setEditing({ ...EMPTY_POST });
  const openEdit = (p) => setEditing({ ...p });

  const handleSave = async () => {
    if (!editing.title || !editing.slug) { toast.error('Title and slug are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        updated_date: new Date().toISOString(),
        published_at: editing.status === 'published' && !editing.published_at ? new Date().toISOString() : editing.published_at,
      };
      if (editing.id) {
        const { error } = await supabase.from('BlogPost').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Post updated');
      } else {
        delete payload.id;
        const { error } = await supabase.from('BlogPost').insert(payload);
        if (error) throw error;
        toast.success('Post created');
      }
      setEditing(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('BlogPost').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Post deleted');
    setDeleting(null);
    fetchPosts();
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('BlogPost').update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : post.published_at,
    }).eq('id', post.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'}`);
    fetchPosts();
  };

  const filtered = posts.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s) => {
    if (s === 'published') return <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>;
    if (s === 'draft')     return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Blog Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage posts for the public blog.</p>
        </div>
        <Button onClick={openNew} className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total posts',    val: posts.length, icon: FileText },
          { label:'Published',      val: posts.filter(p=>p.status==='published').length, icon: Globe },
          { label:'Drafts',         val: posts.filter(p=>p.status==='draft').length,     icon: Edit2 },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-[hsl(var(--accent))]/10 rounded-lg flex items-center justify-center">
              <s.icon className="w-4 h-4 text-[hsl(var(--accent))]" />
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
        <Input placeholder="Search posts…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-muted-foreground">No posts yet. Create your first one!</p>
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
                      <Button size="icon" variant="ghost" title={p.status==='published'?'Unpublish':'Publish'} onClick={()=>toggleStatus(p)}>
                        {p.status==='published' ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-[hsl(var(--accent))]" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={()=>openEdit(p)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={()=>setDeleting(p.id)}>
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
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing.id ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Label>Title *</Label>
                  <Input
                    value={editing.title}
                    onChange={e => setEditing(p => ({ ...p, title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))}
                    placeholder="Post title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input value={editing.emoji} onChange={e=>setEditing(p=>({...p,emoji:e.target.value}))} className="mt-1 text-center text-xl" />
                </div>
              </div>
              <div>
                <Label>Slug * <span className="text-xs text-muted-foreground">(URL: /blog/your-slug)</span></Label>
                <Input value={editing.slug} onChange={e=>setEditing(p=>({...p,slug:slugify(e.target.value)}))} placeholder="my-post-slug" className="mt-1 font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category} onValueChange={v=>setEditing(p=>({...p,category:v}))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={v=>setEditing(p=>({...p,status:v}))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Excerpt <span className="text-xs text-muted-foreground">(shown on blog index)</span></Label>
                <Textarea value={editing.excerpt} onChange={e=>setEditing(p=>({...p,excerpt:e.target.value}))} rows={2} className="mt-1 resize-none" placeholder="Short description…" />
              </div>
              <div>
                <Label>Cover Image URL</Label>
                <Input value={editing.cover_image} onChange={e=>setEditing(p=>({...p,cover_image:e.target.value}))} placeholder="https://…" className="mt-1" />
              </div>
              <div>
                <Label>Content <span className="text-xs text-muted-foreground">(Markdown supported)</span></Label>
                <Textarea value={editing.content} onChange={e=>setEditing(p=>({...p,content:e.target.value}))} rows={14} className="mt-1 font-mono text-sm resize-none" placeholder="Write your post in Markdown…" />
              </div>
              <div>
                <Label>Author Name</Label>
                <Input value={editing.author_name} onChange={e=>setEditing(p=>({...p,author_name:e.target.value}))} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
                {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm delete */}
      {deleting && (
        <Dialog open onOpenChange={()=>setDeleting(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete post?</DialogTitle></DialogHeader>
            <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={()=>handleDelete(deleting)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
