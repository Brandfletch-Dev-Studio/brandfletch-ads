import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, DollarSign, CreditCard, Pencil, X, Check, Mail, AlertTriangle, ShieldAlert, Palette } from 'lucide-react';
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
  const [designPricing, setDesignPricing] = useState([]);
  const [newDesignPricing, setNewDesignPricing] = useState({ pricing_type: 'per_design', country: '', currency: '', symbol: '', price: '', monthly_quota: null, max_revisions: 2 });
  const [newRate, setNewRate] = useState({ currency_code: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: false });
  const [newMethod, setNewMethod] = useState({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
  const [editingMethod, setEditingMethod] = useState(null);
  const [editMethodData, setEditMethodData] = useState({});
  const [adminEmail, setAdminEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.ExchangeRate.list(),
      base44.entities.PaymentMethod.list(),
      base44.auth.me(),
      base44.entities.DesignPricing.list(),
    ]).then(([r, m, u, dp]) => {
      setRates(r);
      setMethods(m);
      setDesignPricing(dp);
      if (u?.admin_notification_email) setAdminEmail(u.admin_notification_email);
      else if (u?.email) setAdminEmail(u.email);
    });
  }, []);

  async function saveAdminEmail() {
    setSavingEmail(true);
    await base44.auth.updateMe({ admin_notification_email: adminEmail });
    toast.success('Saved!', { duration: 1500 });
    setSavingEmail(false);
  }





  async function saveRate(rate) {
    await base44.entities.ExchangeRate.update(rate.id, rate);
    toast.success('Saved!', { duration: 1500 });
  }

  async function addRate() {
    if (!newRate.currency_code || !newRate.rate_to_usd) return;
    await base44.entities.ExchangeRate.create({ ...newRate, is_active: true });
    toast.success('Exchange rate added');
    setNewRate({ currency_code: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: false });
    const r = await base44.entities.ExchangeRate.list();
    setRates(r);
  }

  async function deleteRate(id) {
    await base44.entities.ExchangeRate.delete(id);
    setRates(r => r.filter(x => x.id !== id));
    toast.success('Rate deleted');
  }

  async function addMethod() {
    if (!newMethod.country || !newMethod.method_name) return;
    await base44.entities.PaymentMethod.create({ ...newMethod, is_active: true });
    toast.success('Payment method added');
    setNewMethod({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
    const m = await base44.entities.PaymentMethod.list();
    setMethods(m);
  }

  async function toggleMethod(id, is_active) {
    await base44.entities.PaymentMethod.update(id, { is_active });
    setMethods(ms => ms.map(m => m.id === id ? { ...m, is_active } : m));
    toast.success(`Method ${is_active ? 'enabled' : 'disabled'}`);
  }

  async function deleteMethod(id) {
    await base44.entities.PaymentMethod.delete(id);
    setMethods(ms => ms.filter(m => m.id !== id));
    toast.success('Method deleted');
  }

  async function addDesignPricing() {
    if (!newDesignPricing.country || !newDesignPricing.price) return;
    await base44.entities.DesignPricing.create({ ...newDesignPricing, is_active: true });
    toast.success('Design pricing added');
    setNewDesignPricing({ pricing_type: 'per_design', country: '', currency: '', symbol: '', price: '', monthly_quota: null, max_revisions: 2 });
    const dp = await base44.entities.DesignPricing.list();
    setDesignPricing(dp);
  }

  async function updateDesignPricing(id, data) {
    await base44.entities.DesignPricing.update(id, data);
    toast.success('Saved!', { duration: 1500 });
    const dp = await base44.entities.DesignPricing.list();
    setDesignPricing(dp);
  }

  async function deleteDesignPricing(id) {
    await base44.entities.DesignPricing.delete(id);
    toast.success('Design pricing deleted');
    const dp = await base44.entities.DesignPricing.list();
    setDesignPricing(dp);
  }

  async function deleteAllEntity(entityKey) {
    setDeleting(true);
    const records = await base44.entities[entityKey].list();
    for (const r of records) {
      await base44.entities[entityKey].delete(r.id);
    }
    setDeleting(false);
    setConfirmDelete(null);
    toast.success(`All ${entityKey} records deleted`);
  }

  function startEdit(m) {
    setEditingMethod(m.id);
    setEditMethodData({ ...m });
  }

  async function saveEditMethod() {
    await base44.entities.PaymentMethod.update(editingMethod, editMethodData);
    setMethods(ms => ms.map(m => m.id === editingMethod ? { ...m, ...editMethodData } : m));
    setEditingMethod(null);
    toast.success('Saved!', { duration: 1500 });
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

      {/* Design Pricing by Country */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" /> Design Pricing by Country
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from(new Set(designPricing.map(p => p.country))).map(country => (
            <div key={country}>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">{country}</h4>
              <div className="space-y-2">
                {designPricing.filter(p => p.country === country).map(p => (
                  <div key={p.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{p.pricing_type === 'retainer' ? 'Monthly Retainer' : 'Pay Per Design'}</p>
                          <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">{p.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.symbol}{p.price.toLocaleString()} {p.currency}
                          {p.pricing_type === 'retainer' && p.monthly_quota && ` • ${p.monthly_quota} designs/month`}
                          {p.max_revisions && ` • ${p.max_revisions} revisions`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={p.is_active} onCheckedChange={v => updateDesignPricing(p.id, { is_active: v })} />
                        <Button variant="ghost" size="icon" onClick={() => deleteDesignPricing(p.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Design Pricing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={newDesignPricing.pricing_type} onValueChange={v => setNewDesignPricing(p => ({ ...p, pricing_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Pricing Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_design">Pay Per Design</SelectItem>
                  <SelectItem value="retainer">Monthly Retainer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newDesignPricing.country} onValueChange={v => setNewDesignPricing(p => ({ ...p, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={newDesignPricing.currency} onChange={e => setNewDesignPricing(p => ({ ...p, currency: e.target.value.toUpperCase() }))} placeholder="Currency (e.g. MWK)" />
              <Input value={newDesignPricing.symbol} onChange={e => setNewDesignPricing(p => ({ ...p, symbol: e.target.value }))} placeholder="Symbol (e.g. MK)" />
              <Input type="number" value={newDesignPricing.price} onChange={e => setNewDesignPricing(p => ({ ...p, price: parseFloat(e.target.value) }))} placeholder="Price" />
              {newDesignPricing.pricing_type === 'retainer' && (
                <Input type="number" value={newDesignPricing.monthly_quota} onChange={e => setNewDesignPricing(p => ({ ...p, monthly_quota: parseInt(e.target.value) }))} placeholder="Monthly Quota" />
              )}
              <Input type="number" value={newDesignPricing.max_revisions} onChange={e => setNewDesignPricing(p => ({ ...p, max_revisions: parseInt(e.target.value) }))} placeholder="Max Revisions" />
            </div>
            <Button onClick={addDesignPricing} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Pricing
            </Button>
          </div>
        </CardContent>
      </Card>


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