import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import ApIdpSchemeMailForm from '../../../components/forms/scheme/ApIdpSchemeMailForm';
import {
  PUBLIC_AP_IDP_AI_CHAT_PATH,
  PUBLIC_AP_IDP_FORM_PATH,
} from '../../../components/forms/scheme/apIdpSchemeMailConstants';
import { resolveSchemeFormData } from '../../../utils/schemeFormSession';

const PublicApIdpSchemeMailPage = () => {
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
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <ApIdpSchemeMailForm
          fullName={fullName}
          hasApIdpFormPayload={!!apIdpForm}
          linkState={linkState}
          apIdpFormPath={PUBLIC_AP_IDP_FORM_PATH}
          apIdpAiChatPath={PUBLIC_AP_IDP_AI_CHAT_PATH}
          supportSource="ui:ap-idp-scheme-mail-public"
        />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicApIdpSchemeMailPage;
