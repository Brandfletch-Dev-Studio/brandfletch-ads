import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DesignCatalog — pick one graphic design service and pay for it individually.
 * Replaces the old monthly-retainer subscription picker: every service is a
 * flat, one-off price from DesignServiceRate. No quotas, no recurring billing.
 */
export default function DesignSubscription({ onSubscribe }) {
  const [orderingId, setOrderingId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rates, isLoading } = useQuery({
    queryKey: ['designServiceRates'],
    queryFn: () => base44.entities.DesignServiceRate.filter({ is_active: true }, { sort: 'sort_order' }),
  });

  const createOrderMutation = useMutation({
    mutationFn: async (rate) => {
      const order = await base44.entities.PlatformSubscription.create({
        user_id: user.id,
        subscription_type: 'design_order',
        status: 'pending',
        amount: rate.price,
        currency: rate.currency || 'MWK',
        start_date: new Date().toISOString().split('T')[0],
        monthly_quota: 1,
        quota_used: 0,
        design_type: rate.design_type,
        service_name: rate.service_name,
        auto_renew: false,
      });
      return order;
    },
    onSuccess: async (order) => {
      // Always land on the unified checkout page — it offers Paychangu
      // (Airtel Money/TNM Mpamba/card) AND manual bank/mobile-money proof
      // side by side, so Malawi clients aren't forced into one method.
      queryClient.invalidateQueries({ queryKey: ['myDesignOrders'] });
      navigate(`/designs/payment?order_id=${order.id}`);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to start your order. Please try again.');
      setOrderingId(null);
    },
  });

  function handleOrder(rate) {
    setOrderingId(rate.id);
    createOrderMutation.mutate(rate);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading">Graphic Design Services</h2>
        <p className="text-muted-foreground">Pick a service and pay per design — no monthly commitment.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !rates?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No design services available right now — check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map(rate => (
            <Card key={rate.id} className="border-border hover:border-[hsl(var(--primary))]/40 transition-colors">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <Palette className="w-5 h-5 text-purple-700" />
                </div>
                <h3 className="font-semibold text-base">{rate.service_name}</h3>
                <p className="text-2xl font-bold font-heading mt-1">{rate.symbol}{Number(rate.price).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mb-4">one-off • {rate.max_revisions} revisions included</p>
                <Button
                  className="w-full mt-auto gap-2"
                  onClick={() => handleOrder(rate)}
                  disabled={createOrderMutation.isPending && orderingId === rate.id}
                >
                  {createOrderMutation.isPending && orderingId === rate.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting order...</>
                  ) : (
                    <>Order This Design <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
