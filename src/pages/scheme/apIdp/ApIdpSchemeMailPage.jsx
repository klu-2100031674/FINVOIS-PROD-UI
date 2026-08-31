import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import ApIdpSchemeMailForm from '../../../components/forms/scheme/ApIdpSchemeMailForm';
import { resolveSchemeFormData } from '../../../utils/schemeFormSession';

const ApIdpSchemeMailPage = () => {
  const location = useLocation();
  const apIdpForm = useMemo(
    () => resolveSchemeFormData('apIdpForm', location.state),
    [location.state],
  );
  const linkState = useMemo(
    () => (apIdpForm ? { ...(location.state || {}), apIdpForm } : location.state),
    [location.state, apIdpForm],
  );
  const fullName = (apIdpForm?.ownerFullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <ApIdpSchemeMailForm
        fullName={fullName}
        hasApIdpFormPayload={!!apIdpForm}
        linkState={linkState}
      />
    </ClientLayout>
  );
};

export default ApIdpSchemeMailPage;
