import { AdminLayout } from '@/components/layouts';
import MsmeDprDashboard from '@/components/msmeDpr/MsmeDprDashboard';

const AdminMsmeDprDashboardPage = () => (
  <AdminLayout>
    <MsmeDprDashboard
      showEmailConfig
      // showDelete // single + multi select/delete
      // showGenerateReport
    />
  </AdminLayout>
);

export default AdminMsmeDprDashboardPage;
