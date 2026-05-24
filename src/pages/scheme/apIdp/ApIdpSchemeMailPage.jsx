import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import ApIdpSchemeMailForm from '../../../components/forms/scheme/ApIdpSchemeMailForm';

const ApIdpSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.apIdpForm?.ownerFullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <ApIdpSchemeMailForm
        fullName={fullName}
        hasApIdpFormPayload={!!location.state?.apIdpForm}
        linkState={location.state}
      />
    </ClientLayout>
  );
};

export default ApIdpSchemeMailPage;
