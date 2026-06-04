import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Palette, RefreshCcw, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSubscription({ onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => base44.entities.PaymentMethod.filter({ is_active: true }).then(r => r.sort((a, b) => a.sort_order - b.sort_order)),
  });

  const { data: designPricing } = useQuery({
    queryKey: ['designPricing'],
    queryFn: () => base44.entities.DesignPricing.filter({ is_active: true }),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planData) => {
      // Create pending subscription record
      const subscription = await base44.entities.PlatformSubscription.create({
        user_id: user.id,
        subscription_type: 'design_retainer',
        status: 'pending',
        amount: planData.amount,
        currency: planData.currency,
        start_date: new Date().toISOString().split('T')[0],
        auto_renew: true,
      });

      // Create service order for payment processing
      await base44.entities.ServiceOrder.create({
        user_id: user.id,
        service_id: planData.planType === 'monthly' ? 'design_retainer_monthly' : 'design_per_design',
        service_name: planData.planType === 'monthly' ? 'Monthly Design Retainer' : 'Pay Per Design',
        total_cost: planData.amount,
        total_cost_usd: planData.planType === 'monthly' ? (retainerPricing?.price || 50000) / 1000 : (perDesignPricing?.price || 15000) / 1000,
        currency: planData.currency,
        status: 'pending',
      });

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast.success('Subscription initiated! Redirecting to payment...');
      setTimeout(() => {
        navigate('/designs/payment');
      }, 500);
    },
  });

  const perDesignPricing = designPricing?.find(p => p.pricing_type === 'per_design');
  const retainerPricing = designPricing?.find(p => p.pricing_type === 'retainer');

  const plans = [
    {
      id: 'per_design',
      name: 'Pay Per Design',
      price: perDesignPricing?.price || 15000,
      currency: perDesignPricing?.currency || 'MWK',
      symbol: perDesignPricing?.symbol || 'MK',
      description: 'Perfect for one-off design needs',
      features: [
        '1 professional design',
        `${perDesignPricing?.max_revisions || 2} revisions included`,
        'High-quality creatives',
        'Ad-optimized designs',
        '48-hour delivery',
        'No monthly commitment',
      ],
      popular: false,
    },
    {
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
      popular: true,
    },
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    
    createSubscriptionMutation.mutate({
      planType: selectedPlan.id,
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading">Choose Your Design Plan</h2>
        <p className="text-muted-foreground">Select the plan that best fits your business needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan?.id === plan.id ? 'border-2 border-blue-500 ring-2 ring-blue-200' : ''
            } ${plan.popular ? 'border-blue-300 bg-blue-50' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            <CardHeader className="pb-4">
              {plan.popular && (
                <Badge className="w-fit mb-2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-purple-700" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold">{plan.symbol}{plan.price.toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4"
                variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                size="sm"
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2 text-base">Next Steps</h4>
                <ol className="space-y-1.5 text-xs text-blue-800">
                  <li>1. Click "Proceed to Payment" to continue</li>
                  <li>2. Complete payment using your preferred method</li>
                  <li>3. Submit payment proof for verification</li>
                  <li>4. Once approved, you can start requesting designs immediately</li>
                </ol>
                {paymentMethods && paymentMethods.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-1.5">Available Payment Methods:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {paymentMethods.slice(0, 4).map((method) => (
                        <Badge key={method.id} variant="outline" className="text-xs bg-white">
                          {method.method_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4" size="sm" onClick={handleProceedToPayment}>
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-semibold text-green-900 mb-2 text-base">All Plans Include</h4>
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
                  <span>Revision rounds as per plan</span>
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