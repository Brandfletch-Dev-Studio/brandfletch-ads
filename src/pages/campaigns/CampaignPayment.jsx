import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, ArrowLeft, Copy, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CampaignPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [reference, setReference] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [payingWithWallet, setPayingWithWallet] = useState(false);

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const c = await base44.entities.Campaign.filter({ id });
    const camp = c[0] || await base44.entities.Campaign.list().then(all => all.find(x => x.id === id));
    setCampaign(camp);
    
    // Get user's wallet
    const user = await base44.auth.me();
    const wallets = await base44.entities.Wallet.filter({ user_id: user.id });
    if (wallets.length > 0) {
      setWallet(wallets[0]);
    }
    
    if (camp?.country) {
      const methods = await base44.entities.PaymentMethod.filter({ country: camp.country, is_active: true }, 'sort_order');
      setPaymentMethods(methods);
    }
  }

  async function handleProofUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProofFile(file_url);
    setUploading(false);
    toast.success('Proof uploaded!');
  }

  async function handleSubmit() {
    if (!selectedMethod || !proofFile) {
      toast.error('Please select a payment method and upload your proof.');
      return;
    }
    setSubmitting(true);
    await base44.entities.Campaign.update(id, {
      status: 'pending_review',
      payment_method: selectedMethod.method_name,
      payment_reference: reference,
      payment_proof_url: proofFile,
    });

    // Create wallet transaction record
    const user = await base44.auth.me();
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'payment',
      amount: campaign.total_cost,
      amount_usd: campaign.total_cost_usd || (campaign.currency === 'USD' ? campaign.total_cost : null),
      currency: campaign.currency,
      payment_method: selectedMethod.method_name,
      payment_reference: reference,
      payment_proof_url: proofFile,
      campaign_id: id,
      status: 'pending',
      description: `Campaign payment - ${campaign.page_name}`,
    });

    toast.success('Payment submitted! We\'ll verify your payment shortly.');
    navigate(`/campaigns/${id}`);
    setSubmitting(false);
  }

  async function handlePayWithWallet() {
    if (!wallet || wallet.balance < campaign.total_cost) {
      toast.error('Insufficient wallet balance. Please top up your wallet first.');
      navigate('/wallet');
      return;
    }

    setPayingWithWallet(true);
    try {
      const response = await base44.functions.invoke('payCampaignWithWallet', { campaignId: id });
      if (response.data.success) {
        toast.success('Campaign paid successfully! Your campaign is now approved and active.');
        setWallet(prev => ({ ...prev, balance: response.data.new_balance }));
        navigate(`/campaigns/${id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process wallet payment');
    } finally {
      setPayingWithWallet(false);
    }
  }

  const formatCost = () => {
    if (!campaign) return '';
    const amt = campaign.total_cost || 0;
    const cur = campaign.currency || 'USD';
    if (cur === 'USD') return `$${amt.toFixed(2)}`;
    return `${cur} ${amt.toLocaleString()}`;
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  function CopyRow({ label, value }) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
          className="p-2 rounded-lg hover:bg-border transition-colors flex-shrink-0"
          title="Copy"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const canPayWithWallet = wallet && wallet.balance >= campaign.total_cost;

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold font-heading">Complete Payment</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit your payment proof to activate your campaign.</p>
      </div>

      {/* Wallet payment option */}
      {wallet && (
        <Card className={`border-2 transition-all ${canPayWithWallet ? 'border-green-400 bg-green-50' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Pay with Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Campaign Cost</p>
                <p className="text-lg font-bold">{formatCost()}</p>
              </div>
            </div>
            {canPayWithWallet ? (
              <Button
                onClick={handlePayWithWallet}
                disabled={payingWithWallet}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {payingWithWallet ? 'Processing...' : 'Pay with Wallet Balance (Instant Approval)'}
              </Button>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                Insufficient balance. <a href="/wallet" className="underline font-medium">Top up your wallet</a> to pay instantly.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or pay with traditional method</span>
        </div>
      </div>

      {/* Amount card */}
      <Card className="bg-[hsl(var(--primary))] border-0 text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-sm opacity-80">Total Due</p>
          <p className="text-3xl font-bold font-heading">{formatCost()}</p>
          <p className="text-sm opacity-70 mt-1 capitalize">{campaign.package} · {campaign.duration}</p>
        </CardContent>
      </Card>

      {/* Payment method selection */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Select Payment Method</Label>
        {paymentMethods.length === 0 ? (
          <div className="p-4 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
            No payment methods configured for {campaign.country}.<br />
            <a href="mailto:support@brandfletch.com" className="text-[hsl(var(--accent))] hover:underline">Contact us</a> for payment instructions.
          </div>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedMethod?.id === m.id
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                    : 'border-border hover:border-[hsl(var(--primary))]/40'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">{m.method_name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{m.method_name}</p>
                  {m.account_number && (
                    <p className="text-xs text-muted-foreground">{m.account_name} · {m.account_number}</p>
                  )}
                </div>
                {selectedMethod?.id === m.id && <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMethod && (
        <>
          {/* Copyable payment details card */}
          <div className="p-4 bg-secondary/60 border border-border rounded-xl space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Details</p>
            {selectedMethod.account_name && (
              <CopyRow label="Account Name" value={selectedMethod.account_name} />
            )}
            {selectedMethod.account_number && (
              <CopyRow label="Account Number / Phone" value={selectedMethod.account_number} />
            )}
            {selectedMethod.instructions && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Instructions</p>
                <p className="text-sm text-foreground">{selectedMethod.instructions}</p>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Transaction Reference Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Enter your transaction reference (if available)"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Upload Proof of Payment *</Label>
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              proofFile ? 'border-green-400 bg-green-50' : 'border-border hover:bg-secondary/40'
            }`}>
              {proofFile ? (
                <div className="text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-700">Proof uploaded!</p>
                  <p className="text-xs text-green-600">Click to replace</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
                </div>
              )}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} disabled={uploading} />
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !proofFile}
            className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold py-3"
          >
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </>
      )}
    </div>
  );
}