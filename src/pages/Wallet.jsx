import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Wallet as WalletIcon, Plus,
  RefreshCw, Upload, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft,
  ChevronDown, Copy, CheckCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { COUNTRY_CURRENCY, formatLocalCurrency } from '@/lib/constants';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [form, setForm] = useState({ amount: '', payment_method_id: '', reference: '', proof: '' });
  const [expandedMethod, setExpandedMethod] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [txns, methods] = await Promise.all([
      base44.entities.WalletTransaction.filter({ user_id: u.id }, '-created_date'),
      u.country ? base44.entities.PaymentMethod.filter({ country: u.country, is_active: true }) : Promise.resolve([]),
    ]);
    setTransactions(txns);
    setPaymentMethods(methods);
  }

  function copyText(text, field) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const confirmed = transactions.filter(t => t.status === 'confirmed');
  const pending = transactions.filter(t => t.status === 'pending');

  const balance = confirmed.reduce((sum, t) => {
    if (t.type === 'top_up' || t.type === 'refund') return sum + (t.amount || 0);
    if (t.type === 'payment') return sum - (t.amount || 0);
    return sum;
  }, 0);

  const pendingAmount = pending
    .filter(t => t.type === 'top_up')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, proof: file_url }));
    setUploading(false);
    toast.success('Proof uploaded!');
  }

  async function handleSubmit() {
    if (!form.amount || !form.proof) {
      toast.error('Please enter an amount and upload proof of payment.');
      return;
    }
    setSubmitting(true);
    const selectedMethod = paymentMethods.find(m => m.id === form.payment_method_id);
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'top_up',
      amount: parseFloat(form.amount),
      currency: COUNTRY_CURRENCY[user?.country]?.code || 'USD',
      payment_method: selectedMethod?.method_name || '',
      payment_reference: form.reference,
      payment_proof_url: form.proof,
      status: 'pending',
      description: 'Wallet top-up',
    });
    toast.success('Top-up submitted! Our team will verify shortly.');
    setShowAddFunds(false);
    setForm({ amount: '', payment_method_id: '', reference: '', proof: '' });
    setExpandedMethod(null);
    const txns = await base44.entities.WalletTransaction.filter({ user_id: user.id }, '-created_date');
    setTransactions(txns);
    setSubmitting(false);
  }

  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const typeConfig = {
    top_up: { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50', prefix: '+' },
    payment: { icon: ArrowDownLeft, color: 'text-red-600', bg: 'bg-red-50', prefix: '-' },
    refund: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', prefix: '+' },
  };

  const currencyCfg = COUNTRY_CURRENCY[user?.country];
  const currencyLabel = currencyCfg ? `${currencyCfg.name} (${currencyCfg.code})` : 'USD';

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your advertising balance · {currencyLabel}</p>
        </div>
        <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
          <Plus className="w-4 h-4" /> Add Funds
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--navy-light))] border-0 text-primary-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <WalletIcon className="w-4 h-4 opacity-70" />
              <span className="text-xs opacity-70 font-medium uppercase tracking-wide">Available Balance</span>
            </div>
            <p className="text-3xl font-bold font-heading">{formatLocalCurrency(balance, user?.country)}</p>
            <p className="text-xs opacity-50 mt-1">Ready to spend</p>
          </CardContent>
        </Card>

        {pendingAmount > 0 && (
          <Card className="bg-amber-50 border-amber-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">Pending Verification</span>
              </div>
              <p className="text-3xl font-bold font-heading text-amber-800">{formatLocalCurrency(pendingAmount, user?.country)}</p>
              <p className="text-xs text-amber-600 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction History */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
            <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <WalletIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add funds to get started</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowAddFunds(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Funds
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(t => {
                const tc = typeConfig[t.type] || typeConfig.top_up;
                const sc = statusConfig[t.status] || statusConfig.pending;
                const TIcon = tc.icon;
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                        <TIcon className={`w-4 h-4 ${tc.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description || t.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.created_date ? format(new Date(t.created_date), 'MMM d, yyyy') : ''}
                          {t.payment_reference && ` · Ref: ${t.payment_reference}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                      <span className={`text-sm font-bold tabular-nums ${t.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                        {tc.prefix}{formatLocalCurrency(t.amount || 0, user?.country)}
                      </span>
                      <Badge className={`text-xs px-2 py-0.5 ${sc.className}`}>{sc.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={open => { setShowAddFunds(open); if (!open) { setForm({ amount: '', payment_method_id: '', reference: '', proof: '' }); setExpandedMethod(null); } }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <WalletIcon className="w-5 h-5" /> Add Funds to Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="p-3 rounded-xl bg-secondary/60 text-xs text-muted-foreground">
              Transfer funds to one of the payment methods below, then submit your proof. Our team will verify and credit your wallet.
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>Amount ({currencyCfg ? currencyCfg.code : 'USD'}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  {currencyCfg ? currencyCfg.symbol : '$'}
                </span>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-7 h-10"
                />
              </div>
            </div>

            {/* Payment Methods */}
            {paymentMethods.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm border border-border rounded-xl">
                <p>No payment methods available for {user?.country}.</p>
                <p className="mt-1 text-xs">Contact support@brandfletch.com</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Select Payment Method *</Label>
                <div className="space-y-2">
                  {paymentMethods.map(m => {
                    const isSelected = form.payment_method_id === m.id;
                    const isExpanded = expandedMethod === m.id;
                    return (
                      <div key={m.id} className={`rounded-xl border-2 transition-all overflow-hidden ${isSelected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5' : 'border-border'}`}>
                        <button
                          onClick={() => { setForm(f => ({ ...f, payment_method_id: m.id })); setExpandedMethod(isExpanded ? null : m.id); }}
                          className="w-full text-left p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))] flex-shrink-0" />}
                            <div>
                              <p className="font-semibold text-sm">{m.method_name}</p>
                              {!isExpanded && m.account_number && <p className="text-xs text-muted-foreground mt-0.5">{m.account_number}</p>}
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                            {m.account_name && (
                              <div className="flex items-center justify-between gap-2 bg-background rounded-lg px-3 py-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Account Name</p>
                                  <p className="text-sm font-semibold">{m.account_name}</p>
                                </div>
                                <button onClick={() => copyText(m.account_name, `name-${m.id}`)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
                                  {copiedField === `name-${m.id}` ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </button>
                              </div>
                            )}
                            {m.account_number && (
                              <div className="flex items-center justify-between gap-2 bg-background rounded-lg px-3 py-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Account Number</p>
                                  <p className="text-sm font-semibold font-mono">{m.account_number}</p>
                                </div>
                                <button onClick={() => copyText(m.account_number, `num-${m.id}`)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
                                  {copiedField === `num-${m.id}` ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </button>
                              </div>
                            )}
                            {m.instructions && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-amber-800 mb-1">Instructions</p>
                                <p className="text-xs text-amber-700 whitespace-pre-wrap">{m.instructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reference */}
            <div className="space-y-1.5">
              <Label>Payment Reference / Transaction ID</Label>
              <Input
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. TXN-123456789"
                className="h-10"
              />
            </div>

            {/* Proof Upload */}
            <div className="space-y-1.5">
              <Label>Upload Payment Proof *</Label>
              <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                form.proof ? 'border-green-400 bg-green-50' : 'border-border hover:bg-secondary/40 hover:border-[hsl(var(--accent))]/50'
              }`}>
                {form.proof ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-700 font-medium">Proof uploaded</p>
                    <p className="text-xs text-green-600">Click to replace</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm font-medium text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Image or PDF</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFunds(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploading || !form.amount || !form.proof}
                className="flex-1 bg-[hsl(var(--primary))] text-primary-foreground"
              >
                {submitting ? 'Submitting...' : 'Submit Top-Up'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}