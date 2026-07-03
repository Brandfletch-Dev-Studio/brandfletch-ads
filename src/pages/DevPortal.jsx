import DeptPortal from '@/components/department/DeptPortal';
import { DEVSTUDIO_CONFIG } from '@/lib/departmentOrderConfigs';

export default function DevPortal() {
  return <DeptPortal config={DEVSTUDIO_CONFIG} />;
}
