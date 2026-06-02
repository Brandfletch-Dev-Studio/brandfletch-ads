import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatLocalCurrency, COUNTRY_CURRENCY } from '@/lib/constants';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = {
  page_setup: 'Page Setup',
  ads_management: 'Ads Management',
  content_creation: 'Content Creation',
  consulting: 'Consulting',
  other: 'Other',
};

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-active'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }, 'sort_order'),
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }),
  });

  const country = user?.country;
  const rate = exchangeRates.find(r => r.country === country);
  const currencyInfo = COUNTRY_CURRENCY[country];

  function localPrice(usdAmount) {
    if (!rate || !currencyInfo) return `$${usdAmount.toFixed(2)}`;
    const local = usdAmount * rate.rate_to_usd;
    const formatted = local >= 1000
      ? local.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : local.toFixed(2);
    return `${currencyInfo.symbol} ${formatted}`;
  }

  const grouped = CATEGORY_LABELS
    ? Object.keys(CATEGORY_LABELS).map(cat => ({
        cat,
        label: CATEGORY_LABELS[cat],
        items: services.filter(s => s.category === cat),
      })).filter(g => g.items.length > 0)
    : [];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Marketplace
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Professional services to grow your business
          {country && currencyInfo && (
            <span className="ml-1">— prices shown in {currencyInfo.name} ({currencyInfo.code})</span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(service => (
                  <div key={service.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-base">{service.name}</h3>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-[hsl(var(--primary))]">{localPrice(service.price_usd)}</p>
                          <p className="text-xs text-muted-foreground">(${service.price_usd} USD)</p>
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                      )}
                    </div>
                    <Button
                      className="mt-4 w-full bg-[hsl(var(--primary))] text-primary-foreground font-semibold"
                      onClick={() => {
                        if (service.category === 'page_setup') navigate('/pages');
                        else navigate('/messages');
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Get Started
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}