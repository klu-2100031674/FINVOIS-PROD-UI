import { useLocation } from 'react-router-dom';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PmegpSchemeMailForm from '../../../components/forms/scheme/PmegpSchemeMailForm';

const PmegpSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.pmegpForm?.fullName || '').trim() || 'Applicant';

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <PmegpSchemeMailForm
        fullName={fullName}
        hasPmegpFormPayload={!!location.state?.pmegpForm}
        linkState={location.state}
      />
    </ClientLayout>
  );
};

export default PmegpSchemeMailPage;
