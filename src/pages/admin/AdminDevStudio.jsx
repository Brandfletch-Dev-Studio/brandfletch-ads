import DeptOrderAdmin from '@/components/department/DeptOrderAdmin';
import { DEVSTUDIO_CONFIG } from '@/lib/departmentOrderConfigs';

export default function AdminDevStudio() {
  return <DeptOrderAdmin config={DEVSTUDIO_CONFIG} />;
}
