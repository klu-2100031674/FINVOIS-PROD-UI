import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PmegpSchemeMailForm from '../../../components/forms/scheme/PmegpSchemeMailForm';
import { resolveSchemeFormData } from '../../../utils/schemeFormSession';

const PmegpSchemeMailPage = () => {
  const location = useLocation();
  const pmegpForm = useMemo(
    () => resolveSchemeFormData('pmegpForm', location.state),
    [location.state],
  );
  const linkState = useMemo(
    () => (pmegpForm ? { ...(location.state || {}), pmegpForm } : location.state),
    [location.state, pmegpForm],
  );
  const fullName = (pmegpForm?.fullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <PmegpSchemeMailForm
        fullName={fullName}
        hasPmegpFormPayload={!!pmegpForm}
        linkState={linkState}
      />
    </ClientLayout>
  );
};

export default PmegpSchemeMailPage;
