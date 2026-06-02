import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, DollarSign, CreditCard, Pencil, X, Check, Mail, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [rates, setRates] = useState([]);
  const [methods, setMethods] = useState([]);
  const [newRate, setNewRate] = useState({ currency_code: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: false });
  const [newMethod, setNewMethod] = useState({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
  const [editingMethod, setEditingMethod] = useState(null);
  const [editMethodData, setEditMethodData] = useState({});
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', category: 'page_setup', price_usd: 25 });
  const [editingService, setEditingService] = useState(null);
  const [editServiceData, setEditServiceData] = useState({});
  const [adminEmail, setAdminEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.ExchangeRate.list(),
      base44.entities.PaymentMethod.list(),
      base44.auth.me(),
      base44.entities.Service.list('sort_order'),
    ]).then(([r, m, u, s]) => {
      setRates(r);
      setMethods(m);
      setServices(s);
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

  async function addService() {
    if (!newService.name || !newService.price_usd) return;
    await base44.entities.Service.create({ ...newService, is_active: true });
    toast.success('Service added');
    setNewService({ name: '', description: '', category: 'page_setup', price_usd: 25 });
    const s = await base44.entities.Service.list('sort_order');
    setServices(s);
  }

  async function toggleService(id, is_active) {
    await base44.entities.Service.update(id, { is_active });
    setServices(ss => ss.map(s => s.id === id ? { ...s, is_active } : s));
  }

  async function deleteService(id) {
    await base44.entities.Service.delete(id);
    setServices(ss => ss.filter(s => s.id !== id));
    toast.success('Service deleted');
  }

  async function saveEditService() {
    await base44.entities.Service.update(editingService, editServiceData);
    setServices(ss => ss.map(s => s.id === editingService ? { ...s, ...editServiceData } : s));
    setEditingService(null);
    toast.success('Saved!', { duration: 1500 });
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

      {/* Marketplace Services */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4" /> Marketplace Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {services.map(s => (
              <div key={s.id} className="p-3 bg-secondary/50 rounded-xl">
                {editingService === s.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input value={editServiceData.name || ''} onChange={e => setEditServiceData(d => ({ ...d, name: e.target.value }))} placeholder="Service name" className="h-8 text-sm" />
                      <Input type="number" value={editServiceData.price_usd || ''} onChange={e => setEditServiceData(d => ({ ...d, price_usd: parseFloat(e.target.value) }))} placeholder="Price (USD)" className="h-8 text-sm" />
                    </div>
                    <Input value={editServiceData.description || ''} onChange={e => setEditServiceData(d => ({ ...d, description: e.target.value }))} placeholder="Description" className="h-8 text-sm" />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={saveEditService} className="gap-1 h-7"><Check className="w-3 h-3" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingService(null)} className="h-7"><X className="w-3 h-3" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">${s.price_usd} USD · {s.category?.replace('_', ' ')}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={s.is_active} onCheckedChange={v => toggleService(s.id, v)} />
                      <Button variant="ghost" size="icon" onClick={() => { setEditingService(s.id); setEditServiceData({ ...s }); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteService(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Service</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} placeholder="Service name" />
              <Input type="number" value={newService.price_usd} onChange={e => setNewService(s => ({ ...s, price_usd: parseFloat(e.target.value) }))} placeholder="Price in USD" />
              <Select value={newService.category} onValueChange={v => setNewService(s => ({ ...s, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {['page_setup','ads_management','content_creation','consulting','other'].map(c => (
                    <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} placeholder="Short description" />
            </div>
            <Button onClick={addService} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Email Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" /> Admin Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Receive email alerts for new payments, campaign submissions, and page requests.</p>
          <div className="flex gap-3">
            <Input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@brandfletch.com"
              className="flex-1"
            />
            <Button onClick={saveAdminEmail} disabled={savingEmail} className="gap-2 flex-shrink-0">
              <Save className="w-4 h-4" /> {savingEmail ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Payment Methods */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Methods by Country
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group by country */}
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
    </div>
  );
}