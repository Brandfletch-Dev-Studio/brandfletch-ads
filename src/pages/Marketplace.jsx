import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { COUNTRY_CURRENCY } from '@/lib/constants';
import { ShoppingBag, CheckCircle2, Upload, X, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  page_setup: 'Page Setup',
  ads_management: 'Ads Management',
  content_creation: 'Content Creation',
  consulting: 'Consulting',
  other: 'Other',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Marketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ordering, setOrdering] = useState(null); // service being ordered
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewTab, setViewTab] = useState('services'); // 'services' | 'my_orders'

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-active'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }, 'sort_order'),
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }),
  });

  const { data: myOrders = [] } = useQuery({
    queryKey: ['my-service-orders', user?.id],
    queryFn: () => base44.entities.ServiceOrder.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user?.id,
  });

  const country = user?.country;
  const rate = exchangeRates.find(r => r.country === country);
  const currencyInfo = COUNTRY_CURRENCY?.[country];

  function localPrice(usdAmount) {
    if (!rate || !currencyInfo) return `$${usdAmount.toFixed(2)}`;
    const local = usdAmount * rate.rate_to_usd;
    const formatted = local >= 1000
      ? local.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : local.toFixed(2);
    return `${currencyInfo.symbol}${formatted}`;
  }

  async function handleProofUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProofFile(file_url);
    setUploading(false);
    toast.success('Receipt uploaded!');
  }

  async function handleOrder() {
    if (!proofFile) {
      toast.error('Please upload proof of payment.');
      return;
    }
    setSubmitting(true);
    const localAmount = rate ? ordering.price_usd * rate.rate_to_usd : ordering.price_usd;
    await base44.entities.ServiceOrder.create({
      user_id: user.id,
      service_id: ordering.id,
      service_name: ordering.name,
      price_usd: ordering.price_usd,
      currency: currencyInfo?.code || 'USD',
      total_cost: localAmount,
      notes,
      payment_proof_url: proofFile,
      status: 'pending',
    });
    toast.success('Order submitted! Our team will confirm shortly.');
    queryClient.invalidateQueries({ queryKey: ['my-service-orders'] });
    setOrdering(null);
    setNotes('');
    setProofFile(null);
    setSubmitting(false);
  }

  const grouped = Object.keys(CATEGORY_LABELS).map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: services.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Professional services to grow your business
            {currencyInfo && <span className="ml-1">— prices in {currencyInfo.name}</span>}
          </p>
        </div>
        {myOrders.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewTab('services')}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${viewTab === 'services' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
            >
              Services
            </button>
            <button
              onClick={() => setViewTab('my_orders')}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${viewTab === 'my_orders' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
            >
              My Orders {myOrders.length > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{myOrders.length}</span>}
            </button>
          </div>
        )}
      </div>

      {viewTab === 'my_orders' ? (
        <div className="space-y-3">
          {myOrders.map(order => (
            <div key={order.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{order.service_name}</p>
                {order.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.notes}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-semibold text-sm">{localPrice(order.price_usd)}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] || ''}`}>
                  {order.status?.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No services available yet</p>
              <p className="text-sm mt-1">Check back soon</p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(({ cat, label, items }) => (
                <div key={cat}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(service => (
                      <div key={service.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                        {service.image_url && (
                          <img src={service.image_url} alt={service.name} className="w-full h-36 object-cover rounded-xl mb-4" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-base leading-snug">{service.name}</h3>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-lg text-[hsl(var(--primary))]">{localPrice(service.price_usd)}</p>
                              {currencyInfo && <p className="text-xs text-muted-foreground">(${service.price_usd} USD)</p>}
                            </div>
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{service.description}</p>
                          )}
                          {service.features?.length > 0 && (
                            <ul className="space-y-1 mb-3">
                              {service.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <Button
                          className="mt-4 w-full bg-[hsl(var(--primary))] text-primary-foreground font-semibold"
                          onClick={() => { setOrdering(service); setNotes(''); setProofFile(null); }}
                        >
                          Order Now <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Dialog */}
      <Dialog open={!!ordering} onOpenChange={open => !open && setOrdering(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order: {ordering?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Price summary */}
            <div className="bg-[hsl(var(--primary))] rounded-xl p-4 text-primary-foreground">
              <p className="text-sm opacity-80">Total</p>
              <p className="text-2xl font-bold font-heading">{ordering && localPrice(ordering.price_usd)}</p>
              {currencyInfo && <p className="text-xs opacity-70">(${ordering?.price_usd} USD)</p>}
            </div>

            <div>
              <Label className="mb-1.5 block">Your requirements / notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tell us what you need, any specific details..."
                rows={3}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Upload Proof of Payment *</Label>
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                proofFile ? 'border-green-400 bg-green-50' : 'border-border hover:bg-secondary/40'
              }`}>
                {proofFile ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium text-green-700">Receipt uploaded!</p>
                    <p className="text-xs text-green-600">Click to replace</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload payment screenshot'}</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} disabled={uploading} />
              </label>
            </div>

            <Button
              onClick={handleOrder}
              disabled={submitting || !proofFile || uploading}
              className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}