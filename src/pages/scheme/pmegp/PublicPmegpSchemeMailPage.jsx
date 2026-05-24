import { useLocation } from 'react-router-dom';
import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import PmegpSchemeMailForm from '../../../components/forms/scheme/PmegpSchemeMailForm';
import {
  PUBLIC_PMEGP_AI_CHAT_PATH,
  PUBLIC_PMEGP_FORM_PATH,
} from '../../../components/forms/scheme/pmegpSchemeMailConstants';

const PublicPmegpSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.pmegpForm?.fullName || '').trim() || 'Applicant';

  return (
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <PmegpSchemeMailForm
          fullName={fullName}
          hasPmegpFormPayload={!!location.state?.pmegpForm}
          linkState={location.state}
          pmegpFormPath={PUBLIC_PMEGP_FORM_PATH}
          pmegpAiChatPath={PUBLIC_PMEGP_AI_CHAT_PATH}
          supportSource="ui:pmegp-scheme-mail-public"
        />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicPmegpSchemeMailPage;
