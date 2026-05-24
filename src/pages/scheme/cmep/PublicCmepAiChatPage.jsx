import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { PUBLIC_CMEP_FORM_PATH } from '../../../components/forms/scheme/cmepSchemeMailConstants';
import { CMEP_AI_CHAT_CONFIG } from './cmepAiChatConfig';

const PublicCmepAiChatPage = () => {
  return (
    <PublicPmepgChrome wideContent>
      <div className="flex-1 min-h-0 flex flex-col pb-1 max-w-5xl mx-auto w-full">
        <SchemeAiChatView generatePath={PUBLIC_CMEP_FORM_PATH} config={CMEP_AI_CHAT_CONFIG} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicCmepAiChatPage;
