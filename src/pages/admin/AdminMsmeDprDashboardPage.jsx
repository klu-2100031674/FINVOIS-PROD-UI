import { AdminLayout } from '@/components/layouts';
import MsmeDprDashboard from '@/components/msmeDpr/MsmeDprDashboard';

const AdminMsmeDprDashboardPage = () => (
  <AdminLayout>
    <MsmeDprDashboard showServiceAvailed showEmailConfig />
  </AdminLayout>
);

export default AdminMsmeDprDashboardPage;
