import { AdminLayout } from '@/components/layouts';
import MepmaDprDashboard from '@/components/mepmaDpr/MepmaDprDashboard';

const AdminMepmaDprDashboardPage = () => (
  <AdminLayout>
    <MepmaDprDashboard
      showEmailConfig
      // showDelete // single + multi select/delete
      // showGenerateReport
    />
  </AdminLayout>
);

export default AdminMepmaDprDashboardPage;
