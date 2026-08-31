import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import CmepSchemeMailForm from '../../../components/forms/scheme/CmepSchemeMailForm';
import {
  PUBLIC_CMEP_AI_CHAT_PATH,
  PUBLIC_CMEP_FORM_PATH,
} from '../../../components/forms/scheme/cmepSchemeMailConstants';
import { resolveSchemeFormData } from '../../../utils/schemeFormSession';

const PublicCmepSchemeMailPage = () => {
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
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <CmepSchemeMailForm
          fullName={fullName}
          hasCmepFormPayload={!!cmepForm}
          linkState={linkState}
          cmepFormPath={PUBLIC_CMEP_FORM_PATH}
          cmepAiChatPath={PUBLIC_CMEP_AI_CHAT_PATH}
          supportSource="ui:cmep-scheme-mail-public"
        />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicCmepSchemeMailPage;
