import { AdminLayout } from '@/components/layouts';
import DprRequestDashboard from '@/components/dprRequest/DprRequestDashboard';

const AdminDprRequestDashboardPage = () => (
  <AdminLayout>
    <DprRequestDashboard
      showEmailConfig
      // showServiceAvailed // hidden — DPR workflow status replaces this column
      // showDelete // Uncomment to enable single + multi delete on form submissions
    />
  </AdminLayout>
);

export default AdminDprRequestDashboardPage;
