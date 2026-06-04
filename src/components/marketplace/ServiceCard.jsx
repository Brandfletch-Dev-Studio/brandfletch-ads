import { COUNTRY_CURRENCY } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export default function ServiceCard({ service, user, exchangeRates, onOrder }) {
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

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {service.image_url && (
        <img src={service.image_url} alt={service.name} className="w-full h-36 object-cover" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base leading-tight">{service.name}</h3>
            <p className="font-bold text-lg text-[hsl(var(--primary))] flex-shrink-0">
              {localPrice(service.price_usd)}
            </p>
          </div>
          {service.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
          )}
        </div>
        <Button
          className="mt-4 w-full bg-[hsl(var(--primary))] text-primary-foreground font-semibold gap-2"
          onClick={onOrder}
        >
          <ShoppingCart className="w-4 h-4" /> Order Now
        </Button>
      </div>
    </div>
  );
}