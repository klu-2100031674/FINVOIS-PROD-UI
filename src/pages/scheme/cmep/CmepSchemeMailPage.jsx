import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import CmepSchemeMailForm from '../../../components/forms/scheme/CmepSchemeMailForm';
import { resolveSchemeFormData } from '../../../utils/schemeFormSession';

const CmepSchemeMailPage = () => {
  const location = useLocation();
  const cmepForm = useMemo(
    () => resolveSchemeFormData('cmepForm', location.state),
    [location.state],
  );
  const linkState = useMemo(
    () => (cmepForm ? { ...(location.state || {}), cmepForm } : location.state),
    [location.state, cmepForm],
  );
  const fullName = (cmepForm?.fullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <CmepSchemeMailForm
        fullName={fullName}
        hasCmepFormPayload={!!cmepForm}
        linkState={linkState}
      />
    </ClientLayout>
  );
};

export default CmepSchemeMailPage;
