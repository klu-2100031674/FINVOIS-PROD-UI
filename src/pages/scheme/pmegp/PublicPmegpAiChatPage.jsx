import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import SchemeAiChatView from '../aiChat/SchemeAiChatView';
import { PUBLIC_PMEGP_FORM_PATH } from '../../../components/forms/scheme/pmegpSchemeMailConstants';
import { PMEGP_AI_CHAT_CONFIG } from './pmegpAiChatConfig';

const PublicPmegpAiChatPage = () => {
  return (
    <PublicPmepgChrome contentClassName="pb-3">
      <div className="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
        <SchemeAiChatView generatePath={PUBLIC_PMEGP_FORM_PATH} config={PMEGP_AI_CHAT_CONFIG} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicPmegpAiChatPage;
