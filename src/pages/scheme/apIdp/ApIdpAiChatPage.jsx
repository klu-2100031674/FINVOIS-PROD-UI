import ClientLayout from '../../../components/layouts/ClientLayout';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { AP_IDP_GENERATE_PATH } from '../../../components/forms/scheme/apIdpSchemeMailConstants';
import { AP_IDP_AI_CHAT_CONFIG } from './apIdpAiChatConfig';

const ApIdpAiChatPage = () => {
  return (
    <ClientLayout wideContent shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="flex-1 min-h-0 flex flex-col pb-1">
        <SchemeAiChatView generatePath={AP_IDP_GENERATE_PATH} config={AP_IDP_AI_CHAT_CONFIG} />
      </div>
    </ClientLayout>
  );
};

export default ApIdpAiChatPage;
