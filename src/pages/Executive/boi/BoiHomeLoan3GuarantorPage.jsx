import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import BoiHomeLoanVerificationForm from '../../../components/executive/boi/BoiHomeLoanVerificationForm';

const BoiHomeLoan3GuarantorPage = () => (
  <ClientLayout>
    <BoiHomeLoanVerificationForm applicantCount={3} isGuarantor={true} />
  </ClientLayout>
);

export default BoiHomeLoan3GuarantorPage;
