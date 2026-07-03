import DeptPortal from '@/components/department/DeptPortal';
import { STUDIOS_CONFIG } from '@/lib/departmentOrderConfigs';

export default function StudioPortal() {
  return <DeptPortal config={STUDIOS_CONFIG} />;
}
