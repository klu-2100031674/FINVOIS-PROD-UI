import { useLocation } from 'react-router-dom';
import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import CmepSchemeMailForm from '../../../components/forms/scheme/CmepSchemeMailForm';
import {
  PUBLIC_CMEP_AI_CHAT_PATH,
  PUBLIC_CMEP_FORM_PATH,
} from '../../../components/forms/scheme/cmepSchemeMailConstants';

const PublicCmepSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.cmepForm?.fullName || '').trim() || 'Applicant';

  return (
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <CmepSchemeMailForm
          fullName={fullName}
          hasCmepFormPayload={!!location.state?.cmepForm}
          linkState={location.state}
          cmepFormPath={PUBLIC_CMEP_FORM_PATH}
          cmepAiChatPath={PUBLIC_CMEP_AI_CHAT_PATH}
          supportSource="ui:cmep-scheme-mail-public"
        />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicCmepSchemeMailPage;
