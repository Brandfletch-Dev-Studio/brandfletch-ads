import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ShoppingBag, Package, Wrench } from 'lucide-react';
import ServiceCard from '@/components/marketplace/ServiceCard';
import OrderModal from '@/components/marketplace/OrderModal';

export default function Marketplace() {
  const { user } = useAuth();
  const [ordering, setOrdering] = useState(null); // service object being ordered

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-active'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }, 'sort_order'),
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }),
  });

  const servicesList = services.filter(s => s.type !== 'product');
  const productsList = services.filter(s => s.type === 'product');

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Marketplace
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Professional services and products to grow your business</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Services Section */}
          {servicesList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-bold font-heading">Services</h2>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{servicesList.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicesList.map(s => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    user={user}
                    exchangeRates={exchangeRates}
                    onOrder={() => setOrdering(s)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Products Section */}
          {productsList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[hsl(var(--accent))]" />
                <h2 className="text-lg font-bold font-heading">Products</h2>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{productsList.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsList.map(s => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    user={user}
                    exchangeRates={exchangeRates}
                    onOrder={() => setOrdering(s)}
                  />
                ))}
              </div>
            </section>
          )}

          {services.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No items available yet</p>
              <p className="text-sm mt-1">Check back soon</p>
            </div>
          )}
        </div>
      )}

      {ordering && (
        <OrderModal
          service={ordering}
          user={user}
          exchangeRates={exchangeRates}
          onClose={() => setOrdering(null)}
        />
      )}
    </div>
  );
}