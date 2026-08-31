import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import { BoiVerificationProvider } from '../../../context/BoiVerificationContext';
import BoiHousingVerificationForm from '../../../components/executive/boi/BoiHousingVerificationForm';

const BoiHousingPage = () => (
  <ClientLayout>
    <BoiVerificationProvider>
      <BoiHousingVerificationForm />
    </BoiVerificationProvider>
  </ClientLayout>
);

export default BoiHousingPage;
