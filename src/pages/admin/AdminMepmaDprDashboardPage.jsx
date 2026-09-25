import { AdminLayout } from '@/components/layouts';
import MepmaDprDashboard from '@/components/mepmaDpr/MepmaDprDashboard';

const AdminMepmaDprDashboardPage = () => (
  <AdminLayout>
    <MepmaDprDashboard showEmailConfig showDelete showGenerateReport />
  </AdminLayout>
);

export default AdminMepmaDprDashboardPage;
