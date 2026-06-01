import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet as WalletIcon, Plus, TrendingUp, TrendingDown, RefreshCw, Upload, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [form, setForm] = useState({ amount: '', payment_method_id: '', reference: '', proof: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const txns = await base44.entities.WalletTransaction.filter({ user_id: u.id }, '-created_date');
    setTransactions(txns);
  }

  const balance = transactions
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => {
      if (t.type === 'top_up' || t.type === 'refund') return sum + (t.amount || 0);
      if (t.type === 'payment') return sum - (t.amount || 0);
      return sum;
    }, 0);

  async function loadPaymentMethods(country) {
    const methods = await base44.entities.PaymentMethod.filter({ country, is_active: true }, 'sort_order');
    setPaymentMethods(methods);
  }

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
    if (!form.amount || !form.reference || !form.proof) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'top_up',
      amount: parseFloat(form.amount),
      payment_reference: form.reference,
      payment_proof_url: form.proof,
      status: 'pending',
      description: 'Wallet top-up',
    });
    toast.success('Top-up submitted for verification!');
    setShowAddFunds(false);
    setForm({ amount: '', payment_method_id: '', reference: '', proof: '' });
    const txns = await base44.entities.WalletTransaction.filter({ user_id: user.id }, '-created_date');
    setTransactions(txns);
    setSubmitting(false);
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const typeIcons = {
    top_up: <TrendingUp className="w-4 h-4 text-green-600" />,
    payment: <TrendingDown className="w-4 h-4 text-red-600" />,
    refund: <RefreshCw className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your advertising balance</p>
        </div>
        <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
          <Plus className="w-4 h-4" /> Add Funds
        </Button>
      </div>

      {/* Balance card */}
      <Card className="bg-[hsl(var(--primary))] border-0 text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <WalletIcon className="w-6 h-6 opacity-80" />
            <span className="text-sm opacity-80 font-medium">Available Balance</span>
          </div>
          <p className="text-4xl font-bold font-heading">${balance.toFixed(2)}</p>
          <p className="text-xs opacity-60 mt-2">Confirmed funds only</p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      {typeIcons[t.type]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.created_date ? format(new Date(t.created_date), 'MMM d, yyyy') : ''} · {t.payment_method || 'Manual'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-sm font-bold ${t.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'payment' ? '-' : '+'}${(t.amount || 0).toFixed(2)}
                    </span>
                    <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Funds to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Amount (USD) *</Label>
              <Input
                type="number"
                min="1"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Transaction Reference *</Label>
              <Input
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Your payment reference number"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Upload Proof of Payment *</Label>
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                form.proof ? 'border-green-400 bg-green-50' : 'border-border hover:bg-secondary/40'
              }`}>
                {form.proof ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-700 font-medium">Proof uploaded!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFunds(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.amount || !form.reference || !form.proof}
                className="flex-1 bg-[hsl(var(--primary))] text-primary-foreground"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}