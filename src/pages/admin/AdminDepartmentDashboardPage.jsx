import React from 'react';
import { AdminLayout } from '../../components/layouts';
import DepartmentDashboard from '../../components/department/DepartmentDashboard';

const AdminDepartmentDashboardPage = () => {
  return (
    <AdminLayout>
      {/* showServiceAvailed option is commented out / disabled */}
      <DepartmentDashboard adminView={true} showServiceAvailed={false} />
    </AdminLayout>
  );
};

export default AdminDepartmentDashboardPage;
