import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import CmepSchemeMailForm from '../../../components/forms/scheme/CmepSchemeMailForm';

const CmepSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.cmepForm?.fullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <CmepSchemeMailForm
        fullName={fullName}
        hasCmepFormPayload={!!location.state?.cmepForm}
        linkState={location.state}
      />
    </ClientLayout>
  );
};

export default CmepSchemeMailPage;
