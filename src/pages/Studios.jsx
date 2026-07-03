import DeptOrderPage from '@/pages/department/DeptOrderPage';
import { STUDIOS_CONFIG } from '@/lib/departmentOrderConfigs';
import { Clapperboard } from 'lucide-react';

// Content Creation, Podcast, Videography, Photography — priced via the
// ServiceRate catalog. UGC Ads keeps its own dedicated flow at /ugc-ads.
export default function Studios() {
  return (
    <DeptOrderPage
      config={STUDIOS_CONFIG}
      routePath="/studios"
      icon={Clapperboard}
      tagline="Content creation, podcasts, videography & photography — produced by our Studios team."
    />
  );
}
