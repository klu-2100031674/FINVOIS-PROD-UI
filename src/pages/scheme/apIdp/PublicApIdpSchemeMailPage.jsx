import { useLocation } from 'react-router-dom';
import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import ApIdpSchemeMailForm from '../../../components/forms/scheme/ApIdpSchemeMailForm';
import {
  PUBLIC_AP_IDP_AI_CHAT_PATH,
  PUBLIC_AP_IDP_FORM_PATH,
} from '../../../components/forms/scheme/apIdpSchemeMailConstants';

const PublicApIdpSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.apIdpForm?.ownerFullName || '').trim() || 'Applicant';

  return (
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <ApIdpSchemeMailForm
          fullName={fullName}
          hasApIdpFormPayload={!!location.state?.apIdpForm}
          linkState={location.state}
          apIdpFormPath={PUBLIC_AP_IDP_FORM_PATH}
          apIdpAiChatPath={PUBLIC_AP_IDP_AI_CHAT_PATH}
          supportSource="ui:ap-idp-scheme-mail-public"
        />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicApIdpSchemeMailPage;
