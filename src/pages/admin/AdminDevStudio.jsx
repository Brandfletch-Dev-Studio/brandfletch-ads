import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, DollarSign } from 'lucide-react';
import DeptOrderAdmin from '@/components/department/DeptOrderAdmin';
import ServiceRateManager from '@/components/department/ServiceRateManager';
import { DEVSTUDIO_CONFIG } from '@/lib/departmentOrderConfigs';

export default function AdminDevStudio() {
  return (
    <Tabs defaultValue="orders">
      <TabsList className="mx-4 mt-6 sm:mx-6">
        <TabsTrigger value="orders" className="gap-2"><ClipboardList className="w-4 h-4" /> Orders</TabsTrigger>
        <TabsTrigger value="pricing" className="gap-2"><DollarSign className="w-4 h-4" /> Pricing</TabsTrigger>
      </TabsList>
      <TabsContent value="orders">
        <DeptOrderAdmin config={DEVSTUDIO_CONFIG} />
      </TabsContent>
      <TabsContent value="pricing" className="max-w-7xl mx-auto px-4 pb-8">
        <ServiceRateManager config={DEVSTUDIO_CONFIG} />
      </TabsContent>
    </Tabs>
  );
}
