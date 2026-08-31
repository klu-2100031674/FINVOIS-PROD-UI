import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import BoiHomeLoanVerificationForm from '../../../components/executive/boi/BoiHomeLoanVerificationForm';

const BoiHomeLoan2Page = () => (
  <ClientLayout>
    <BoiHomeLoanVerificationForm applicantCount={2} />
  </ClientLayout>
);

export default BoiHomeLoan2Page;
