import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const c = await base44.entities.Campaign.filter({ id });
    const camp = c[0] || await base44.entities.Campaign.list().then(all => all.find(x => x.id === id));
    setCampaign(camp);
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
    if (!selectedMethod || !reference || !proofFile) {
      toast.error('Please complete all payment fields.');
      return;
    }
    setSubmitting(true);
    await base44.entities.Campaign.update(id, {
      status: 'awaiting_payment',
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

  const formatCost = () => {
    if (!campaign) return '';
    if (campaign.currency === 'MWK') return `MK${(campaign.total_cost || 0).toLocaleString()}`;
    return `$${(campaign.total_cost || 0).toFixed(2)}`;
  };

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold font-heading">Complete Payment</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit your payment proof to activate your campaign.</p>
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
          {selectedMethod.instructions && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <p className="font-semibold mb-1">Instructions:</p>
              <p>{selectedMethod.instructions}</p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Transaction Reference Number *</Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Enter your transaction reference"
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
            disabled={submitting || !reference || !proofFile}
            className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold py-3"
          >
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </>
      )}
    </div>
  );
}