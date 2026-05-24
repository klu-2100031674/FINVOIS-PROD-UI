import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { PUBLIC_AP_IDP_FORM_PATH } from '../../../components/forms/scheme/apIdpSchemeMailConstants';
import { AP_IDP_AI_CHAT_CONFIG } from './apIdpAiChatConfig';

const PublicApIdpAiChatPage = () => {
  return (
    <PublicPmepgChrome contentClassName="pb-3">
      <div className="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
        <SchemeAiChatView generatePath={PUBLIC_AP_IDP_FORM_PATH} config={AP_IDP_AI_CHAT_CONFIG} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicApIdpAiChatPage;
