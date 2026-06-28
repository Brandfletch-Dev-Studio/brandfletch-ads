// v2
import { useState } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, Star,
  StarOff, Upload, X, Loader2, LayoutGrid, Image, Video, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/lib/AuthContext';

const CATEGORIES = [
  { value: 'graphic_design', label: 'Graphic Design' },
  { value: 'web_design',     label: 'Web Design' },
  { value: 'ugc_ads',        label: 'UGC Ads' },
  { value: 'meta_ads',       label: 'Meta Ads' },
  { value: 'social_media',   label: 'Social Media' },
  { value: 'branding',       label: 'Branding' },
  { value: 'other',          label: 'Other' },
];

const CAT_COLORS = {
  graphic_design: 'bg-pink-100 text-pink-700',
  meta_ads:       'bg-blue-100 text-blue-700',
  ugc_ads:        'bg-purple-100 text-purple-700',
  social_media:   'bg-green-100 text-green-700',
  web_design:     'bg-orange-100 text-orange-700',
  branding:       'bg-amber-100 text-amber-700',
  other:          'bg-gray-100 text-gray-500',
};

const BLANK = {
  title: '', description: '', category: 'graphic_design',
  tags: [], cover_image: '', images: [],
  video_url: '', video_urls: [],
  client_name: '', client_industry: '', results: '',
  featured: false, status: 'draft', display_order: 0,
  designer_name: '',
};

// Strip undefined/null id so Supabase uses its gen_random_uuid() default
function cleanPayload(data) {
  const p = { ...data };
  if (!p.id) delete p.id;
  // coerce arrays — Supabase needs real arrays, not undefined
  p.tags       = Array.isArray(p.tags)       ? p.tags       : [];
  p.images     = Array.isArray(p.images)     ? p.images     : [];
  p.video_urls = Array.isArray(p.video_urls) ? p.video_urls : [];
  return p;
}

