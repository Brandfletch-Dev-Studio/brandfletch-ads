import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Upload, Hash, X as XIcon,
  Search as SearchIcon, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase, base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { isStaffRole, ROLE_LABELS } from '@/lib/permissions';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['Strategy','Tips','Case Study','News','Product Update','Guide'];
const EMPTY_POST = {
  title: '', slug: '', excerpt: '', content: '', content_html: '',
  category: '', emoji: '📣', status: 'draft',
  author_id: '', author_name: '', cover_image: '',
  meta_title: '', meta_description: '', tags: [],
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').trim();

export default function AdminBlogEditor() {
  const { id } = useParams(); // undefined → new post
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState({ ...EMPTY_POST });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);

  // Load existing post if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase.from('BlogPost').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (error || !data) { toast.error('Post not found'); navigate('/admin/blog'); return; }
          setPost(data);
        })
        .finally(() => setLoading(false));
    } else {
      // New post — pre-fill author from current user
      setPost(p => ({
        ...p,
        author_id: user?.id || '',
        author_name: user?.full_name || user?.email || 'Brandfletch Team',
      }));
    }
    // Load staff for author picker
    base44.functions.getAllUsers({})
      .then(r => setStaffUsers((r?.users || []).filter(u => isStaffRole(u.role))))
      .catch(() => {});
  }, [id]);

  const update = (field, value) => setPost(p => ({ ...p, [field]: value }));

  const uploadCoverImage = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: err } = await supabase.storage.from('designs').upload(path, file, { upsert: true });
      if (err) throw err;
      const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(path);
      update('cover_image', publicUrl);
      toast.success('Thumbnail uploaded ✓');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9\- ]/g, '');
    if (!t) return;
    setPost(p => ({ ...p, tags: [...new Set([...(p.tags || []), t])] }));
    setTagInput('');
  };
  const removeTag = t => setPost(p => ({ ...p, tags: (p.tags || []).filter(x => x !== t) }));

  const handleSave = async (andPublish = false) => {
    if (!post.title?.trim()) { toast.error('Title is required'); return; }
    if (!post.slug?.trim())  { toast.error('Slug is required'); return; }
    if (!stripHtml(post.content || '')) { toast.error('Content cannot be empty'); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const finalStatus = andPublish ? 'published' : post.status;
      const payload = {
        title:            post.title.trim(),
        slug:             post.slug.trim(),
        excerpt:          post.excerpt?.trim() || '',
        content:          post.content,
        content_html:     post.content,
        category:         post.category || null,
        emoji:            post.emoji || '📣',
        status:           finalStatus,
        author_id:        post.author_id || null,
        author_name:      post.author_name?.trim() || 'Brandfletch Team',
        cover_image:      post.cover_image?.trim() || null,
        meta_title:       post.meta_title?.trim() || null,
        meta_description: post.meta_description?.trim() || null,
        tags:             post.tags?.length ? post.tags : [],
        updated_date:     now,
        published_at:
          finalStatus === 'published' && !post.published_at ? now : post.published_at || null,
      };

      if (post.id) {
        const { error: err } = await supabase.from('BlogPost').update(payload).eq('id', post.id);
        if (err) throw err;
        toast.success('Post updated ✓');
      } else {
        const { error: err } = await supabase.from('BlogPost').insert({ ...payload, created_date: now });
        if (err) throw err;
        toast.success(andPublish ? 'Published ✓' : 'Draft saved ✓');
      }
      navigate('/admin/blog');
    } catch (err) {
      if (err.code === '23505') toast.error('Slug already exists — use a different slug');
      else if (err.code === '42501' || err.message?.includes('row-level security'))
        toast.error('Permission denied — must be logged in as admin');
      else toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading post…
      </div>
    );
  }

  const isNew = !post.id;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/blog')}
          className="gap-1.5 text-muted-foreground shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate text-foreground">
            {isNew ? 'New Blog Post' : `Editing: ${post.title || 'Untitled'}`}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            {isNew ? 'Fill in the details below and save or publish' : `/blog/${post.slug || '—'}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Preview link for existing published posts */}
          {post.slug && post.status === 'published' && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 hidden sm:flex"
              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
            >
              <Eye className="w-4 h-4" /> Preview
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save draft</span>
            <span className="sm:hidden">Save</span>
          </Button>

          {post.status !== 'published' && (
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish
            </Button>
          )}

          {post.status === 'published' && (
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="gap-1.5 bg-[hsl(var(--primary))] text-primary-foreground"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update
            </Button>
          )}
        </div>
      </div>

      {/* ── Two-column layout (stacks on mobile) ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: main content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + emoji */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={post.title}
                onChange={e => setPost(p => ({
                  ...p,
                  title: e.target.value,
                  slug: p.id ? p.slug : slugify(e.target.value),
                }))}
                placeholder="Post title…"
                className="mt-1 text-base"
              />
            </div>
            <div className="w-20 shrink-0">
              <Label>Emoji</Label>
              <Input
                value={post.emoji}
                onChange={e => update('emoji', e.target.value)}
                className="mt-1 text-center text-xl"
                maxLength={4}
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <Label>
              Slug <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">
                — URL: /blog/<strong>{post.slug || 'your-slug'}</strong>
              </span>
            </Label>
            <Input
              value={post.slug}
              onChange={e => update('slug', slugify(e.target.value))}
              placeholder="url-friendly-slug"
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt <span className="text-xs text-muted-foreground font-normal">(shown in post cards)</span></Label>
            <Textarea
              value={post.excerpt || ''}
              onChange={e => update('excerpt', e.target.value)}
              placeholder="Brief description…"
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          {/* Rich text editor — full width, no height cap */}
          <div>
            <Label>Content <span className="text-destructive">*</span></Label>
            <div className="mt-1">
              <RichTextEditor
                value={post.content || ''}
                onChange={v => setPost(p => ({ ...p, content: v, content_html: v }))}
                placeholder="Write your blog post here…"
              />
            </div>
          </div>

          {/* SEO section */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">SEO & Social Preview</h4>
            </div>
            <p className="text-xs text-muted-foreground">Leave blank to auto-use the title and excerpt above.</p>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Meta Title</Label>
                <span className={`text-[10px] ${(post.meta_title || '').length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {(post.meta_title || '').length}/60
                </span>
              </div>
              <Input
                value={post.meta_title || ''}
                onChange={e => update('meta_title', e.target.value)}
                placeholder="Leave blank to use post title"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Meta Description</Label>
                <span className={`text-[10px] ${(post.meta_description || '').length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {(post.meta_description || '').length}/160
                </span>
              </div>
              <Textarea
                value={post.meta_description || ''}
                onChange={e => update('meta_description', e.target.value)}
                placeholder="Leave blank to use excerpt"
                rows={2}
                className="mt-1 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Right sidebar: metadata ── */}
        <div className="space-y-5">

          {/* Publish settings */}
          <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
            <h3 className="text-sm font-semibold">Publish Settings</h3>

            <div>
              <Label>Status</Label>
              <Select value={post.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={post.category || ''} onValueChange={v => update('category', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Author</Label>
              <Select
                value={post.author_id || 'custom'}
                onValueChange={v => {
                  if (v === 'custom') {
                    update('author_id', '');
                  } else {
                    const staff = staffUsers.find(u => u.id === v);
                    setPost(p => ({
                      ...p,
                      author_id: v,
                      author_name: staff?.full_name || staff?.email || 'Brandfletch Team',
                    }));
                  }
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staffUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Other (type manually)</SelectItem>
                </SelectContent>
              </Select>
              {!post.author_id && (
                <Input
                  value={post.author_name || ''}
                  onChange={e => update('author_name', e.target.value)}
                  placeholder="Author display name"
                  className="mt-2 text-sm"
                />
              )}
            </div>
          </div>

          {/* Cover image */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <h3 className="text-sm font-semibold">Cover / Thumbnail</h3>
            <p className="text-[11px] text-muted-foreground">Used on blog cards, post header, and social share previews. Recommended: 1200×630px.</p>

            {/* Preview */}
            <label className={`block w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/30 transition-colors ${uploadingCover ? 'opacity-60 pointer-events-none' : ''}`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadCoverImage(e.target.files[0])}
              />
              {uploadingCover ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : post.cover_image ? (
                <img src={post.cover_image} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Tap to upload</span>
                </div>
              )}
            </label>

            <Input
              value={post.cover_image || ''}
              onChange={e => update('cover_image', e.target.value)}
              placeholder="Or paste an image URL…"
              className="text-xs font-mono"
            />
          </div>

          {/* Tags */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <h3 className="text-sm font-semibold">Tags <span className="font-normal text-muted-foreground text-xs">(optional)</span></h3>
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="e.g. facebook-ads"
                className="text-sm"
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag} className="shrink-0">
                <Hash className="w-4 h-4" />
              </Button>
            </div>
            {(post.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(post.tags || []).map(t => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Bottom save on mobile */}
          <div className="lg:hidden flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save draft
            </Button>
            {post.status !== 'published' && (
              <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleSave(true)} disabled={saving}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
