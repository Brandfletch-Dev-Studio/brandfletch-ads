import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, DollarSign, CreditCard, Pencil, X, Check, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { toast } from 'sonner';

const PACKAGES = ['starter', 'growth', 'business', 'premium'];
const DURATIONS = ['daily', 'weekly', 'monthly'];

function PricingTableEditor({ rate, onChange }) {
  const table = rate.pricing_table || {};

  function setCell(pkg, dur, val) {
    const updated = {
      ...table,
      [pkg]: { ...table[pkg], [dur]: val === '' ? '' : parseFloat(val) || 0 },
    };
    onChange({ ...rate, pricing_table: updated });
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left py-1 pr-3 text-muted-foreground font-medium">Package</th>
            {DURATIONS.map(d => (
              <th key={d} className="text-center py-1 px-1 text-muted-foreground font-medium capitalize">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PACKAGES.map(pkg => (
            <tr key={pkg} className="border-t border-border/50">
              <td className="py-1.5 pr-3 font-semibold capitalize">{pkg}</td>
              {DURATIONS.map(dur => (
                <td key={dur} className="py-1 px-1">
                  <Input
                    type="number"
                    value={table[pkg]?.[dur] ?? ''}
                    onChange={e => setCell(pkg, dur, e.target.value)}
                    className="h-7 text-xs text-center w-24"
                    placeholder="0"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RateRow({ rate, onSave, onDelete }) {
  const [localRate, setLocalRate] = useState(rate);
  const [expanded, setExpanded] = useState(false);

  function handleSave() {
    onSave(localRate);
  }

  return (
    <div className="p-3 bg-secondary/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Currency</p>
            <p className="font-semibold text-sm">{localRate.currency_code}</p>
            <p className="text-xs text-muted-foreground">{localRate.country}</p>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Rate (per $1 USD)</Label>
            <Input
              type="number"
              value={localRate.rate_to_usd}
              onChange={e => setLocalRate(r => ({ ...r, rate_to_usd: parseFloat(e.target.value) }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={localRate.use_fixed_pricing}
              onCheckedChange={v => setLocalRate(r => ({ ...r, use_fixed_pricing: v }))}
            />
            <span className="text-xs text-muted-foreground">Fixed pricing table</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={localRate.is_active}
              onCheckedChange={v => setLocalRate(r => ({ ...r, is_active: v }))}
            />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setExpanded(e => !e)} title="Edit pricing table">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <Save className="w-4 h-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(localRate.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Local prices ({localRate.currency_code}) — edit then click Save
          </p>
          <PricingTableEditor rate={localRate} onChange={setLocalRate} />
        </div>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const [rates, setRates] = useState([]);
  const [methods, setMethods] = useState([]);
  const [newRate, setNewRate] = useState({ currency_code: '', currency_symbol: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: true });
  const [newMethod, setNewMethod] = useState({ country: '', method_name: '', method_type: 'mobile_money', account_number: '', account_name: '', instructions: '' });
  const [editingMethod, setEditingMethod] = useState(null);
  const [editMethodData, setEditMethodData] = useState({});
  const [adminEmail, setAdminEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.ExchangeRate.list(),
      base44.entities.PaymentMethod.list(),
      base44.auth.me(),
    ]).then(([r, m, u]) => {
      setRates(r);
      setMethods(m);
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
    setRates(rs => rs.map(r => r.id === rate.id ? rate : r));
    toast.success('Rate saved!', { duration: 1500 });
  }

  async function addRate() {
    if (!newRate.currency_code || !newRate.rate_to_usd) return;
    const created = await base44.entities.ExchangeRate.create({ ...newRate, is_active: true, pricing_table: {} });
    setRates(rs => [...rs, created]);
    toast.success('Exchange rate added');
    setNewRate({ currency_code: '', currency_symbol: '', currency_name: '', country: '', rate_to_usd: '', use_fixed_pricing: true });
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
        <p className="text-muted-foreground text-sm mt-1">Manage pricing, exchange rates, payment methods, and notifications</p>
      </div>

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

      {/* Exchange Rates & Pricing Tables */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Local Pricing by Country
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Set the exact local-currency prices clients will see for each package and duration. Click the expand (↓) button to edit the pricing table per country.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {rates.map(rate => (
              <RateRow key={rate.id} rate={rate} onSave={saveRate} onDelete={deleteRate} />
            ))}
          </div>

          {/* Add new rate */}
          <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
            <h4 className="text-sm font-semibold">Add Country Rate</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input value={newRate.currency_code} onChange={e => setNewRate(r => ({ ...r, currency_code: e.target.value.toUpperCase() }))} placeholder="Code e.g. MWK" />
              <Input value={newRate.currency_symbol} onChange={e => setNewRate(r => ({ ...r, currency_symbol: e.target.value }))} placeholder="Symbol e.g. MK" />
              <Input value={newRate.currency_name} onChange={e => setNewRate(r => ({ ...r, currency_name: e.target.value }))} placeholder="Name e.g. Malawian Kwacha" />
              <Select value={newRate.country} onValueChange={v => setNewRate(r => ({ ...r, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" value={newRate.rate_to_usd} onChange={e => setNewRate(r => ({ ...r, rate_to_usd: e.target.value }))} placeholder="Rate per $1 USD" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newRate.use_fixed_pricing} onCheckedChange={v => setNewRate(r => ({ ...r, use_fixed_pricing: v }))} />
              <span className="text-sm text-muted-foreground">Use fixed pricing table (recommended)</span>
            </div>
            <Button onClick={addRate} className="gap-2">
              <Plus className="w-4 h-4" /> Add Country
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
                          <Button size="sm" onClick={saveEditMethod} className="gap-1 h-7"><Check className="w-3 h-3" /> Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingMethod(null)} className="h-7"><X className="w-3 h-3" /> Cancel</Button>
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
                          <Button variant="ghost" size="icon" onClick={() => startEdit(m)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMethod(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <Button onClick={addMethod} className="gap-2">
              <Plus className="w-4 h-4" /> Add Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}