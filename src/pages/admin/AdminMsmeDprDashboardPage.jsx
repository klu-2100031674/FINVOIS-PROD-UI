import { AdminLayout } from '@/components/layouts';
import MsmeDprDashboard from '@/components/msmeDpr/MsmeDprDashboard';

const AdminMsmeDprDashboardPage = () => (
  <AdminLayout>
    <MsmeDprDashboard
      showEmailConfig
      // showServiceAvailed // hidden — DPR workflow status replaces this column
      // showDelete // Uncomment to enable single + multi delete on form submissions
    />
  </AdminLayout>
);

export default AdminMsmeDprDashboardPage;
