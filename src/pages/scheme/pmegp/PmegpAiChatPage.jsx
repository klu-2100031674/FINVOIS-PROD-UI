import ClientLayout from '../../../components/layouts/ClientLayout';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { PMEGP_GENERATE_PATH } from '../../../components/forms/scheme/pmegpSchemeMailConstants';
import { PMEGP_AI_CHAT_CONFIG } from './pmegpAiChatConfig';

const PmegpAiChatPage = () => {
  return (
    <ClientLayout wideContent shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="flex-1 min-h-0 flex flex-col pb-1">
        <SchemeAiChatView generatePath={PMEGP_GENERATE_PATH} config={PMEGP_AI_CHAT_CONFIG} />
      </div>
    </ClientLayout>
  );
};

export default PmegpAiChatPage;
