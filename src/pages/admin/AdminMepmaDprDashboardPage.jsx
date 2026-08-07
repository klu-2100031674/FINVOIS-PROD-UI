import { AdminLayout } from '@/components/layouts';
import MepmaDprDashboard from '@/components/mepmaDpr/MepmaDprDashboard';

const AdminMepmaDprDashboardPage = () => (
  <AdminLayout>
    <MepmaDprDashboard showServiceAvailed showEmailConfig showDelete />
  </AdminLayout>
);

export default AdminMepmaDprDashboardPage;
