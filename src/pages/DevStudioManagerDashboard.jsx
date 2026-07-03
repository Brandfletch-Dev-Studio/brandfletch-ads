import DeptManagerDashboard from '@/components/department/DeptManagerDashboard';
import { DEVSTUDIO_CONFIG } from '@/lib/departmentOrderConfigs';

export default function DevStudioManagerDashboard() {
  return <DeptManagerDashboard config={DEVSTUDIO_CONFIG} adminPath="/admin/dev-studio" />;
}
