import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ClientLayout from '../../components/layouts/ClientLayout';
import SbiHouseVerificationForm from '../../components/executive/SbiHouseVerificationForm';

const ExecutiveSbiHousePage = () => (
  <ClientLayout>
    <div className="mb-4">
      <Link
        to="/executive/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-[#7e22ce]"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to dashboard
      </Link>
    </div>
    <SbiHouseVerificationForm />
  </ClientLayout>
);

export default ExecutiveSbiHousePage;
