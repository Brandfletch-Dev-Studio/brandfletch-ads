import DeptOrderPage from '@/pages/department/DeptOrderPage';
import { DEVSTUDIO_CONFIG } from '@/lib/departmentOrderConfigs';
import { Code2 } from 'lucide-react';

// Websites, Apps, Automations, AI Agents — websites are fixed-price,
// the rest are custom-quote (no payment step, brief goes straight to
// our Dev Studio team for a quote).
export default function DevStudio() {
  return (
    <DeptOrderPage
      config={DEVSTUDIO_CONFIG}
      routePath="/dev-studio"
      icon={Code2}
      tagline="Websites, apps, automations & AI agents — built by our Dev Studio team."
    />
  );
}
