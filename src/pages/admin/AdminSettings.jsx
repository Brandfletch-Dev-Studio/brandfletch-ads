import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, DollarSign, CreditCard, Pencil, X, Check, ShieldAlert, Mail, Loader2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { toast } from 'sonner';
import EmailTemplatesTab from '@/components/settings/EmailTemplatesTab';
import ConfirmDialog from '@/components/ConfirmDialog';

const DANGER_ENTITIES = [
  { key: 'Campaign', label: 'Campaigns', entity: 'Campaign' },
  { key: 'WalletTransaction', label: 'Wallet Transactions', entity: 'WalletTransaction' },
  { key: 'Notification', label: 'Notifications', entity: 'Notification' },
  { key: 'AuditLog', label: 'Audit Logs', entity: 'AuditLog' },
  { key: 'Message', label: 'Messages', entity: 'Message' },
  { key: 'FacebookPage', label: 'Facebook Pages', entity: 'FacebookPage' },
  { key: 'SavedAudience', label: 'Saved Audiences', entity: 'SavedAudience' },
];

export default function AdminSettings() {
  const [rates, setRates] = useState([]);
  const [methods, setMethods] = useState([]);
  const [designRates, setDesignRates] = useState([]);
  const [designRatesLoading, setDesignRatesLoading] = useState(true);
  const [newDesignRate, setNewDesignRate] = useState({ service_name: '', design_type: '', country: 'Malawi', currency: 'MWK', symbol: 'MK', price: '', max_revisions: 2 });
  const [editingRateId, setEditingRateId] = useState(null);
  const [editRateData, setEditRateData] = useState({});
  const [confirmDeleteRate, setConfirmDeleteRate] = useState(null);
  const [newRate, setNewRate] = useState({ currency_code: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: false });
  const [newMethod, setNewMethod] = useState({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
  const [editingMethod, setEditingMethod] = useState(null);
  const [editMethodData, setEditMethodData] = useState({});
  const [adminEmail, setAdminEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user: authUser } = useAuth();

  useEffect(() => {
    Promise.all([
      base44.entities.ExchangeRate.list({}),
      base44.entities.PaymentMethod.list({}),
      base44.entities.DesignServiceRate.list({ sort: 'sort_order' }),
    ]).then(([r, m, dr]) => {
      setRates(r);
      setMethods(m);
      setDesignRates(dr);
    }).finally(() => setDesignRatesLoading(false));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (authUser.admin_notification_email) setAdminEmail(authUser.admin_notification_email);
    else if (authUser.email) setAdminEmail(authUser.email);
  }, [authUser?.id]);

  async function saveAdminEmail() {
    try {
      setSavingEmail(true);
      await base44.auth.updateMe({ admin_notification_email: adminEmail });
      toast.success('Saved!', { duration: 1500 });
      setSavingEmail(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }





  async function saveRate(rate) {
    try {
      await base44.entities.ExchangeRate.update(rate.id, rate);
      toast.success('Saved!', { duration: 1500 });
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function addRate() {
    try {
      if (!newRate.currency_code || !newRate.rate_to_usd) return;
      await base44.entities.ExchangeRate.create({ ...newRate, is_active: true });
      toast.success('Exchange rate added');
      setNewRate({ currency_code: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: false });
      const r = await base44.entities.ExchangeRate.list({});
      setRates(r);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function deleteRate(id) {
    try {
      await base44.entities.ExchangeRate.delete(id);
      setRates(r => r.filter(x => x.id !== id));
      toast.success('Rate deleted');
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function addMethod() {
    try {
      if (!newMethod.country || !newMethod.method_name) return;
      await base44.entities.PaymentMethod.create({ ...newMethod, is_active: true });
      toast.success('Payment method added');
      setNewMethod({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
      const m = await base44.entities.PaymentMethod.list({});
      setMethods(m);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function toggleMethod(id, is_active) {
    try {
      await base44.entities.PaymentMethod.update(id, { is_active });
      setMethods(ms => ms.map(m => m.id === id ? { ...m, is_active } : m));
      toast.success(`Method ${is_active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function deleteMethod(id) {
    try {
      await base44.entities.PaymentMethod.delete(id);
      setMethods(ms => ms.filter(m => m.id !== id));
      toast.success('Method deleted');
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function reloadDesignRates() {
    const dr = await base44.entities.DesignServiceRate.list({ sort: 'sort_order' });
    setDesignRates(dr);
  }

  async function addDesignRate() {
    try {
      if (!newDesignRate.service_name.trim() || !newDesignRate.price) {
        toast.error('Service name and price are required');
        return;
      }
      const design_type = newDesignRate.design_type.trim() || newDesignRate.service_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      await base44.entities.DesignServiceRate.create({
        ...newDesignRate,
        design_type,
        price: parseFloat(newDesignRate.price) || 0,
        sort_order: designRates.length,
        is_active: true,
      });
      toast.success('Design service added');
      setNewDesignRate({ service_name: '', design_type: '', country: 'Malawi', currency: 'MWK', symbol: 'MK', price: '', max_revisions: 2 });
      await reloadDesignRates();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function updateDesignRate(id, data) {
    try {
      await base44.entities.DesignServiceRate.update(id, data);
      toast.success('Saved!', { duration: 1500 });
      await reloadDesignRates();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  function startEditRate(rate) {
    setEditingRateId(rate.id);
    setEditRateData({ service_name: rate.service_name, price: rate.price, max_revisions: rate.max_revisions });
  }

  async function saveEditRate(id) {
    try {
      await base44.entities.DesignServiceRate.update(id, {
        service_name: editRateData.service_name,
        price: parseFloat(editRateData.price) || 0,
        max_revisions: parseInt(editRateData.max_revisions) || 2,
      });
      toast.success('Saved!', { duration: 1500 });
      setEditingRateId(null);
      await reloadDesignRates();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function deleteDesignRate(id) {
    try {
      await base44.entities.DesignServiceRate.delete(id);
      toast.success('Design service deleted');
      setConfirmDeleteRate(null);
      await reloadDesignRates();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function deleteAllEntity(entityKey) {
    try {
      setDeleting(true);
      const records = await base44.entities[entityKey].list({});
      for (const r of records) {
        await base44.entities[entityKey].delete(r.id);
      }
      setDeleting(false);
      setConfirmDelete(null);
      toast.success(`All ${entityKey} records deleted`);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  function startEdit(m) {
    setEditingMethod(m.id);
    setEditMethodData({ ...m });
  }

  async function saveEditMethod() {
    try {
      await base44.entities.PaymentMethod.update(editingMethod, editMethodData);
      setMethods(ms => ms.map(m => m.id === editingMethod ? { ...m, ...editMethodData } : m));
      setEditingMethod(null);
      toast.success('Saved!', { duration: 1500 });
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage exchange rates, payment methods, and notifications</p>
      </div>


      {/* Exchange Rates */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Exchange Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {rates.map(rate => (
              <div key={rate.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Currency</p>
                    <p className="font-semibold text-sm">{rate.currency_code}</p>
                    <p className="text-xs text-muted-foreground">{rate.country}</p>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Rate (per $1)</Label>
                    <Input
                      type="number"
                      value={rate.rate_to_usd}
                      onChange={e => setRates(rs => rs.map(r => r.id === rate.id ? { ...r, rate_to_usd: parseFloat(e.target.value) } : r))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rate.use_fixed_pricing} onCheckedChange={v => setRates(rs => rs.map(r => r.id === rate.id ? { ...r, use_fixed_pricing: v } : r))} />
                    <span className="text-xs text-muted-foreground">Fixed pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rate.is_active} onCheckedChange={v => setRates(rs => rs.map(r => r.id === rate.id ? { ...r, is_active: v } : r))} />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => saveRate(rate)}>
                    <Save className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRate(rate.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new rate */}
          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Exchange Rate</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input value={newRate.currency_code} onChange={e => setNewRate(r => ({ ...r, currency_code: e.target.value.toUpperCase() }))} placeholder="MWK" />
              <Input value={newRate.currency_name} onChange={e => setNewRate(r => ({ ...r, currency_name: e.target.value }))} placeholder="Malawian Kwacha" />
              <Select value={newRate.country} onValueChange={v => setNewRate(r => ({ ...r, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" value={newRate.rate_to_usd} onChange={e => setNewRate(r => ({ ...r, rate_to_usd: e.target.value }))} placeholder="Rate per $1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newRate.use_fixed_pricing} onCheckedChange={v => setNewRate(r => ({ ...r, use_fixed_pricing: v }))} />
              <span className="text-sm text-muted-foreground">Use fixed local pricing (e.g. Malawi)</span>
            </div>
            <Button onClick={addRate} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Rate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Graphic Design Rate Card — individual per-service pricing (no monthly retainer) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Graphic Design Rate Card
          </CardTitle>
          <p className="text-xs text-muted-foreground">Every service is a flat, one-off price — no monthly retainer. Clients pay per design they order.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {designRatesLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : designRates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No design services yet — add your first one below.</p>
          ) : (
            <div className="space-y-2">
              {designRates.map(rate => (
                <div key={rate.id} className="p-3 bg-secondary/50 rounded-xl">
                  {editingRateId === rate.id ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input className="flex-1" value={editRateData.service_name} onChange={e => setEditRateData(d => ({ ...d, service_name: e.target.value }))} placeholder="Service name" />
                      <Input className="sm:w-32" type="number" value={editRateData.price} onChange={e => setEditRateData(d => ({ ...d, price: e.target.value }))} placeholder="Price" />
                      <Input className="sm:w-28" type="number" value={editRateData.max_revisions} onChange={e => setEditRateData(d => ({ ...d, max_revisions: e.target.value }))} placeholder="Revisions" />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => saveEditRate(rate.id)}><Check className="w-4 h-4 text-green-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingRateId(null)}><X className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{rate.service_name}</p>
                          <Badge variant={rate.is_active ? 'default' : 'secondary'} className="text-xs">{rate.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rate.symbol}{Number(rate.price).toLocaleString()} {rate.currency} • one-off • {rate.max_revisions} revisions included
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={rate.is_active} onCheckedChange={v => updateDesignRate(rate.id, { is_active: v })} />
                        <Button variant="ghost" size="icon" onClick={() => startEditRate(rate)}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteRate(rate.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Design Service</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={newDesignRate.service_name} onChange={e => setNewDesignRate(p => ({ ...p, service_name: e.target.value }))} placeholder="Service name (e.g. Logo)" />
              <Input type="number" value={newDesignRate.price} onChange={e => setNewDesignRate(p => ({ ...p, price: e.target.value }))} placeholder="Price" />
              <Select value={newDesignRate.country} onValueChange={v => setNewDesignRate(p => ({ ...p, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={newDesignRate.currency} onChange={e => setNewDesignRate(p => ({ ...p, currency: e.target.value.toUpperCase() }))} placeholder="Currency (e.g. MWK)" />
              <Input value={newDesignRate.symbol} onChange={e => setNewDesignRate(p => ({ ...p, symbol: e.target.value }))} placeholder="Symbol (e.g. MK)" />
              <Input type="number" value={newDesignRate.max_revisions} onChange={e => setNewDesignRate(p => ({ ...p, max_revisions: parseInt(e.target.value) || 2 }))} placeholder="Max Revisions" />
            </div>
            <Button onClick={addDesignRate} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Service
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDeleteRate}
        onOpenChange={(v) => !v && setConfirmDeleteRate(null)}
        title="Delete this design service?"
        description="Clients will no longer be able to order it. This cannot be undone."
        onConfirm={() => deleteDesignRate(confirmDeleteRate)}
      />


      {/* Payment Methods */}
            <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Methods by Country
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from(new Set(methods.map(m => m.country))).map(country => (
            <div key={country}>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">{country}</h4>
              <div className="space-y-2">
                {methods.filter(m => m.country === country).map(m => (
                   <div key={m.id} className="p-3 bg-secondary/50 rounded-xl">
                     {editingMethod === m.id ? (
                       <div className="space-y-2">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           <Input value={editMethodData.method_name || ''} onChange={e => setEditMethodData(d => ({ ...d, method_name: e.target.value }))} placeholder="Method name" className="h-8 text-sm" />
                           <Input value={editMethodData.account_name || ''} onChange={e => setEditMethodData(d => ({ ...d, account_name: e.target.value }))} placeholder="Account name" className="h-8 text-sm" />
                           <Input value={editMethodData.account_number || ''} onChange={e => setEditMethodData(d => ({ ...d, account_number: e.target.value }))} placeholder="Account number" className="h-8 text-sm" />
                         </div>
                         <Input value={editMethodData.instructions || ''} onChange={e => setEditMethodData(d => ({ ...d, instructions: e.target.value }))} placeholder="Instructions" className="h-8 text-sm" />
                         <div className="flex items-center gap-2">
                           <Button size="sm" onClick={saveEditMethod} className="gap-1 h-7">
                             <Check className="w-3 h-3" /> Save
                           </Button>
                           <Button size="sm" variant="outline" onClick={() => setEditingMethod(null)} className="h-7">
                             <X className="w-3 h-3" /> Cancel
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex items-center justify-between">
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold text-sm">{m.method_name}</p>
                           {m.account_number && <p className="text-xs text-muted-foreground">{m.account_name} · {m.account_number}</p>}
                           {m.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">{m.instructions}</p>}
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                           <Switch checked={m.is_active} onCheckedChange={v => toggleMethod(m.id, v)} />
                           <Button variant="ghost" size="icon" onClick={() => startEdit(m)}>
                             <Pencil className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => deleteMethod(m.id)}>
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
              </div>
            </div>
          ))}

          {/* Add new method */}
          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Payment Method</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={newMethod.country} onValueChange={v => setNewMethod(m => ({ ...m, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={newMethod.method_name} onChange={e => setNewMethod(m => ({ ...m, method_name: e.target.value }))} placeholder="e.g. Airtel Money" />
              <Input value={newMethod.account_name} onChange={e => setNewMethod(m => ({ ...m, account_name: e.target.value }))} placeholder="Account Name" />
              <Input value={newMethod.account_number} onChange={e => setNewMethod(m => ({ ...m, account_number: e.target.value }))} placeholder="Account / Number" />
            </div>
            <Input value={newMethod.instructions} onChange={e => setNewMethod(m => ({ ...m, instructions: e.target.value }))} placeholder="Payment instructions for clients..." />
            <Button onClick={addMethod} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <EmailTemplatesTab />

      {/* Admin Notification Email */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" /> Admin Notification Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Where system notifications (new campaigns, payments, etc.) get emailed.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@brandfletch.com"
              className="h-9"
            />
            <Button onClick={saveAdminEmail} disabled={savingEmail || !adminEmail}>
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone — last section */}
      <Card className="shadow-sm border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-4 h-4" /> Danger Zone — Delete All Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Permanently delete all records for a specific entity. This cannot be undone.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DANGER_ENTITIES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <span className="text-sm font-medium">{label}</span>
                {confirmDelete === key ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-destructive">Are you sure?</span>
                    <Button size="sm" variant="destructive" disabled={deleting} className="h-7 text-xs" onClick={() => deleteAllEntity(key)}>
                      {deleting ? 'Deleting...' : 'Yes, delete all'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 gap-1" onClick={() => setConfirmDelete(key)}>
                    <Trash2 className="w-3 h-3" /> Delete all
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}