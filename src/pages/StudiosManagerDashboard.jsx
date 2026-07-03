import DeptManagerDashboard from '@/components/department/DeptManagerDashboard';
import { STUDIOS_CONFIG } from '@/lib/departmentOrderConfigs';

export default function StudiosManagerDashboard() {
  return <DeptManagerDashboard config={STUDIOS_CONFIG} adminPath="/admin/studios" />;
}
