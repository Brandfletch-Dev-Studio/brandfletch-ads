import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OrderModal({ service, user, exchangeRates, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const userCountry = user?.country || 'Malawi';
  const exchangeRate = exchangeRates.find(r => r.country === userCountry);
  const currency = exchangeRate?.currency_code || 'USD';
  const symbol = exchangeRate?.symbol || '$';

  const localCost = exchangeRate && !exchangeRate.use_fixed_pricing
    ? service.price_usd * exchangeRate.rate_to_usd
    : service.price_usd;

  const displayCost = exchangeRate && !exchangeRate.use_fixed_pricing
    ? `${symbol} ${localCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${service.price_usd.toFixed(2)}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.ServiceOrder.create({
        user_id: user.id,
        service_id: service.id,
        service_name: service.name,
        price_usd: service.price_usd,
        currency,
        total_cost: localCost,
        total_cost_usd: service.price_usd,
        notes,
        status: 'pending'
      });

      toast.success('Order submitted! Admin will review shortly.');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      onClose();
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order {service.name}</DialogTitle>
          <DialogDescription>
            Submit your request for this service. Our team will review and contact you shortly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input id="service" value={service.name} disabled className="bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={displayCost} disabled className="bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Requirements / Notes <span className="text-muted-foreground text-xs">(Optional)</span></Label>
              <Textarea
                id="notes"
                placeholder="Describe what you need, any specific requirements, timelines, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}