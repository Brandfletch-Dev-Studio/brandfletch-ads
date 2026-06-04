import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Palette, RefreshCcw, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSubscription({ onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: exchangeRate } = useQuery({
    queryKey: ['exchangeRate'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }).then(r => r[0]),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planData) => {
      const subscription = await base44.entities.PlatformSubscription.create({
        user_id: user.id,
        subscription_type: 'design_retainer',
        status: 'pending',
        amount: planData.amount,
        currency: planData.currency,
        start_date: new Date().toISOString().split('T')[0],
        auto_renew: true,
      });

      // Create design request with payment pending
      if (planData.planType === 'per_design') {
        // For per-design, create a pending design request
        await base44.entities.DesignRequest.create({
          user_id: user.id,
          title: 'Per Design Order',
          description: 'Awaiting payment and project brief',
          design_type: 'other',
          request_type: 'per_design',
          status: 'draft',
          priority: 'medium',
          price: planData.amount,
          currency: planData.currency,
        });
      }

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast.success('Subscription initiated! Complete payment to activate.');
      onSubscribe?.();
    },
  });

  const plans = [
    {
      id: 'per_design',
      name: 'Pay Per Design',
      price: 15000,
      currency: 'MWK',
      usd: 17,
      description: 'Perfect for one-off design needs',
      features: [
        '1 professional design',
        '2 revisions included',
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
      price: 50000,
      currency: 'MWK',
      usd: 57,
      description: 'Best value for growing businesses',
      features: [
        'Up to 20 designs per month',
        '5 revisions per project',
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan?.id === plan.id ? 'border-2 border-blue-500 ring-2 ring-blue-200' : ''
            } ${plan.popular ? 'border-blue-300 bg-blue-50' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            <CardHeader>
              {plan.popular && (
                <Badge className="w-fit mb-2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{plan.currency}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ ${plan.usd} USD
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6"
                variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li>1. Click "Proceed to Payment" to continue</li>
                  <li>2. Complete payment using your preferred method</li>
                  <li>3. Submit payment proof for verification</li>
                  <li>4. Once approved, you can start requesting designs immediately</li>
                </ol>
                <Button className="w-full mt-4" onClick={handleProceedToPayment}>
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-2">All Plans Include</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Professional design brief template</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>High-quality, ad-optimized creatives</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  <span>Revision rounds as per plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
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