import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import BoiHomeLoanVerificationForm from '../../../components/executive/boi/BoiHomeLoanVerificationForm';

const BoiHomeLoan3Page = () => (
  <ClientLayout>
    <BoiHomeLoanVerificationForm applicantCount={3} />
  </ClientLayout>
);

export default BoiHomeLoan3Page;
