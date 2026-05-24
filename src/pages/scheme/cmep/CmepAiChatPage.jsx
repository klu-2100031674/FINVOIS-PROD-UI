import ClientLayout from '../../../components/layouts/ClientLayout';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { CMEP_GENERATE_PATH } from '../../../components/forms/scheme/cmepSchemeMailConstants';
import { CMEP_AI_CHAT_CONFIG } from './cmepAiChatConfig';

const CmepAiChatPage = () => {
  return (
    <ClientLayout wideContent shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="flex-1 min-h-0 flex flex-col pb-1">
        <SchemeAiChatView generatePath={CMEP_GENERATE_PATH} config={CMEP_AI_CHAT_CONFIG} />
      </div>
    </ClientLayout>
  );
};

export default CmepAiChatPage;
