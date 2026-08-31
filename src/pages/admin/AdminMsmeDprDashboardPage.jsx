import { AdminLayout } from '@/components/layouts';
import MsmeDprDashboard from '@/components/msmeDpr/MsmeDprDashboard';

const AdminMsmeDprDashboardPage = () => (
  <AdminLayout>
    <MsmeDprDashboard
      showServiceAvailed
      showEmailConfig
      // showDelete // Uncomment to enable option to delete a form data
    />
  </AdminLayout>
);

export default AdminMsmeDprDashboardPage;
