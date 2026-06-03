import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, X, Check, Store, ShoppingCart, Image, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const CATEGORIES = ['page_setup', 'ads_management', 'content_creation', 'consulting', 'other'];
const CATEGORY_LABELS = {
  page_setup: 'Page Setup', ads_management: 'Ads Management',
  content_creation: 'Content Creation', consulting: 'Consulting', other: 'Other',
};
const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const EMPTY_SERVICE = { name: '', description: '', category: 'other', price_usd: 25, features: [], image_url: '', sort_order: 0 };

export default function AdminMarketplace() {
  useRoleGuard(['admin', 'campaign_manager']);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newService, setNewService] = useState({ ...EMPTY_SERVICE });
  const [newFeature, setNewFeature] = useState('');
  const [newEditFeature, setNewEditFeature] = useState('');
  const [tab, setTab] = useState('services'); // 'services' | 'orders'
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => base44.entities.Service.list('sort_order'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-service-orders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date'),
    enabled: tab === 'orders',
  });

  async function uploadImage(file, isEdit = false) {
    if (isEdit) setEditUploading(true); else setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isEdit) { setEditData(d => ({ ...d, image_url: file_url })); setEditUploading(false); }
    else { setNewService(s => ({ ...s, image_url: file_url })); setUploading(false); }
    toast.success('Image uploaded');
  }

  async function addService() {
    if (!newService.name || !newService.price_usd) { toast.error('Name and price required'); return; }
    await base44.entities.Service.create({ ...newService, is_active: true });
    toast.success('Service added');
    setNewService({ ...EMPTY_SERVICE });
    setNewFeature('');
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  }

  async function saveEdit() {
    await base44.entities.Service.update(editingId, editData);
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    setEditingId(null);
    toast.success('Saved!');
  }

  async function deleteService(id) {
    await base44.entities.Service.delete(id);
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    toast.success('Deleted');
  }

  async function toggleService(id, is_active) {
    await base44.entities.Service.update(id, { is_active });
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  }

  async function updateOrderStatus(orderId, status) {
    await base44.entities.ServiceOrder.update(orderId, { status });
    queryClient.invalidateQueries({ queryKey: ['admin-service-orders'] });
    toast.success('Order updated');
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage services and client orders</p>
        </div>
        <div className="flex gap-2">
          {[{ id: 'services', label: 'Services', icon: Store }, { id: 'orders', label: 'Orders', icon: ShoppingCart }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                tab === t.id ? 'bg-[hsl(var(--primary))] text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'services' ? (
        <>
          {/* Existing services */}
          <div className="space-y-3">
            {services.map(s => (
              <Card key={s.id} className="shadow-sm">
                <CardContent className="p-4">
                  {editingId === s.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">Name</Label>
                          <Input value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Price (USD)</Label>
                          <Input type="number" value={editData.price_usd || ''} onChange={e => setEditData(d => ({ ...d, price_usd: parseFloat(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Category</Label>
                          <Select value={editData.category} onValueChange={v => setEditData(d => ({ ...d, category: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Sort Order</Label>
                          <Input type="number" value={editData.sort_order || 0} onChange={e => setEditData(d => ({ ...d, sort_order: parseInt(e.target.value) }))} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Description</Label>
                        <Textarea value={editData.description || ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} rows={2} />
                      </div>
                      {/* Features */}
                      <div>
                        <Label className="text-xs mb-1 block">Features / Bullet Points</Label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(editData.features || []).map((f, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 pr-1">
                              {f}
                              <button onClick={() => setEditData(d => ({ ...d, features: d.features.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newEditFeature} onChange={e => setNewEditFeature(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && newEditFeature.trim()) { setEditData(d => ({ ...d, features: [...(d.features || []), newEditFeature.trim()] })); setNewEditFeature(''); }}}
                            placeholder="Add feature, press Enter" className="h-8 text-sm" />
                        </div>
                      </div>
                      {/* Image */}
                      <div>
                        <Label className="text-xs mb-1 block">Product Image</Label>
                        {editData.image_url && <img src={editData.image_url} alt="" className="w-full max-h-32 object-cover rounded-lg mb-2" />}
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                          <Image className="w-4 h-4" />
                          <span>{editUploading ? 'Uploading...' : 'Upload image'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], true)} disabled={editUploading} />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="gap-1"><Check className="w-3 h-3" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-3 h-3" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {s.image_url && <img src={s.image_url} alt={s.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{s.name}</p>
                          <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[s.category]}</Badge>
                          <span className="font-bold text-sm text-[hsl(var(--primary))]">${s.price_usd} USD</span>
                        </div>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>}
                        {s.features?.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">{s.features.length} features listed</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={s.is_active} onCheckedChange={v => toggleService(s.id, v)} />
                        <Button variant="ghost" size="icon" onClick={() => { setEditingId(s.id); setEditData({ ...s }); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteService(s.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add new service */}
          <Card className="shadow-sm border-2 border-dashed">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Add New Service / Product</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Name *</Label>
                  <Input value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Facebook Page Setup" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Price (USD) *</Label>
                  <Input type="number" value={newService.price_usd} onChange={e => setNewService(s => ({ ...s, price_usd: parseFloat(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Category</Label>
                  <Select value={newService.category} onValueChange={v => setNewService(s => ({ ...s, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Sort Order</Label>
                  <Input type="number" value={newService.sort_order} onChange={e => setNewService(s => ({ ...s, sort_order: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Description</Label>
                <Textarea value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} placeholder="Brief description..." rows={2} />
              </div>
              {/* Features */}
              <div>
                <Label className="text-xs mb-1 block">Features / Bullet Points</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {newService.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {f}
                      <button onClick={() => setNewService(s => ({ ...s, features: s.features.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setNewService(s => ({ ...s, features: [...s.features, newFeature.trim()] })); setNewFeature(''); }}}
                    placeholder="Type a feature and press Enter" className="h-9" />
                </div>
              </div>
              {/* Image upload */}
              <div>
                <Label className="text-xs mb-1 block">Product Image (optional)</Label>
                {newService.image_url && <img src={newService.image_url} alt="" className="w-full max-h-32 object-cover rounded-lg mb-2" />}
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground border border-dashed border-border rounded-lg px-3 py-2 w-fit">
                  <Image className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} disabled={uploading} />
                </label>
              </div>
              <Button onClick={addService} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
                <Plus className="w-4 h-4" /> Add Service
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Orders tab */
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders yet</p>
            </div>
          )}
          {orders.map(order => (
            <Card key={order.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{order.service_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">User ID: {order.user_id}</p>
                    {order.notes && <p className="text-sm text-foreground bg-secondary/40 rounded-lg p-2 mt-1">{order.notes}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="font-bold text-sm">${order.price_usd} USD</p>
                    {order.payment_proof_url && (
                      <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[hsl(var(--accent))] hover:underline">View Payment Proof</a>
                    )}
                    <Select value={order.status} onValueChange={v => updateOrderStatus(order.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['pending','confirmed','in_progress','completed','cancelled'].map(s => (
                          <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}