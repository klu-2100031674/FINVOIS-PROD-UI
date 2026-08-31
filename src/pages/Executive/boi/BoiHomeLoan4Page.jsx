import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import BoiHomeLoanVerificationForm from '../../../components/executive/boi/BoiHomeLoanVerificationForm';

const BoiHomeLoan4Page = () => (
  <ClientLayout>
    <BoiHomeLoanVerificationForm applicantCount={4} />
  </ClientLayout>
);

export default BoiHomeLoan4Page;
