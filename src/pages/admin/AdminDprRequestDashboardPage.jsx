import { AdminLayout } from '@/components/layouts';
import DprRequestDashboard from '@/components/dprRequest/DprRequestDashboard';

const AdminDprRequestDashboardPage = () => (
  <AdminLayout>
    <DprRequestDashboard
      showEmailConfig
      // showDelete // single + multi select/delete
      // showGenerateReport
    />
  </AdminLayout>
);

export default AdminDprRequestDashboardPage;
