import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import SbiBussinessVerificationForm from '../../../components/executive/SbiBussinessVerificationForm';

const SbiBusinessPage = () => (
  <ClientLayout>
    <div className="mb-4">
      <Link
        to="/executive/sbi/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-[#7e22ce]"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to dashboard
      </Link>
    </div>
    <SbiBussinessVerificationForm />
  </ClientLayout>
);

export default SbiBusinessPage;
