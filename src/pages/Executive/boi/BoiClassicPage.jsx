import React from 'react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import { BoiVerificationProvider } from '../../../context/BoiVerificationContext';
import BoiVerificationForm from '../../../components/executive/boi/BoiVerificationForm';

const BoiClassicPage = () => (
  <ClientLayout>
    <BoiVerificationProvider>
      <BoiVerificationForm />
    </BoiVerificationProvider>
  </ClientLayout>
);

export default BoiClassicPage;