export default function AdminPortfolio() {
  useRoleGuard(['admin', 'super_admin']);
  const { user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [editing, setEditing]             = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [tagInput, setTagInput]           = useState('');
  const [videoInput, setVideoInput]       = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminPortfolio'],
    queryFn: () => base44.entities.PortfolioItem.list({ sort: 'display_order' }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = cleanPayload(data);
      if (payload.id) {
        return base44.entities.PortfolioItem.update(payload.id, payload);
      }
      return base44.entities.PortfolioItem.create({ ...payload, created_by: user?.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPortfolio'] });
      toast.success(editing?.id ? 'Portfolio item updated' : 'Portfolio item created');
      setEditing(null);
      setTagInput('');
      setVideoInput('');
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || 'Unknown error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PortfolioItem.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPortfolio'] });
      toast.success('Item deleted');
      setConfirmDelete(null);
    },
    onError: (e) => toast.error('Delete failed: ' + e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PortfolioItem.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminPortfolio'] }),
    onError: (e) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }) => base44.entities.PortfolioItem.update(id, { featured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminPortfolio'] }),
    onError: (e) => toast.error(e.message),
  });

  async function uploadImage(file, field) {
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('designs').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(path);
      if (field === 'cover_image') {
        setEditing(prev => ({ ...prev, cover_image: publicUrl }));
      } else {
        setEditing(prev => ({ ...prev, images: [...(prev.images || []), publicUrl] }));
      }
      toast.success('Image uploaded');
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  const filtered = items.filter(i => {
    const q          = search.toLowerCase();
    const matchSearch = !q || i.title?.toLowerCase().includes(q) || i.client_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     items.length,
    published: items.filter(i => i.status === 'published').length,
    featured:  items.filter(i => i.featured).length,
    draft:     items.filter(i => i.status === 'draft').length,
  };

  function openEdit(item) {
    setTagInput('');
    setVideoInput('');
    setEditing({
      ...item,
      tags:       Array.isArray(item.tags)       ? item.tags       : [],
      images:     Array.isArray(item.images)     ? item.images     : [],
      video_urls: Array.isArray(item.video_urls) ? item.video_urls : [],
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" /> Portfolio
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage work showcased on the public portfolio page.</p>
        </div>
        <Button onClick={() => { setTagInput(''); setVideoInput(''); setEditing({ ...BLANK }); }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-foreground' },
          { label: 'Published', value: stats.published, color: 'text-emerald-600' },
          { label: 'Featured',  value: stats.featured,  color: 'text-amber-500' },
          { label: 'Draft',     value: stats.draft,     color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No portfolio items yet.</p>
          <p className="text-sm mt-1">Add your first piece of work to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="rounded-xl border border-border/60 bg-card overflow-hidden group">
              <div className="relative h-44 bg-muted">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                ) : item.video_url ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                    <Video className="w-8 h-8 opacity-40" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8 opacity-30" />
                  </div>
                )}
                {/* video badge */}
                {(item.video_url || item.video_urls?.length > 0) && (
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/60 text-white text-[10px] border-0 gap-1">
                      <Video className="w-2.5 h-2.5" /> Video
                    </Badge>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className={cn('text-[10px] border-0', CAT_COLORS[item.category])}>
                    {CATEGORIES.find(c => c.value === item.category)?.label}
                  </Badge>
                  {item.featured && <Badge className="bg-amber-400 text-white text-[10px] border-0">★ Featured</Badge>}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={cn('text-[10px] border-0', item.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                    {item.status}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                {item.client_name && <p className="text-xs text-muted-foreground">{item.client_name}</p>}
                {item.results && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{item.results}</p>}
                <div className="flex items-center gap-1 mt-3">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStatus.mutate({ id: item.id, status: item.status === 'published' ? 'draft' : 'published' })}>
                    {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleFeatured.mutate({ id: item.id, featured: !item.featured })}>
                    {item.featured ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <StarOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-destructive hover:text-destructive" onClick={() => setConfirmDelete(item)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={o => { if (!o) { setEditing(null); setTagInput(''); setVideoInput(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit portfolio item' : 'New portfolio item'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <PortfolioForm
              data={editing}
              onChange={setEditing}
              uploading={uploading}
              onUpload={uploadImage}
              tagInput={tagInput}
              setTagInput={setTagInput}
              videoInput={videoInput}
              setVideoInput={setVideoInput}
            />
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => { setEditing(null); setTagInput(''); setVideoInput(''); }}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !editing?.title?.trim()}
            >
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      {confirmDelete && (
        <Dialog open onOpenChange={() => !deleteMutation.isPending && setConfirmDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete portfolio item?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">"{confirmDelete?.title}" will be permanently removed.</p>
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Shared portfolio form ─────────────────────────────────────────────────────
function PortfolioForm({ data, onChange, uploading, onUpload, tagInput, setTagInput, videoInput, setVideoInput }) {
  const set = (field, value) => onChange(prev => ({ ...prev, [field]: value }));

  function addTag(e) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!(data.tags || []).includes(tag)) set('tags', [...(data.tags || []), tag]);
      setTagInput('');
    }
  }

  function addVideoUrl(e) {
    if (e.key === 'Enter' && videoInput.trim()) {
      e.preventDefault();
      const url = videoInput.trim();
      const existing = data.video_urls || [];
      if (!existing.includes(url)) set('video_urls', [...existing, url]);
      setVideoInput('');
    }
  }

  function removeImage(idx) {
    const imgs = [...(data.images || [])];
    imgs.splice(idx, 1);
    set('images', imgs);
  }

  function removeVideoUrl(idx) {
    const vids = [...(data.video_urls || [])];
    vids.splice(idx, 1);
    set('video_urls', vids);
  }

  return (
    <div className="space-y-5 py-2">

      {/* ── Basic info ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Title *</Label>
          <Input
            value={data.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Jollof Kitchen Brand Identity"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Category *</Label>
          <Select value={data.category} onValueChange={v => set('category', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={data.status} onValueChange={v => set('status', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={data.description || ''}
            onChange={e => set('description', e.target.value)}
            placeholder="What was the brief? What did you create?"
            className="mt-1 h-24 resize-none"
          />
        </div>
      </div>

      {/* ── Client & results ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Client name</Label>
          <Input value={data.client_name || ''} onChange={e => set('client_name', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Industry</Label>
          <Input value={data.client_industry || ''} onChange={e => set('client_industry', e.target.value)} placeholder="e.g. Food & Beverage" className="mt-1" />
        </div>
        <div>
          <Label>Results</Label>
          <Input value={data.results || ''} onChange={e => set('results', e.target.value)} placeholder="e.g. 3x ROAS" className="mt-1" />
        </div>
      </div>

      {/* ── Designer + order + featured ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <Label>Designer name</Label>
          <Input value={data.designer_name || ''} onChange={e => set('designer_name', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Display order</Label>
          <Input type="number" value={data.display_order ?? 0} onChange={e => set('display_order', parseInt(e.target.value) || 0)} className="mt-1" />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Switch id="feat" checked={!!data.featured} onCheckedChange={v => set('featured', v)} />
          <Label htmlFor="feat" className="cursor-pointer">Featured</Label>
        </div>
      </div>

      {/* ── Cover image ──────────────────────────────────────────────────── */}
      <div>
        <Label>Cover image</Label>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {data.cover_image && (
            <div className="relative w-20 h-16 rounded overflow-hidden border border-border shrink-0">
              <img src={data.cover_image} alt="cover" className="w-full h-full object-cover" />
              <button onClick={() => set('cover_image', '')} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="cursor-pointer shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload cover'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0], 'cover_image')} />
          </label>
          <Input
            value={data.cover_image || ''}
            onChange={e => set('cover_image', e.target.value)}
            placeholder="Or paste image URL"
            className="text-xs flex-1 min-w-0"
          />
        </div>
      </div>

      {/* ── Additional images ────────────────────────────────────────────── */}
      <div>
        <Label>Additional images</Label>
        <div className="mt-1 flex flex-wrap gap-2 items-center">
          {(data.images || []).map((img, i) => (
            <div key={i} className="relative w-16 h-14 rounded overflow-hidden border border-border">
              <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="cursor-pointer">
            <div className="w-16 h-14 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0], 'images')} />
          </label>
        </div>
      </div>

      {/* ── Primary video URL ─────────────────────────────────────────────── */}
      <div>
        <Label className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Primary video URL
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
          Paste a YouTube, Vimeo, TikTok, or direct mp4 link. For UGC / ad creatives.
        </p>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={data.video_url || ''}
            onChange={e => set('video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://..."
            className="text-xs"
          />
          {data.video_url && (
            <button onClick={() => set('video_url', '')} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Extra video URLs ──────────────────────────────────────────────── */}
      <div>
        <Label className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Additional video URLs
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            value={videoInput}
            onChange={e => setVideoInput(e.target.value)}
            onKeyDown={addVideoUrl}
            placeholder="Paste a video URL and press Enter"
            className="text-xs flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              if (videoInput.trim()) {
                const url = videoInput.trim();
                const existing = data.video_urls || [];
                if (!existing.includes(url)) set('video_urls', [...existing, url]);
                setVideoInput('');
              }
            }}
          >
            Add
          </Button>
        </div>
        {(data.video_urls || []).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {(data.video_urls || []).map((url, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded">
                <Video className="w-3 h-3 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1 text-muted-foreground">{url}</span>
                <button onClick={() => removeVideoUrl(i)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tags ─────────────────────────────────────────────────────────── */}
      <div>
        <Label>Tags</Label>
        <Input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter"
          className="mt-1"
        />
        {(data.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(data.tags || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                {t}
                <button onClick={() => set('tags', data.tags.filter(x => x !== t))} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
