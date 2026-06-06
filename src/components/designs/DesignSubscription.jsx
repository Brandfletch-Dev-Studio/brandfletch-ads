import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, RefreshCcw, FileText, DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSubscription({ onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isMalawi, setIsMalawi] = useState(false);
  const [paychanguLoading, setPaychanguLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: retainerPricing } = useQuery({
    queryKey: ['designPricing'],
    queryFn: () => base44.entities.DesignPricing.filter({ pricing_type: 'retainer', is_active: true }).then(r => r[0]),
  });

  useEffect(() => {
    if (user) {
      const userCountry = user.country || '';
      const isMW = userCountry.toLowerCase() === 'malawi' || userCountry.toUpperCase() === 'MW';
      setIsMalawi(isMW);
    }
  }, [user]);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planData) => {
      const startDate = new Date();
      const resetDate = new Date(startDate);
      resetDate.setMonth(resetDate.getMonth() + 1);
      const subscription = await base44.entities.PlatformSubscription.create({
        user_id: user.id,
        subscription_type: 'design_retainer',
        status: 'pending',
        amount: planData.amount,
        currency: planData.currency,
        start_date: startDate.toISOString().split('T')[0],
        monthly_quota: planData.monthlyQuota,
        quota_used: 0,
        quota_reset_date: resetDate.toISOString().split('T')[0],
        auto_renew: true,
      });

      return subscription;
    },
    onSuccess: (subscription) => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      
      if (isMalawi) {
        // Malawi: redirect straight to Paychangu
        handlePaychanguRedirect(subscription);
      } else {
        // Other countries: go to manual payment page
        toast.success('Subscription initiated! Proceed to payment...');
        setTimeout(() => {
          navigate('/designs/payment');
        }, 500);
      }
      
      if (onSubscribe) {
        onSubscribe();
      }
    },
  });

  async function handlePaychanguRedirect(subscription) {
    setPaychanguLoading(true);
    const txRef = `BF-DESIGN-${subscription.id}-${Date.now()}`;
    const appUrl = window.location.origin;

    const res = await base44.functions.invoke('paychanguCheckout', {
      amount: subscription.amount,
      currency: subscription.currency || 'MWK',
      tx_ref: txRef,
      description: 'Design Subscription - Monthly Retainer',
      callback_url: `${appUrl}/designs?paychangu_tx=${txRef}&payment_type=design&sub_id=${subscription.id}`,
      return_url: `${appUrl}/designs`,
    });

    setPaychanguLoading(false);

    if (res.data?.checkout_url) {
      window.location.href = res.data.checkout_url;
    } else {
      toast.error(res.data?.error || 'Failed to initiate payment');
    }
  }

  const plan = {
    id: 'monthly',
    name: 'Monthly Retainer',
    price: retainerPricing?.price || 50000,
    currency: retainerPricing?.currency || 'MWK',
    symbol: retainerPricing?.symbol || 'MK',
    monthlyQuota: retainerPricing?.monthly_quota || 20,
    description: 'Best value for growing businesses',
    features: [
      `Up to ${retainerPricing?.monthly_quota || 20} designs per month`,
      `${retainerPricing?.max_revisions || 5} revisions per project`,
      'High-quality creatives',
      'Ad-optimized for best performance',
      'Priority support',
      'Save on design costs',
      'Roll over unused designs',
      'Dedicated designer',
    ],
  };

  const handleSubscribe = () => {
    createSubscriptionMutation.mutate({
      planType: 'monthly',
      amount: plan.price,
      currency: plan.currency,
      monthlyQuota: plan.monthlyQuota,
    });
    
    if (onSubscribe) {
      onSubscribe();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading">Design Subscription Plan</h2>
        <p className="text-muted-foreground">Unlimited creative support for your business</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Palette className="w-6 h-6 text-purple-700" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold">{plan.symbol}{plan.price.toLocaleString()}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handleSubscribe}
            disabled={createSubscriptionMutation.isPending || paychanguLoading}
          >
            {createSubscriptionMutation.isPending || paychanguLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
            ) : isMalawi ? (
              <><>Subscribe & Pay with Paychangu</> <ExternalLink className="w-4 h-4 ml-2" /></>
            ) : (
              'Subscribe Now'
            )}
          </Button>
          {isMalawi && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              You'll be redirected to secure checkout
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-semibold text-green-900 mb-2 text-base">What You Get</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Professional design brief template</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  <span>High-quality, ad-optimized creatives</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Multiple revision rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Save on design costs vs freelancers</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}