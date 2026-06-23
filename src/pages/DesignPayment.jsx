import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, ArrowLeft, Copy, ExternalLink, Loader2 } from 'lucide-react';
import InvoiceDownload from '@/components/InvoiceDownload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DesignPayment() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [reference, setReference] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [isMalawi, setIsMalawi] = useState(false);
  const [paychanguLoading, setPaychanguLoading] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);

    const subscriptions = await base44.entities.PlatformSubscription.filter({
      user_id: u?.id,
      subscription_type: 'design_retainer',
      status: 'pending',
    }, { sort: '-created_date' });

    const sub = subscriptions[0] || null;
    if (sub) setSubscription(sub);

    // Detect Malawi by currency (MWK) or user country
    const userCountry = u.country || '';
    const subCurrency = sub?.currency || '';
    const isMW = subCurrency === 'MWK' || userCountry.toLowerCase() === 'malawi' || userCountry.toUpperCase() === 'MW';
    setIsMalawi(isMW);

    if (!isMW && userCountry) {
      const methods = await base44.entities.PaymentMethod.filter({ is_active: true, country: userCountry }, { sort: 'sort_order' });
      setPaymentMethods(methods);
    } else if (!isMW) {
      // Try fetching generic payment methods
      const methods = await base44.entities.PaymentMethod.filter({ is_active: true }, { sort: 'sort_order' });
      setPaymentMethods(methods);
    }
  }

  async function handlePaychangu() {
    if (!subscription) return;
    setPaychanguLoading(true);
    const txRef = `BF-DESIGN-${subscription.id}-${Date.now()}`;
    const appUrl = window.location.origin;

    const res = await base44.functions.invoke('paychanguCheckout', {
      amount: subscription.amount,
      currency: subscription.currency || 'MWK',
      tx_ref: txRef,
      description: `Design Subscription - ${subscription.subscription_type.replace('_', ' ')}`,
      callback_url: `${appUrl}/designs?paychangu_tx=${txRef}&payment_type=design&sub_id=${subscription.id}`,
      return_url: `${appUrl}/designs/payment`,
    });

    setPaychanguLoading(false);

    if (res.data?.checkout_url) {
      window.location.href = res.data.checkout_url;
    } else {
      toast.error(res.data?.error || 'Failed to initiate payment');
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

    await base44.entities.PlatformSubscription.update(subscription.id, {
      status: 'awaiting_payment',
      payment_method: selectedMethod.method_name,
    });

    const serviceOrders = await base44.entities.ServiceOrder.filter({
      user_id: user.id,
      status: 'pending',
    });

    if (serviceOrders.length > 0) {
      await base44.entities.ServiceOrder.update(serviceOrders[0].id, {
        payment_method: selectedMethod.method_name,
        payment_reference: reference,
        payment_proof_url: proofFile,
      });
    }

    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'payment',
      amount: subscription.amount,
      currency: subscription.currency,
      payment_method: selectedMethod.method_name,
      payment_reference: reference,
      payment_proof_url: proofFile,
      status: 'pending',
      description: `Design subscription payment`,
    });

    toast.success("Payment submitted! We'll verify your payment shortly.");
    navigate('/designs');
    setSubmitting(false);
  }

  const formatAmount = () => {
    if (!subscription) return '';
    const amt = subscription.amount || 0;
    const cur = subscription.currency || 'MWK';
    if (cur === 'MWK') return `MK${amt.toLocaleString()}`;
    if (cur === 'USD') return `$${amt.toFixed(2)}`;
    return `${cur} ${amt.toLocaleString()}`;
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
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (!subscription) return <div className="p-8 text-center text-muted-foreground">No pending subscription found.</div>;

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold font-heading">Complete Payment</h1>
        <p className="text-muted-foreground text-sm mt-1">Pay to activate your design subscription.</p>
      </div>

      {/* Amount card */}
      <Card className="bg-[hsl(var(--primary))] border-0 text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-sm opacity-80">Total Due</p>
          <p className="text-3xl font-bold font-heading">{formatAmount()}</p>
          <p className="text-sm opacity-70 mt-1 capitalize">{subscription.subscription_type.replace('_', ' ')}</p>
        </CardContent>
      </Card>

      {/* Malawi: Paychangu checkout */}
      {isMalawi ? (
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Secure Online Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pay securely using Airtel Money, TNM Mpamba, or card via Paychangu.
            </p>
            <Button
              onClick={handlePaychangu}
              disabled={paychanguLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {paychanguLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redirecting...</>
              ) : (
                <>Pay {formatAmount()} via Paychangu <ExternalLink className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Other countries: manual payment methods */
        <>
          <div>
            <Label className="text-sm font-semibold mb-3 block">Select Payment Method</Label>
            {paymentMethods.length === 0 ? (
              <div className="p-4 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                No payment methods configured.<br />
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
              <div className="p-4 bg-secondary/60 border border-border rounded-xl space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Details</p>
                {selectedMethod.account_name && <CopyRow label="Account Name" value={selectedMethod.account_name} />}
                {selectedMethod.account_number && <CopyRow label="Account Number / Phone" value={selectedMethod.account_number} />}
                {selectedMethod.instructions && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Instructions</p>
                    <p className="text-sm text-foreground">{selectedMethod.instructions}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-1.5 block">Transaction Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Enter your transaction reference" />
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
        </>
      )}
    </div>
  );
}