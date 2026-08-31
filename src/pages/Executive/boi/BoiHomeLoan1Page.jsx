import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import BoiHomeLoanVerificationForm from '../../../components/executive/boi/BoiHomeLoanVerificationForm';

const BoiHomeLoan1Page = () => (
  <ClientLayout>
    <BoiHomeLoanVerificationForm applicantCount={1} />
  </ClientLayout>
);

export default BoiHomeLoan1Page;
