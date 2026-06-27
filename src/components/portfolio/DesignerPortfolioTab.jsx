/**
 * DesignerPortfolioTab — rendered inside DesignerPortal as the "Portfolio" tab.
 * Designers can create/edit/publish their own portfolio items.
 * COD & admins can see and manage items from all designers.
 */
import { useState } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff,
  Upload, X, Loader2, Image, ExternalLink, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'graphic_design', label: 'Graphic Design' },
  { value: 'meta_ads',       label: 'Meta Ads' },
  { value: 'ugc_ads',        label: 'UGC Ads' },
  { value: 'social_media',   label: 'Social Media' },
  { value: 'web_design',     label: 'Web Design' },
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
  client_name: '', client_industry: '', results: '',
  featured: false, status: 'draft', display_order: 0,
};

export default function DesignerPortfolioTab({ user }) {
  const qc = useQueryClient();
  const isDesigner = user?.role === 'designer';
  const isAdmin    = ['admin', 'super_admin', 'creative_ops_director'].includes(user?.role);

  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['designerPortfolioItems', user?.id, isDesigner],
    queryFn: () => isDesigner
      ? base44.entities.PortfolioItem.filter({ designer_id: user?.id }, { sort: 'display_order' })
      : base44.entities.PortfolioItem.list({ sort: 'display_order' }),
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (!payload.id) {
        payload.designer_id   = user?.id;
        payload.designer_name = user?.full_name || user?.email?.split('@')[0] || '';
        payload.created_by    = user?.id;
      }
      return payload.id
        ? base44.entities.PortfolioItem.update(payload.id, payload)
        : base44.entities.PortfolioItem.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designerPortfolioItems'] });
      toast.success(editing?.id ? 'Item updated' : 'Item created');
      setEditing(null);
    },
    onError: (e) => toast.error('Save failed: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PortfolioItem.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designerPortfolioItems'] });
      toast.success('Item deleted');
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = (item) => {
    const next = item.status === 'published' ? 'draft' : 'published';
    base44.entities.PortfolioItem.update(item.id, { status: next })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['designerPortfolioItems'] });
        toast.success(next === 'published' ? 'Item published' : 'Moved to draft');
      })
      .catch(e => toast.error(e.message));
  };

  async function uploadImage(file, field) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
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

  const set = (field, value) => setEditing(prev => ({ ...prev, [field]: value }));

  function addTag(e) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!editing.tags.includes(tag)) set('tags', [...editing.tags, tag]);
      setTagInput('');
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">My Portfolio</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? 'All portfolio items' : 'Items you add here will appear on the public portfolio page once published.'}
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...BLANK })}>
          <Plus className="w-4 h-4 mr-1" /> Add item
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
          <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No portfolio items yet.</p>
          <p className="text-xs mt-1">Add your first piece of work to showcase it publicly.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing({ ...BLANK })}>
            <Plus className="w-4 h-4 mr-1" /> Add first item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="relative h-40 bg-muted">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 opacity-20 text-muted-foreground" />
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
                {item.results && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{item.results}</p>}
                <div className="flex items-center gap-1 mt-2.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing({ ...item, tags: item.tags || [], images: item.images || [] })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStatus(item)}>
                    {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
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

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit portfolio item' : 'New portfolio item'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title} onChange={e => set('title', e.target.value)} placeholder="Project title" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ''} onChange={e => set('description', e.target.value)} className="mt-1 h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Client</Label>
                  <Input value={editing.client_name || ''} onChange={e => set('client_name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Results</Label>
                  <Input value={editing.results || ''} onChange={e => set('results', e.target.value)} className="mt-1" placeholder="e.g. 3x ROAS" />
                </div>
              </div>
              {/* Cover image */}
              <div>
                <Label>Cover image</Label>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {editing.cover_image && (
                    <div className="relative w-16 h-14 rounded overflow-hidden border border-border">
                      <img src={editing.cover_image} alt="cover" className="w-full h-full object-cover" />
                      <button onClick={() => set('cover_image', '')} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded px-2.5 py-2 hover:bg-muted/50">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading ? 'Uploading…' : 'Upload'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover_image')} />
                  </label>
                  <Input value={editing.cover_image || ''} onChange={e => set('cover_image', e.target.value)} placeholder="Or paste URL" className="text-xs flex-1 min-w-0" />
                </div>
              </div>
              {/* Additional images */}
              <div>
                <Label>Additional images</Label>
                <div className="mt-1 flex flex-wrap gap-2 items-center">
                  {(editing.images || []).map((img, i) => (
                    <div key={i} className="relative w-14 h-12 rounded overflow-hidden border border-border">
                      <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                      <button onClick={() => { const imgs = [...editing.images]; imgs.splice(i,1); set('images', imgs); }} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer">
                    <div className="w-14 h-12 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50">
                      <Plus className="w-4 h-4" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'images')} />
                  </label>
                </div>
              </div>
              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag + Enter" className="mt-1" />
                {editing.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editing.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                        {t}
                        <button onClick={() => set('tags', editing.tags.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Featured */}
              <div className="flex items-center gap-2">
                <Switch id="dfeat" checked={!!editing.featured} onCheckedChange={v => set('featured', v)} />
                <Label htmlFor="dfeat" className="cursor-pointer text-sm">Mark as featured</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending || !editing?.title?.trim()}>
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete portfolio item"
        description={`"${confirmDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
