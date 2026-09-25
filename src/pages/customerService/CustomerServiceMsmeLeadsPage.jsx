import ClientLayout from '../../components/layouts/ClientLayout';
import MsmeDprCustomersCardDashboard from '../../components/msmeDpr/MsmeDprCustomersCardDashboard';

/**
 * CS-facing MSME customers dashboard (card UI).
 * Separate from admin MsmeDprDashboard — do not reuse that table component here.
 */
const CustomerServiceMsmeLeadsPage = () => (
  <ClientLayout>
    <MsmeDprCustomersCardDashboard showGenerateReport title="My Customers" />
  </ClientLayout>
);

export default CustomerServiceMsmeLeadsPage;
