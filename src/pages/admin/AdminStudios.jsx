import DeptOrderAdmin from '@/components/department/DeptOrderAdmin';
import { STUDIOS_CONFIG } from '@/lib/departmentOrderConfigs';

export default function AdminStudios() {
  return <DeptOrderAdmin config={STUDIOS_CONFIG} />;
}
