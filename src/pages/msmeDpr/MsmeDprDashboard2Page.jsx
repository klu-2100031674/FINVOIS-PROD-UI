import { MsmeDprDashboardLayout } from '@/components/layouts';
import MsmeDprCustomersCardDashboard from '@/components/msmeDpr/MsmeDprCustomersCardDashboard';

/**
 * New card-style MSME "My Customers" dashboard (viewer).
 * Old table dashboard remains at /msme-dpr-dashboard.
 */
const MsmeDprDashboard2Page = () => (
  <MsmeDprDashboardLayout>
    <MsmeDprCustomersCardDashboard title="My Customers" />
  </MsmeDprDashboardLayout>
);

export default MsmeDprDashboard2Page;
